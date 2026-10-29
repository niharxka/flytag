-- profiles + profile_private: who a rider is (public) and what only they know (private).
-- Why: every ride, member row and message points at a profile. Private fields (phone, settings)
-- live in a separate table because RLS protects rows, not columns: if phone sat on profiles,
-- anyone allowed to read your profile could read your number.
-- Spec: §6.1 rider_intent, §6.2 tables 2–3, §7.1 RLS, §7.2 on_auth_user_created.
-- Phase 7 tightens "read profiles" to hide blocked users once the blocks table exists.

create type public.rider_intent as enum ('networking', 'flypal');

-- Shared by every table with an updated_at column.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Trigger helper: stamps updated_at on every UPDATE.';

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    constraint display_name_length check (char_length(display_name) between 1 and 30)
    constraint display_name_trimmed check (display_name = btrim(display_name)),
  college_id uuid references public.colleges (id),
  intent public.rider_intent,
  avatar_path text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Onboarding requires a college, so an onboarded profile always has one.
  constraint onboarded_needs_college check (onboarded_at is null or college_id is not null)
);

comment on table public.profiles is 'Public face of a rider, 1:1 with auth.users. Created by the on_auth_user_created trigger.';
comment on column public.profiles.display_name is 'What riders call you. 1–30 chars, no leading/trailing spaces.';
comment on column public.profiles.college_id is 'Home college. Null until onboarding.';
comment on column public.profiles.intent is 'Optional tag on rider rows: networking (sky) or flypal (deep).';
comment on column public.profiles.avatar_path is 'Path inside the avatars Storage bucket (Phase 7).';
comment on column public.profiles.onboarded_at is 'Set when onboarding finishes. The app keeps (app) routes closed until it is set.';

create index profiles_college_id_idx on public.profiles (college_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "signed-in users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- RLS decides which rows; grants decide which columns. Rows are only ever created by the
-- trigger below, and the app may change only these five columns (never id or timestamps).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, college_id, intent, avatar_path, onboarded_at) on public.profiles to authenticated;

-- ---------------------------------------------------------- profile_private

create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone_e164 text
    constraint phone_is_e164 check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  share_phone boolean not null default false,
  notify_rider_joined boolean not null default true,
  notify_new_message boolean not null default true,
  notify_ride_updated boolean not null default true,
  notify_ride_reminder boolean not null default true,
  theme_pref text not null default 'system'
    constraint theme_pref_valid check (theme_pref in ('system', 'mist', 'charcoal'))
);

comment on table public.profile_private is 'What only this user can see. Others reach the phone only via get_rider_contact (Phase 4).';
comment on column public.profile_private.phone_e164 is 'Phone in E.164 (+18585551234). Optional.';
comment on column public.profile_private.share_phone is 'Whether co-riders may see the phone. Off by default.';
comment on column public.profile_private.notify_rider_joined is 'Push when someone joins your ride.';
comment on column public.profile_private.notify_new_message is 'Push for new chat messages (collapsed).';
comment on column public.profile_private.notify_ride_updated is 'Push when a ride you are in changes or is cancelled.';
comment on column public.profile_private.notify_ride_reminder is 'Push 2 hours before departure.';
comment on column public.profile_private.theme_pref is 'system / mist / charcoal.';

alter table public.profile_private enable row level security;

create policy "users can read their own private profile"
  on public.profile_private for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "users can update their own private profile"
  on public.profile_private for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke insert, update, delete on public.profile_private from anon, authenticated;
grant update (phone_e164, share_phone, notify_rider_joined, notify_new_message, notify_ride_updated, notify_ride_reminder, theme_pref)
  on public.profile_private to authenticated;

-- ------------------------------------------------- on_auth_user_created trigger

-- Runs as the function owner (security definer) because the signing-up user can't insert
-- into these tables themselves. search_path is pinned so nothing can shadow public.* names.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- 1. Take the name typed on the sign-in screen; fall back to the email's first part.
  --    Trim and cut to 30 so the display_name checks can never block a signup.
  name text := left(btrim(coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(new.email, '@', 1)
  )), 30);
begin
  -- 2. Public profile, then the private row that hangs off it.
  insert into public.profiles (id, display_name) values (new.id, name);
  insert into public.profile_private (user_id) values (new.id);
  return new;
end;
$$;

comment on function public.handle_new_user() is 'Creates profiles + profile_private for every new auth.users row.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
