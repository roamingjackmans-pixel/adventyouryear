-- Which part of each photo shows through its little door (0-100, like CSS object-position percentages).
alter table public.calendar_days
  add column if not exists focus_x smallint not null default 50 check (focus_x between 0 and 100),
  add column if not exists focus_y smallint not null default 50 check (focus_y between 0 and 100);
