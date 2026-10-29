-- System lines: every membership and ride change shows up in the chat, in order.
begin;
-- Hosted projects keep pgTAP in the `extensions` schema; make it findable for this test only.
set local search_path = public, extensions;
select plan(2);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'host@ucsd.edu', '{"display_name":"Hana"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'rider@ucsd.edu', '{"display_name":"Ben"}');
update public.profiles set college_id = (select id from public.colleges where sort = 1), onboarded_at = now()
  where id in ('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002');

create function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

-- The whole life of a ride, through the real RPCs.
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
create temp table r as select public.create_ride('to_airport', '2026-12-01T19:00:00Z', 4::smallint) as id;
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select public.join_ride((select id from r));
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select public.update_ride((select id from r), '2026-12-01T19:30:00Z', 3::smallint, 'Price Center');
select public.leave_ride((select id from r));
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select public.leave_ride((select id from r));
reset role;

select results_eq(
  $$select body from public.messages where ride_id = (select id from r) order by created_at$$,
  $$values ('Hana posted this ride'), ('Ben joined'),
           ('Ride updated: time is now Tue 12/1 · 11:30 AM, 3 seats, meet at Price Center'),
           ('Hana left'), ('Ben is now the host'), ('Ben left'), ('This ride was cancelled')$$,
  'each step of the ride writes its line, in order, in San Diego time');
select ok((select bool_and(kind = 'system' and author_id is null) from public.messages where ride_id = (select id from r)),
  'they are all system lines with no author');

select * from finish();
rollback;
