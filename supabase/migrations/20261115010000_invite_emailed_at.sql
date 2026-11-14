-- When the invitation email last went to each person (null = not emailed yet),
-- so new people can be emailed without re-sending to everyone.
alter table public.calendar_invites add column if not exists emailed_at timestamptz;
