-- join_ride: every error code, the seat limit, rejoining, and the chosen tag (§9.6).
begin;
select plan(11);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'host@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'ben@ucsd.edu'),
  ('cccccccc-0000-4000-8000-000000000003', 'cat@ucsd.edu'),
  ('eeeeeeee-0000-4000-8000-000000000005', 'new@ucsd.edu');
update public.profiles set college_id = (select id from public.colleges where sort = 1), onboarded_at = now()
  where id <> 'eeeeeeee-0000-4000-8000-000000000005';

-- A 2-seat ride (host takes one), a cancelled one, a departed one.
insert into public.rides (id, created_by, direction, depart_at, seats_max, status) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day', 2, 'active'),
  ('d0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day', 4, 'cancelled'),
  ('d0000000-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() - interval '5 minutes', 4, 'active');
insert into public.ride_members (ride_id, user_id, role)
  select id, 'aaaaaaaa-0000-4000-8000-000000000001', 'host' from public.rides where created_by = 'aaaaaaaa-0000-4000-8000-000000000001';

create function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;

set local role authenticated;

select pg_temp.as_user('eeeeeeee-0000-4000-8000-000000000005');
select throws_ok($$select public.join_ride('d0000000-0000-4000-8000-000000000001')$$, 'P0001', 'NOT_ONBOARDED', 'denied: not onboarded');

select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select throws_ok($$select public.join_ride('dddddddd-0000-4000-8000-00000000ffff')$$, 'P0001', 'RIDE_NOT_FOUND', 'denied: no such ride');
select throws_ok($$select public.join_ride('d0000000-0000-4000-8000-000000000002')$$, 'P0001', 'RIDE_NOT_ACTIVE', 'denied: cancelled ride');
select throws_ok($$select public.join_ride('d0000000-0000-4000-8000-000000000003')$$, 'P0001', 'RIDE_DEPARTED', 'denied: ride already left');

select lives_ok($$select public.join_ride('d0000000-0000-4000-8000-000000000001', 'networking')$$, 'allowed: Ben takes the last seat');
select throws_ok($$select public.join_ride('d0000000-0000-4000-8000-000000000001')$$, 'P0001', 'ALREADY_MEMBER', 'denied: joining twice');

select pg_temp.as_user('cccccccc-0000-4000-8000-000000000003');
select throws_ok($$select public.join_ride('d0000000-0000-4000-8000-000000000001')$$, 'P0001', 'RIDE_FULL', 'denied: Cat is too late, ride is full');
reset role;

select results_eq(
  $$select role::text, intent::text from public.ride_members where ride_id = 'd0000000-0000-4000-8000-000000000001' and user_id = 'bbbbbbbb-0000-4000-8000-000000000002'$$,
  $$values ('rider', 'networking')$$, 'Ben is a rider with the tag he chose for this ride');

-- Ben leaves, then rejoins choosing no tag: same row, active again.
update public.ride_members set left_at = now() where ride_id = 'd0000000-0000-4000-8000-000000000001' and user_id = 'bbbbbbbb-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select lives_ok($$select public.join_ride('d0000000-0000-4000-8000-000000000001', null)$$, 'allowed: rejoining after leaving');
reset role;
select results_eq(
  $$select count(*)::int, bool_and(left_at is null), max(intent::text) from public.ride_members where ride_id = 'd0000000-0000-4000-8000-000000000001' and user_id = 'bbbbbbbb-0000-4000-8000-000000000002'$$,
  $$values (1, true, null::text)$$, 'rejoin reuses the one row and takes the new (empty) tag');

set local role anon;
select throws_ok($$select public.join_ride('d0000000-0000-4000-8000-000000000001')$$, '42501', null, 'denied: signed-out callers');
reset role;

select * from finish();
rollback;
