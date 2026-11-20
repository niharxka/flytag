-- list_rides_guest + get_ride_guest: signed-out visitors see times, seats and meet spots, never people.
begin;
set local search_path = public, extensions;
select plan(10);

delete from public.rides;

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'ben@ucsd.edu');

-- Ana hosts: one upcoming (Ben joined, Ben later left a second one), one past, one cancelled.
insert into public.rides (id, created_by, direction, depart_at, seats_max, status) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '2 hours', 4, 'active'),
  ('d0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '3 hours', 3, 'active'),
  ('d0000000-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() - interval '1 hour', 4, 'active'),
  ('d0000000-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '4 hours', 4, 'cancelled');
insert into public.ride_members (ride_id, user_id, role)
  select id, 'aaaaaaaa-0000-4000-8000-000000000001', 'host' from public.rides;
insert into public.ride_members (ride_id, user_id, role, left_at) values
  ('d0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'rider', null),
  ('d0000000-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'rider', now());
update public.rides set meet_spot = 'Sixth market', notes = 'Text me first', est_total_cost_cents = 4000
  where id = 'd0000000-0000-4000-8000-000000000001';

set local role anon;

select results_eq(
  $$select id from public.list_rides_guest('to_airport')$$,
  $$values ('d0000000-0000-4000-8000-000000000001'::uuid), ('d0000000-0000-4000-8000-000000000002'::uuid)$$,
  'allowed: a guest lists upcoming rides; past and cancelled hidden');
select is((select seats_taken from public.list_rides_guest('to_airport') where id = 'd0000000-0000-4000-8000-000000000001'), 2,
  'seats count current members');
select is((select seats_taken from public.list_rides_guest('to_airport') where id = 'd0000000-0000-4000-8000-000000000002'), 1,
  'riders who left free their seat');
select is((select status::text from public.get_ride_guest('d0000000-0000-4000-8000-000000000004')), 'cancelled',
  'a guest can open a cancelled ride by link and see it was cancelled');
select is((select meet_spot from public.get_ride_guest('d0000000-0000-4000-8000-000000000001')), 'Sixth market',
  'allowed: a guest sees where to meet');
select is((select meet_spot from public.list_rides_guest('to_airport') where id = 'd0000000-0000-4000-8000-000000000001'), 'Sixth market',
  'the list carries the meet spot too');
select throws_ok($$select * from public.ride_cards$$, '42501', null, 'denied: a guest cannot read ride_cards (names)');
-- profiles has no anon policy, so RLS hides every row rather than raising.
select is((select count(*) from public.profiles), 0::bigint, 'denied: a guest cannot read profiles');
reset role;

-- The shape itself is the privacy guarantee: no column that could name someone, and no notes
-- or fare (free text and money stay for signed-in riders).
select is(
  (select array_agg(attname::text order by attnum) from pg_attribute
    where attrelid = 'public.guest_ride'::regclass and attnum > 0 and not attisdropped),
  array['id', 'direction', 'depart_at', 'seats_max', 'seats_taken', 'status', 'meet_spot'],
  'guest_ride carries times, seats and meet spot only');

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$select * from public.list_rides_guest('to_airport')$$, '42501', null,
  'signed-in riders use list_rides, not the guest version');
reset role;

select * from finish();
rollback;
