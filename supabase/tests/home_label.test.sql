-- home_label: a home is a college OR a custom label, never both; onboarding needs one.
begin;
-- Hosted projects keep pgTAP in the `extensions` schema; make it findable for this test only.
set local search_path = public, extensions;
select plan(7);

insert into auth.users (id, email) values ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu');
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

update public.profiles set home_label = 'Pacific Beach', onboarded_at = now() where id = 'aaaaaaaa-0000-4000-8000-000000000001';
select throws_ok(
  $$update public.profiles set college_id = (select id from public.colleges where sort = 1) where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: a college and a custom label at once');
select throws_ok(
  $$update public.profiles set home_label = '' where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: an empty label');
select throws_ok(
  $$update public.profiles set home_label = repeat('x', 41) where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: a label over 40 characters');
select throws_ok(
  $$update public.profiles set home_label = null where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: an onboarded rider with no home at all');
-- Switching from label to college in one update is fine.
update public.profiles set home_label = null, college_id = (select id from public.colleges where sort = 6)
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';
reset role;

select is((select college_id from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  (select id from public.colleges where sort = 6), 'allowed: switching from a custom label to a college');

-- ride_cards shows the custom label as the host's home.
update public.profiles set college_id = null, home_label = 'La Jolla Village' where id = 'aaaaaaaa-0000-4000-8000-000000000001';
insert into public.rides (id, created_by, direction, depart_at)
  values ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day');
insert into public.ride_members (ride_id, user_id, role)
  values ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'host');
set local role authenticated;
select is((select host_home from public.ride_cards where id = 'dddddddd-0000-4000-8000-000000000001'),
  'La Jolla Village', 'ride cards show a custom home');
reset role;
update public.profiles set home_label = null, college_id = (select id from public.colleges where sort = 3) where id = 'aaaaaaaa-0000-4000-8000-000000000001';
set local role authenticated;
select is((select host_home from public.ride_cards where id = 'dddddddd-0000-4000-8000-000000000001'),
  'Thurgood Marshall College', '…or the college name');
reset role;

select * from finish();
rollback;
