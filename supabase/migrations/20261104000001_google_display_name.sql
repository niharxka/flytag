-- handle_new_user, take two: name new Google accounts from their Google profile.
-- Why: with "Sign in with Google" there's no name field; Google hands Supabase the student's
-- name in raw_user_meta_data (full_name / name). We use the first name, how classmates refer
-- to each other ("Niharika", not "Niharika Sapre"); riders can change it in Edit profile.
-- Email-code sign-ups still send display_name, which wins. Spec: §7.2 on_auth_user_created.
-- (Replaces the function from 20261029000002_profiles.sql; the trigger itself is unchanged.)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  -- 1. The name typed at sign-up; else the first word of the Google name; else the email's
  --    first part. Trim and cut to 30 so the display_name checks can never block a sign-up.
  name text := left(btrim(coalesce(
    nullif(btrim(meta ->> 'display_name'), ''),
    nullif(split_part(btrim(coalesce(meta ->> 'full_name', meta ->> 'name', '')), ' ', 1), ''),
    split_part(new.email, '@', 1)
  )), 30);
begin
  -- 2. Public profile, then the private row that hangs off it.
  insert into public.profiles (id, display_name) values (new.id, name);
  insert into public.profile_private (user_id) values (new.id);
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates profiles + profile_private for every new auth.users row. Name: typed > Google first name > email prefix.';
