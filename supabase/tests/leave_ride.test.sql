-- leave_ride: riders leave; a leaving host hands over to the earliest rider; an empty ride is
-- cancelled (§13 Phase 4 exit: "host handoff works").
begin;
-- Hosted projects keep pgTAP in the `extensions` schema; make it findable for this test only.
set local search_path = public, extensions;
select plan(7);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'host@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'early@ucsd.edu'),
  ('cccccccc-0000-4000-8000-000000000003', 'late@ucsd.edu'),
  ('dddddddd-0000-4000-8000-000000000004', 'outsider@ucsd.edu');
insert into public.rides (id, created_by, direction, depart_at) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day');
insert into public.ride_members (ride_id, user_id, role, joined_at) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'host', now() - interval '3 hours'),
  ('d0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'rider', now() - interval '2 hours'),
  ('d0000000-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000003', 'rider', now() - interval '1 hour');

create function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

select pg_temp.as_user('dddddddd-0000-4000-8000-000000000004');
select throws_ok($$select public.leave_ride('d0000000-0000-4000-8000-000000000001')$$, 'P0001', 'NOT_MEMBER', 'denied: leaving a ride you''re not in');

-- The host leaves: the earliest rider (early@) takes over, not the latest.
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select lives_ok($$select public.leave_ride('d0000000-0000-4000-8000-000000000001')$$, 'allowed: the host leaves');
reset role;
select is((select user_id from public.ride_members where ride_id = 'd0000000-0000-4000-8000-000000000001' and role = 'host' and left_at is null),
  'bbbbbbbb-0000-4000-8000-000000000002'::uuid, 'the earliest rider becomes host');
select ok((select left_at is not null from public.ride_members where ride_id = 'd0000000-0000-4000-8000-000000000001' and user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'the old host''s row is kept, marked left');

set local role authenticated;
select pg_temp.as_user('cccccccc-0000-4000-8000-000000000003');
select public.leave_ride('d0000000-0000-4000-8000-000000000001');
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select public.leave_ride('d0000000-0000-4000-8000-000000000001');
reset role;
select is((select status::text from public.rides where id = 'd0000000-0000-4000-8000-000000000001'), 'cancelled',
  'when the last person leaves, the ride is cancelled');
select is((select count(*) from public.ride_members where ride_id = 'd0000000-0000-4000-8000-000000000001' and left_at is null), 0::bigint,
  'and nobody is left in it');

set local role authenticated;
select throws_ok($$select public.leave_ride('d0000000-0000-4000-8000-000000000001')$$, 'P0001', 'NOT_MEMBER', 'denied: leaving twice');
reset role;

select * from finish();
rollback;
