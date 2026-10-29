-- rides + ride_members: signed-in users read; nobody writes except through RPCs.
begin;
select plan(6);

insert into auth.users (id, email) values ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu');
insert into public.rides (id, created_by, direction, depart_at)
  values ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day');
insert into public.ride_members (ride_id, user_id, role)
  values ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'host');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select ok(exists(select 1 from public.rides where id = 'dddddddd-0000-4000-8000-000000000001'),
  'allowed: signed-in users can read rides');
select ok(exists(select 1 from public.ride_members where ride_id = 'dddddddd-0000-4000-8000-000000000001'),
  'allowed: signed-in users can read a visible ride''s members');
select throws_ok(
  $$insert into public.rides (created_by, direction, depart_at) values ('aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '2 days')$$,
  '42501', null, 'denied: rides can''t be inserted directly (use create_ride)');
select throws_ok(
  $$insert into public.ride_members (ride_id, user_id) values ('dddddddd-0000-4000-8000-000000000001', gen_random_uuid())$$,
  '42501', null, 'denied: members can''t be added directly (use join_ride)');
select throws_ok(
  $$update public.rides set seats_max = 6 where id = 'dddddddd-0000-4000-8000-000000000001'$$,
  '42501', null, 'denied: rides can''t be edited directly, even by the host');
reset role;

set local role anon;
select is((select count(*) from public.rides), 0::bigint, 'denied: signed-out callers see no rides');
reset role;

select * from finish();
rollback;
