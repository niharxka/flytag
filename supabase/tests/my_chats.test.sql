-- my_chats: my rides only, with the latest message, most recent activity first.
begin;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'me@ucsd.edu', '{"display_name":"Me"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'other@ucsd.edu', '{"display_name":"Other"}');
insert into public.rides (id, created_by, direction, depart_at) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '1 day'),
  ('d0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'to_airport', now() + interval '2 days'),
  ('d0000000-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000002', 'to_airport', now() + interval '1 day');
insert into public.ride_members (ride_id, user_id, role) values
  ('d0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'host'),
  ('d0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'host'),
  ('d0000000-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000002', 'host');
-- Ride 2 gets the latest message, so it should come first.
insert into public.messages (ride_id, author_id, body, created_at) values
  ('d0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'see you there', clock_timestamp() + interval '1 second');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select results_eq($$select ride_id from public.my_chats()$$,
  $$values ('d0000000-0000-4000-8000-000000000002'::uuid), ('d0000000-0000-4000-8000-000000000001'::uuid)$$,
  'only my rides, most recent activity first');
select is((select last_body from public.my_chats() limit 1), 'see you there', 'with the latest message');
select ok((select last_is_mine from public.my_chats() limit 1), 'and whether I wrote it');
select is((select last_kind::text from public.my_chats() offset 1 limit 1), 'system', 'a quiet ride shows its system line');
reset role;

select * from finish();
rollback;
