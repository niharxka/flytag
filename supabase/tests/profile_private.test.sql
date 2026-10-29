-- profile_private: only its owner can read or edit it. Nobody else, ever (§SCHEMA 4).
begin;
-- Hosted projects keep pgTAP in the `extensions` schema; make it findable for this test only.
set local search_path = public, extensions;
select plan(6);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'ben@ucsd.edu');
update public.profile_private set phone_e164 = '+18585550199', share_phone = true
  where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from public.profile_private), 1::bigint,
  'a user sees exactly one private row: their own');
select is((select count(*) from public.profile_private where user_id = 'bbbbbbbb-0000-4000-8000-000000000002'),
  0::bigint, 'denied: even a shared phone is not readable from this table');

update public.profile_private set share_phone = true where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.profile_private set share_phone = false where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';

select throws_ok(
  $$update public.profile_private set phone_e164 = '858-555-0100' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: phone must be E.164'
);
select throws_ok(
  $$update public.profile_private set user_id = 'bbbbbbbb-0000-4000-8000-000000000002' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '42501', null, 'denied: user_id is not editable'
);
reset role;

select ok((select share_phone from public.profile_private where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'allowed: a user can change their own sharing setting');
select ok((select share_phone from public.profile_private where user_id = 'bbbbbbbb-0000-4000-8000-000000000002'),
  'denied: a user cannot change someone else''s setting (0 rows changed)');

select * from finish();
rollback;
