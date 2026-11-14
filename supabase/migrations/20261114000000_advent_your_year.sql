-- Advent Your Year — Supabase schema
-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- It creates the tables, the sharing and day-locking rules, the share-link functions and the
-- private photo bucket. It is safe to run again after changes.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables
create table if not exists public.calendars (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null default 'Merry Christmas' check (char_length(title) <= 60),
  to_name      text not null default '' check (char_length(to_name) <= 80),
  from_name    text not null default '' check (char_length(from_name) <= 80),
  design       text not null default 'parlor',
  start_year   int  not null check (start_year between 2024 and 2100),
  start_month  int  not null check (start_month between 1 and 12),
  timezone     text not null default 'America/Chicago',
  share_token  text not null unique default encode(gen_random_bytes(10), 'hex'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists calendars_owner on public.calendars (owner_id);

create table if not exists public.calendar_days (
  calendar_id  uuid not null references public.calendars(id) on delete cascade,
  day          int  not null check (day between 1 and 24),
  caption      text not null default '' check (char_length(caption) <= 400),
  image_path   text,
  updated_at   timestamptz not null default now(),
  primary key (calendar_id, day)
);

-- Who each calendar is shared with. Access is by verified email address, so a calendar
-- appears in the recipient's account as soon as they sign in with that email, and
-- removing an email removes their access.
create table if not exists public.calendar_invites (
  calendar_id  uuid not null references public.calendars(id) on delete cascade,
  email        text not null check (email = lower(email) and position('@' in email) > 1),
  invited_at   timestamptz not null default now(),
  primary key (calendar_id, email)
);
create index if not exists calendar_invites_email on public.calendar_invites (email);

create table if not exists public.day_opens (
  calendar_id  uuid not null references public.calendars(id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day          int  not null check (day between 1 and 24),
  opened_at    timestamptz not null default now(),
  primary key (calendar_id, user_id, day)
);

-- ---------------------------------------------------------------- helpers
-- security definer helpers avoid recursive policy checks between tables
create or replace function public.is_calendar_owner(p_calendar uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from calendars where id = p_calendar and owner_id = auth.uid());
$$;

-- The signed-in user's email (Supabase only issues a session after the email is confirmed).
create or replace function public.my_email()
returns text language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_calendar_recipient(p_calendar uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_email() <> ''
     and exists (select 1 from calendar_invites where calendar_id = p_calendar and email = public.my_email());
$$;

-- A door is unlocked once its date has arrived in the calendar's time zone.
create or replace function public.is_day_unlocked(p_calendar uuid, p_day int)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select (now() at time zone c.timezone)::date >= make_date(c.start_year, c.start_month, p_day)
    from calendars c where c.id = p_calendar
  ), false);
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists calendars_touch on public.calendars;
create trigger calendars_touch before update on public.calendars for each row execute function public.touch_updated_at();
drop trigger if exists days_touch on public.calendar_days;
create trigger days_touch before update on public.calendar_days for each row execute function public.touch_updated_at();

-- Keep invite lists to a sensible size.
create or replace function public.limit_invites() returns trigger language plpgsql as $$
begin
  if (select count(*) from calendar_invites where calendar_id = new.calendar_id) >= 50 then
    raise exception 'A calendar can be shared with up to 50 email addresses';
  end if;
  return new;
end; $$;
drop trigger if exists invites_limit on public.calendar_invites;
create trigger invites_limit before insert on public.calendar_invites for each row execute function public.limit_invites();

-- ---------------------------------------------------------------- row level security
alter table public.calendars        enable row level security;
alter table public.calendar_days    enable row level security;
alter table public.calendar_invites enable row level security;
alter table public.day_opens        enable row level security;

drop policy if exists "calendars: owner or recipient can read" on public.calendars;
create policy "calendars: owner or recipient can read" on public.calendars
  for select using (owner_id = auth.uid() or public.is_calendar_recipient(id));
drop policy if exists "calendars: owner can create" on public.calendars;
create policy "calendars: owner can create" on public.calendars
  for insert with check (owner_id = auth.uid());
drop policy if exists "calendars: owner can update" on public.calendars;
create policy "calendars: owner can update" on public.calendars
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "calendars: owner can delete" on public.calendars;
create policy "calendars: owner can delete" on public.calendars
  for delete using (owner_id = auth.uid());

-- The important one: recipients only ever receive days whose date has arrived.
drop policy if exists "days: owner, or recipient once unlocked" on public.calendar_days;
create policy "days: owner, or recipient once unlocked" on public.calendar_days
  for select using (
    public.is_calendar_owner(calendar_id)
    or (public.is_calendar_recipient(calendar_id) and public.is_day_unlocked(calendar_id, day))
  );
drop policy if exists "days: owner writes" on public.calendar_days;
create policy "days: owner writes" on public.calendar_days
  for all using (public.is_calendar_owner(calendar_id)) with check (public.is_calendar_owner(calendar_id));

drop policy if exists "invites: owner manages" on public.calendar_invites;
create policy "invites: owner manages" on public.calendar_invites
  for all using (public.is_calendar_owner(calendar_id)) with check (public.is_calendar_owner(calendar_id));
drop policy if exists "invites: recipients see their own" on public.calendar_invites;
create policy "invites: recipients see their own" on public.calendar_invites
  for select using (email = public.my_email());
drop policy if exists "invites: recipients can leave" on public.calendar_invites;
create policy "invites: recipients can leave" on public.calendar_invites
  for delete using (email = public.my_email());

drop policy if exists "opens: own rows" on public.day_opens;
create policy "opens: own rows" on public.day_opens
  for select using (user_id = auth.uid());
drop policy if exists "opens: record unlocked days only" on public.day_opens;
create policy "opens: record unlocked days only" on public.day_opens
  for insert with check (user_id = auth.uid() and public.is_calendar_recipient(calendar_id) and public.is_day_unlocked(calendar_id, day));

-- ---------------------------------------------------------------- share links
-- Public teaser for the share page (title and names only; no photos or notes).
create or replace function public.share_preview(p_token text)
returns table (id uuid, title text, to_name text, from_name text, design text, start_year int, start_month int, owner_id uuid, owner_name text)
language sql stable security definer set search_path = public as $$
  select c.id, c.title, c.to_name, c.from_name, c.design, c.start_year, c.start_month, c.owner_id,
         coalesce(u.raw_user_meta_data->>'display_name', '') as owner_name
  from calendars c join auth.users u on u.id = c.owner_id
  where c.share_token = p_token;
$$;
grant execute on function public.share_preview(text) to anon, authenticated;

-- Resolves a share link for the signed-in user. Only the owner and invited emails get in.
create or replace function public.join_calendar(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cal calendars;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into cal from calendars where share_token = p_token;
  if cal.id is null then raise exception 'That link doesn''t match a calendar'; end if;
  if cal.owner_id <> auth.uid() and not public.is_calendar_recipient(cal.id) then
    raise exception 'This calendar was shared with a different email address. Sign in with the email it was sent to.';
  end if;
  return cal.id;
end; $$;
revoke execute on function public.join_calendar(text) from anon;
grant execute on function public.join_calendar(text) to authenticated;

-- ---------------------------------------------------------------- photo storage (private bucket)
-- Files are stored as  <calendar id>/<day>-<stamp>.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('advent-photos', 'advent-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "photos: owner manages" on storage.objects;
create policy "photos: owner manages" on storage.objects
  for all to authenticated
  using (bucket_id = 'advent-photos' and public.is_calendar_owner(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'advent-photos' and public.is_calendar_owner(((storage.foldername(name))[1])::uuid));

drop policy if exists "photos: recipient reads unlocked days" on storage.objects;
create policy "photos: recipient reads unlocked days" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'advent-photos'
    and public.is_calendar_recipient(((storage.foldername(name))[1])::uuid)
    and public.is_day_unlocked(((storage.foldername(name))[1])::uuid, (split_part(storage.filename(name), '-', 1))::int)
  );
