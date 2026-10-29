-- profiles: created by the signup trigger; any signed-in user can read; only the owner can
-- edit, and only the editable columns.
begin;
select plan(11);

-- Two users, created the way Auth creates them (the trigger does the rest).
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu', '{"display_name":"  Ana  "}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'ben@ucsd.edu', '{}');

-- The trigger
select is((select display_name from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'Ana', 'signup trigger creates a profile with the trimmed display name');
select is((select display_name from public.profiles where id = 'bbbbbbbb-0000-4000-8000-000000000002'),
  'ben', 'without a display name, the trigger falls back to the email''s first part');
select is((select count(*) from public.profile_private where user_id in
  ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002')),
  2::bigint, 'signup trigger creates the private row too');

-- As Ana
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select ok(exists(select 1 from public.profiles where id = 'bbbbbbbb-0000-4000-8000-000000000002'),
  'allowed: a signed-in user can read another rider''s profile');

update public.profiles set display_name = 'Ana B' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.profiles set display_name = 'Hacked' where id = 'bbbbbbbb-0000-4000-8000-000000000002';

select throws_ok(
  $$update public.profiles set created_at = now() - interval '1 year' where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '42501', null, 'denied: users cannot change columns outside the editable five'
);
select throws_ok(
  $$insert into public.profiles (id, display_name) values (gen_random_uuid(), 'Ghost')$$,
  '42501', null, 'denied: users cannot insert profiles (only the trigger does)'
);
select throws_ok(
  $$update public.profiles set display_name = '' where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: an empty display name breaks the length check'
);
select throws_ok(
  $$update public.profiles set onboarded_at = now() where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: cannot finish onboarding without a college'
);
reset role;

select is((select display_name from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'Ana B', 'allowed: a user can update their own display name');
select is((select display_name from public.profiles where id = 'bbbbbbbb-0000-4000-8000-000000000002'),
  'ben', 'denied: a user cannot update someone else''s profile (0 rows changed)');

set local role anon;
select is((select count(*) from public.profiles), 0::bigint, 'denied: signed-out callers cannot read profiles');
reset role;

select * from finish();
rollback;
