-- list_ride_members + get_rider_contact: the panel shows WHETHER someone shares a phone; the
-- number itself only reaches co-riders, and only if shared (§SCHEMA 4, §9.6 AC).
begin;
select plan(9);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'host@ucsd.edu', '{"display_name":"Hana"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'sharer@ucsd.edu', '{"display_name":"Sam"}'),
  ('cccccccc-0000-4000-8000-000000000003', 'private@ucsd.edu', '{"display_name":"Pia"}'),
  ('dddddddd-0000-4000-8000-000000000004', 'outsider@ucsd.edu', '{"display_name":"Otto"}');
update public.profiles set home_label = 'Pacific Beach' where id = 'bbbbbbbb-0000-4000-8000-000000000002';
update public.profile_private set phone_e164 = '+18585550111', share_phone = true where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';
update public.profile_private set phone_e164 = '+18585550122', share_phone = false where user_id = 'cccccccc-0000-4000-8000-000000000003';
update public.profile_private set phone_e164 = '+18585550133', share_phone = true where user_id = 'dddddddd-0000-4000-8000-000000000004';

insert into public.rides (id, created_by, direction, depart_at) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day');
insert into public.ride_members (ride_id, user_id, role, intent, joined_at) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'host', null, now() - interval '2 hours'),
  ('d0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'rider', 'flypal', now() - interval '1 hour'),
  ('d0000000-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000003', 'rider', null, now());

create function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

-- As the outsider (not in the ride): can see the panel, never a number.
select pg_temp.as_user('dddddddd-0000-4000-8000-000000000004');
select results_eq(
  $$select display_name, home, intent::text, role::text, phone_shared from public.list_ride_members('d0000000-0000-4000-8000-000000000001')$$,
  $$values ('Hana', null::text, null::text, 'host', false), ('Sam', 'Pacific Beach', 'flypal', 'rider', true), ('Pia', null, null, 'rider', false)$$,
  'panel: host first, homes, ride tags, and only a yes/no for phones');
select throws_ok($$select public.get_rider_contact('d0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002')$$,
  'P0001', 'NOT_ALLOWED', 'denied: an outsider can''t get a sharer''s number');

-- As the host (a co-rider)
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select is(public.get_rider_contact('d0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002'), '+18585550111',
  'allowed: a co-rider gets a shared number');
select throws_ok($$select public.get_rider_contact('d0000000-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000003')$$,
  'P0001', 'NOT_ALLOWED', 'denied: a co-rider who doesn''t share');
select throws_ok($$select public.get_rider_contact('d0000000-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000004')$$,
  'P0001', 'NOT_ALLOWED', 'denied: someone sharing but not in this ride');
select ok((select is_me from public.list_ride_members('d0000000-0000-4000-8000-000000000001') where display_name = 'Hana'),
  'is_me marks the caller');
reset role;

-- Sam leaves: his number is no longer reachable, and he drops off the panel.
update public.ride_members set left_at = now() where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
select throws_ok($$select public.get_rider_contact('d0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002')$$,
  'P0001', 'NOT_ALLOWED', 'denied: after the rider leaves');
select is((select count(*) from public.list_ride_members('d0000000-0000-4000-8000-000000000001')), 2::bigint,
  'people who left aren''t listed');
reset role;

set local role anon;
select throws_ok($$select * from public.list_ride_members('d0000000-0000-4000-8000-000000000001')$$, '42501', null,
  'denied: signed-out callers');
reset role;

select * from finish();
rollback;
