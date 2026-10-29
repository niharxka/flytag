-- saved_home_labels: owner can save their list; nobody else can read or change it; limits hold.
begin;
-- Hosted projects keep pgTAP in the `extensions` schema; make it findable for this test only.
set local search_path = public, extensions;
select plan(6);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'ben@ucsd.edu');
update public.profile_private set saved_home_labels = '{"Del Mar"}'
  where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

update public.profile_private set saved_home_labels = '{"Pacific Beach","La Jolla Village"}'
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is(
  (select saved_home_labels from public.profile_private where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  '{"Pacific Beach","La Jolla Village"}'::text[],
  'allowed: a user can save their own areas'
);
select is(
  (select count(*) from public.profile_private where user_id = 'bbbbbbbb-0000-4000-8000-000000000002'),
  0::bigint,
  'denied: another user''s areas are not readable'
);

update public.profile_private set saved_home_labels = '{}'
  where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';

select throws_ok(
  $$update public.profile_private
      set saved_home_labels = array_fill('Area'::text, array[11])
      where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: more than 10 areas'
);
select throws_ok(
  $$update public.profile_private
      set saved_home_labels = array[repeat('x', 41)]
      where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: an area longer than 40 characters'
);
select throws_ok(
  $$update public.profile_private
      set saved_home_labels = array[' Pacific Beach']
      where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: an area with stray spaces'
);
reset role;

select is(
  (select saved_home_labels from public.profile_private where user_id = 'bbbbbbbb-0000-4000-8000-000000000002'),
  '{"Del Mar"}'::text[],
  'denied: a user cannot change someone else''s areas (0 rows changed)'
);

select * from finish();
rollback;
