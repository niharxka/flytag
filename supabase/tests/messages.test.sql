-- messages: members read and post; nobody else, even calling the API directly (§13 Phase 5 exit).
begin;
-- Hosted projects keep pgTAP in the `extensions` schema; make it findable for this test only.
set local search_path = public, extensions;
select plan(11);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'host@ucsd.edu', '{"display_name":"Hana"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'rider@ucsd.edu', '{"display_name":"Ben"}'),
  ('cccccccc-0000-4000-8000-000000000003', 'outsider@ucsd.edu', '{"display_name":"Otto"}');
insert into public.rides (id, created_by, direction, depart_at) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day');
insert into public.ride_members (ride_id, user_id, role) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'host'),
  ('d0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', 'rider');

create function pg_temp.as_user(u uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$$;
set local role authenticated;

select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select lives_ok($$insert into public.messages (ride_id, body) values ('d0000000-0000-4000-8000-000000000001', 'Meet at Sixth market?')$$,
  'allowed: a member posts');
select is((select author_id from public.messages where body = 'Meet at Sixth market?'), 'bbbbbbbb-0000-4000-8000-000000000002'::uuid,
  'the author is set by the database');
select throws_ok($$insert into public.messages (ride_id, body, author_id) values ('d0000000-0000-4000-8000-000000000001', 'I am Hana', 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  '42501', null, 'denied: posting as someone else');
select throws_ok($$insert into public.messages (ride_id, body, kind) values ('d0000000-0000-4000-8000-000000000001', 'Fake system line', 'system')$$,
  '42501', null, 'denied: writing system lines');
select throws_ok($$insert into public.messages (ride_id, body) values ('d0000000-0000-4000-8000-000000000001', '')$$,
  '23514', null, 'denied: an empty message');
select ok((select count(*) from public.messages where ride_id = 'd0000000-0000-4000-8000-000000000001') >= 1,
  'allowed: a member reads the chat');
select throws_ok($$update public.messages set body = 'edited' where ride_id = 'd0000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'denied: editing messages (no update permission at all)');

select pg_temp.as_user('cccccccc-0000-4000-8000-000000000003');
select is((select count(*) from public.messages where ride_id = 'd0000000-0000-4000-8000-000000000001'), 0::bigint,
  'denied: someone not in the ride reads nothing');
select throws_ok($$insert into public.messages (ride_id, body) values ('d0000000-0000-4000-8000-000000000001', 'let me in')$$,
  '42501', null, 'denied: someone not in the ride posts');
reset role;

-- Ben leaves: the chat closes for him.
update public.ride_members set left_at = now() where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';
set local role authenticated;
select pg_temp.as_user('bbbbbbbb-0000-4000-8000-000000000002');
select is((select count(*) from public.messages where ride_id = 'd0000000-0000-4000-8000-000000000001'), 0::bigint,
  'denied: after leaving, the chat is hidden');
reset role;

-- Rate limit: Hana sends 20 in a minute, the 21st is refused.
set local role authenticated;
select pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
insert into public.messages (ride_id, body) select 'd0000000-0000-4000-8000-000000000001', 'msg ' || i from generate_series(1, 20) i;
select throws_ok($$insert into public.messages (ride_id, body) values ('d0000000-0000-4000-8000-000000000001', 'one too many')$$,
  'P0001', 'RATE_LIMITED', 'denied: more than 20 messages in a minute');
reset role;

select * from finish();
rollback;
