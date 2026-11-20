-- activity_days: one row per rider per San Diego day on which they opened the app.
-- Why: until now the database only saw people who posted, joined or chatted. Airport trips are
-- rare, so most active people do none of those in a given week; retention has to be measured
-- by "came back at all", month to month or per school break. A day is the smallest unit that
-- answers that, and it stores no clicks, screens or times of day.
-- Written only by record_activity(), which the app calls on launch and when it returns to the
-- foreground. Nobody reads it through the API; the analytics views read it in the dashboard.
-- Spec: §14 success metrics (retention).

create table public.activity_days (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

comment on table public.activity_days is
  'Days (San Diego calendar) on which a rider opened the app. One row per rider per day. Written only by record_activity().';

-- RLS on with no policies: the API can neither read nor write rows. Only the function below
-- (security definer) and the dashboard touch this table.
alter table public.activity_days enable row level security;
revoke all on public.activity_days from anon, authenticated;

create function public.record_activity()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  -- 1. Today in San Diego, so a 11:30 PM session counts on the right day.
  -- 2. A second open on the same day changes nothing.
  insert into public.activity_days (user_id, day)
  values (auth.uid(), (now() at time zone 'America/Los_Angeles')::date)
  on conflict do nothing;
end;
$$;

comment on function public.record_activity is
  'Marks the signed-in rider as active today (San Diego day). Safe to call repeatedly.';

revoke execute on function public.record_activity from public, anon;
grant execute on function public.record_activity to authenticated;
