-- acquisition: a rider can record where they heard about FlyTag and their link's source on
-- their own private row, nobody else's, and only as a clean tag.
begin;
set local search_path = public, extensions;
select plan(5);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'ben@ucsd.edu');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

update public.profile_private set heard_from = 'instagram', signup_source = 'ig_story'
  where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
update public.profile_private set heard_from = 'flyer'
  where user_id = 'bbbbbbbb-0000-4000-8000-000000000002';

select throws_ok(
  $$update public.profile_private set signup_source = 'Hello There!' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '23514', null, 'denied: signup_source must be a lowercase tag'
);
select throws_ok(
  $$update public.profile_private set heard_from = 'tiktok' where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  '22P02', null, 'denied: heard_from must be one of the listed answers'
);
reset role;

select is((select heard_from::text from public.profile_private where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'instagram', 'allowed: a rider records how they heard about FlyTag');
select is((select signup_source from public.profile_private where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  'ig_story', 'allowed: and the tag of the link that brought them');
select is((select heard_from from public.profile_private where user_id = 'bbbbbbbb-0000-4000-8000-000000000002'),
  null, 'denied: nobody can set another rider''s answer (0 rows changed)');

select * from finish();
rollback;
