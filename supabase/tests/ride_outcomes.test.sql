-- ride_outcomes: riders who were in a ride say whether it happened, after it leaves; the Rides
-- tab asks about the latest unanswered shared ride; the analytics view turns answers into
-- completed rides and money saved, and the app can't read it.
begin;
set local search_path = public, extensions;
select plan(13);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'host@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'rider@ucsd.edu'),
  ('cccccccc-0000-4000-8000-000000000003', 'outsider@ucsd.edu');
-- d1: left 3 hours ago with 2 people. d2: leaves tomorrow.
insert into public.rides (id, created_by, direction, depart_at, est_total_cost_cents) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() - interval '3 hours', 4000),
  ('d0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day', null);
insert into public.ride_members (ride_id, user_id, role) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'host'),
  ('d0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'rider'),
  ('d0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'host');

create function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

-- The host is asked about d1 (not d2, which hasn't left).
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select is((select id from public.pending_ride_outcome()), 'd0000000-0000-4000-8000-000000000001'::uuid,
  'the Rides tab asks about the ride that left');

select throws_ok($$select public.record_ride_outcome('d0000000-0000-4000-8000-000000000002', true)$$,
  'P0001', 'RIDE_NOT_DEPARTED', 'denied: answering before the ride leaves');
select throws_ok($$select public.record_ride_outcome('d0000000-0000-4000-8000-000000000001', false, 3000)$$,
  'P0001', 'INVALID_DETAILS', 'denied: a fare for a ride that didn''t happen');

select lives_ok($$select public.record_ride_outcome('d0000000-0000-4000-8000-000000000001', true, 5000)$$,
  'allowed: a member answers yes with the fare');
select is((select count(*) from public.pending_ride_outcome()), 0::bigint, 'once answered, it isn''t asked again');

select pg_temp.as_user('cccccccc-0000-4000-8000-000000000003');
select throws_ok($$select public.record_ride_outcome('d0000000-0000-4000-8000-000000000001', true)$$,
  'P0001', 'NOT_MEMBER', 'denied: someone who wasn''t in the ride');
select is((select count(*) from public.ride_outcomes), 0::bigint, 'denied: other riders'' answers are invisible');
select throws_ok($$select * from analytics.rides_weekly$$, '42501', null, 'denied: the app can''t read analytics');

-- The rider answers no, then changes their mind: one row, latest answer.
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select public.record_ride_outcome('d0000000-0000-4000-8000-000000000001', false);
select public.record_ride_outcome('d0000000-0000-4000-8000-000000000001', true, 4800);
select is((select count(*) from public.ride_outcomes), 1::bigint, 'answering again replaces your answer');
reset role;

select ok((select completed from analytics.ride_results where ride_id = 'd0000000-0000-4000-8000-000000000001'),
  'a yes makes the ride completed');
select is((select fare_cents from analytics.ride_results where ride_id = 'd0000000-0000-4000-8000-000000000001'),
  4800, 'fare is the middle reported fare, not the host''s estimate');
select is((select saved_cents from analytics.ride_results where ride_id = 'd0000000-0000-4000-8000-000000000001'),
  4800::bigint, 'two riders sharing $48 save $48 between them');
select is((select count(*) from analytics.ride_results where ride_id = 'd0000000-0000-4000-8000-000000000002'),
  0::bigint, 'rides that haven''t left aren''t counted');

select * from finish();
rollback;
