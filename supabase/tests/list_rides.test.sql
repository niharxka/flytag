-- list_rides + nearby_rides: what the Rides tab and the merge suggestion see (§9.4 AC).
begin;
select plan(13);

-- Start from no rides (seed data included); the rollback at the end puts everything back.
delete from public.rides;

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'ben@ucsd.edu');

-- Ana hosts: soon (1/4), full (2/2), past, cancelled, and one to campus. Ben is in the full one.
insert into public.rides (id, created_by, direction, depart_at, seats_max, status) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '2 hours', 4, 'active'),
  ('d0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '3 hours', 2, 'active'),
  ('d0000000-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() - interval '20 minutes', 4, 'active'),
  ('d0000000-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '4 hours', 4, 'cancelled'),
  ('d0000000-0000-4000-8000-000000000005', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_campus', now() + interval '5 hours', 4, 'active'),
  ('d0000000-0000-4000-8000-000000000006', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() - interval '10 minutes', 4, 'active');
insert into public.ride_members (ride_id, user_id, role)
  select id, 'aaaaaaaa-0000-4000-8000-000000000001', 'host' from public.rides where created_by = 'aaaaaaaa-0000-4000-8000-000000000001';
insert into public.ride_members (ride_id, user_id, role)
  values ('d0000000-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'rider');

-- As Ben
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  $$select id from public.list_rides('to_airport')$$,
  $$values ('d0000000-0000-4000-8000-000000000006'::uuid), ('d0000000-0000-4000-8000-000000000001'::uuid), ('d0000000-0000-4000-8000-000000000002'::uuid)$$,
  'soonest first; just-left (<15 min) shown; past and cancelled hidden; other direction excluded');
select is((select seats_taken from public.list_rides('to_airport') where id = 'd0000000-0000-4000-8000-000000000002'), 2,
  'full rides stay visible with their seat count');
select is((select rider_names from public.list_rides('to_airport') where id = 'd0000000-0000-4000-8000-000000000002'),
  array['ana', 'ben'], 'rider names list the host first');
select ok((select is_member and not is_host from public.list_rides('to_airport') where id = 'd0000000-0000-4000-8000-000000000002'),
  'is_member is true for a ride I joined, is_host false');
select ok((select not is_member from public.list_rides('to_airport') where id = 'd0000000-0000-4000-8000-000000000001'),
  'is_member is false for a ride I''m not in');
select is((select host_name from public.list_rides('to_airport') limit 1), 'ana', 'host name comes along');

-- Paging
select results_eq(
  $$select id from public.list_rides('to_airport', null, null, 2)$$,
  $$values ('d0000000-0000-4000-8000-000000000006'::uuid), ('d0000000-0000-4000-8000-000000000001'::uuid)$$,
  'page size limits the page');
select results_eq(
  $$select id from public.list_rides('to_airport',
      (select depart_at from public.rides where id = 'd0000000-0000-4000-8000-000000000001'), 'd0000000-0000-4000-8000-000000000001')$$,
  $$values ('d0000000-0000-4000-8000-000000000002'::uuid)$$,
  'the next page starts right after the cursor');
select is((select count(*) from public.list_rides('to_airport', null, null, 1000)), 3::bigint, 'a huge page size is capped, not an error');

-- nearby_rides, around 2h30 from now
select results_eq(
  $$select id from public.nearby_rides('to_airport', now() + interval '2 hours 30 minutes')$$,
  $$values ('d0000000-0000-4000-8000-000000000001'::uuid)$$,
  'suggests a joinable ride nearby (skips the full one I''m already in)');
select is((select count(*) from public.nearby_rides('to_airport', now() + interval '8 hours')), 0::bigint,
  'nothing outside the ±60 min window');
reset role;

-- As Ana, the host: her own rides are never suggested to her.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.nearby_rides('to_airport', now() + interval '2 hours')), 0::bigint,
  'my own rides are never suggested to me');
reset role;

set local role anon;
select throws_ok($$select * from public.list_rides('to_airport')$$, '42501', null, 'denied: signed-out callers cannot list rides');
reset role;

select * from finish();
rollback;
