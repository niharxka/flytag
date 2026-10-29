-- create_ride: validation (§9.5 AC "can't post a time in the past"), host membership, idempotency.
begin;
select plan(12);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'ben@ucsd.edu');
-- Ana is onboarded (with a tag); Ben isn't.
update public.profiles set college_id = (select id from public.colleges where sort = 6), intent = 'flypal', onboarded_at = now()
  where id = 'aaaaaaaa-0000-4000-8000-000000000001';

-- As Ben (not onboarded)
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$select public.create_ride('to_airport', now() + interval '1 day')$$,
  'P0001', 'NOT_ONBOARDED', 'denied: must finish onboarding first');
reset role;

-- As Ana
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select throws_ok($$select public.create_ride('to_airport', now() - interval '1 minute')$$,
  'P0001', 'INVALID_TIME', 'denied: a time in the past');
select throws_ok($$select public.create_ride('to_airport', now() + interval '91 days')$$,
  'P0001', 'INVALID_TIME', 'denied: more than 90 days ahead');
select throws_ok($$select public.create_ride('to_airport', now() + interval '1 day', 1::smallint)$$,
  'P0001', 'INVALID_SEATS', 'denied: fewer than 2 seats');
select throws_ok($$select public.create_ride('to_airport', now() + interval '1 day', 7::smallint)$$,
  'P0001', 'INVALID_SEATS', 'denied: more than 6 seats');
select throws_ok($$select public.create_ride('to_airport', now() + interval '1 day', 4::smallint, null, null, repeat('x', 281))$$,
  'P0001', 'INVALID_DETAILS', 'denied: notes over 280 characters');

create temp table posted as
  select public.create_ride('to_airport', now() + interval '1 day', 3::smallint, '  Sixth market ', 4800, '   ',
                            'cccccccc-0000-4000-8000-000000000009') as id;
reset role;

select is((select seats_max from public.rides where id = (select id from posted)), 3::smallint,
  'allowed: a valid ride is created');
select is((select meet_spot from public.rides where id = (select id from posted)), 'Sixth market',
  'optional text is trimmed');
select is((select notes from public.rides where id = (select id from posted)), null,
  'blank notes are stored as null');
select results_eq(
  $$select user_id, role::text, intent::text from public.ride_members where ride_id = (select id from posted)$$,
  $$values ('aaaaaaaa-0000-4000-8000-000000000001'::uuid, 'host', 'flypal')$$,
  'the poster is the only member, as host, with their tag');

set local role authenticated;
select is(
  public.create_ride('to_airport', now() + interval '1 day', 3::smallint, null, null, null, 'cccccccc-0000-4000-8000-000000000009'),
  (select id from posted), 'same request id twice returns the first ride (double tap)');
reset role;
select is((select count(*) from public.rides where created_by = 'aaaaaaaa-0000-4000-8000-000000000001'), 1::bigint,
  '…and no second ride is created');

select * from finish();
rollback;
