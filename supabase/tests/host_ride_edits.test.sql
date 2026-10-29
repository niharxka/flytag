-- update_ride + cancel_ride: host only; seats never below the people already in.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'host@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'rider@ucsd.edu'),
  ('cccccccc-0000-4000-8000-000000000003', 'rider2@ucsd.edu');
insert into public.rides (id, created_by, direction, depart_at, seats_max) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day', 4);
insert into public.ride_members (ride_id, user_id, role) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'host'),
  ('d0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'rider'),
  ('d0000000-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000003', 'rider');

create function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select throws_ok($$select public.update_ride('d0000000-0000-4000-8000-000000000001', now() + interval '2 days', 4::smallint)$$,
  'P0001', 'NOT_HOST', 'denied: a rider can''t edit the ride');
select throws_ok($$select public.cancel_ride('d0000000-0000-4000-8000-000000000001')$$,
  'P0001', 'NOT_HOST', 'denied: a rider can''t cancel the ride');

select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select throws_ok($$select public.update_ride('d0000000-0000-4000-8000-000000000001', now() + interval '2 days', 2::smallint)$$,
  'P0001', 'INVALID_SEATS', 'denied: 2 seats when 3 people are in');
select throws_ok($$select public.update_ride('d0000000-0000-4000-8000-000000000001', now() - interval '1 hour', 4::smallint)$$,
  'P0001', 'INVALID_TIME', 'denied: moving the ride into the past');
select lives_ok($$select public.update_ride('d0000000-0000-4000-8000-000000000001', now() + interval '2 days', 3::smallint, ' Price Center ', 3000, '')$$,
  'allowed: the host edits time, seats (= people in), spot, fare');
reset role;
select results_eq(
  $$select seats_max::int, meet_spot, est_total_cost_cents, notes from public.rides where id = 'd0000000-0000-4000-8000-000000000001'$$,
  $$values (3, 'Price Center', 3000, null::text)$$, 'the edit is saved, trimmed, blank notes cleared');

set local role authenticated;
select lives_ok($$select public.cancel_ride('d0000000-0000-4000-8000-000000000001')$$, 'allowed: the host cancels');
select throws_ok($$select public.update_ride('d0000000-0000-4000-8000-000000000001', now() + interval '2 days', 4::smallint)$$,
  'P0001', 'RIDE_NOT_ACTIVE', 'denied: editing a cancelled ride');
reset role;

select * from finish();
rollback;
