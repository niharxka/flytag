-- avatars bucket: private; signed-in users can view; you can only write your own folder.
begin;
select plan(5);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'ben@ucsd.edu');
-- Ben already has a photo.
insert into storage.objects (bucket_id, name, owner_id) values ('avatars', 'bbbbbbbb-0000-4000-8000-000000000002/1.jpg', 'bbbbbbbb-0000-4000-8000-000000000002');

select ok(not (select public from storage.buckets where id = 'avatars'), 'the bucket is private (no public URLs)');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('avatars', 'aaaaaaaa-0000-4000-8000-000000000001/1.jpg', 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  'allowed: uploading into your own folder');
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id) values ('avatars', 'bbbbbbbb-0000-4000-8000-000000000002/2.jpg', 'aaaaaaaa-0000-4000-8000-000000000001')$$,
  '42501', null, 'denied: uploading into someone else''s folder');
select ok(exists(select 1 from storage.objects where name = 'bbbbbbbb-0000-4000-8000-000000000002/1.jpg'),
  'allowed: signed-in users can see other riders'' photos');
-- (Deletes are checked through the Storage API in the e2e run: Storage blocks SQL deletes.)
update storage.objects set metadata = '{"hacked":true}' where name = 'bbbbbbbb-0000-4000-8000-000000000002/1.jpg';
reset role;
select is((select metadata from storage.objects where name = 'bbbbbbbb-0000-4000-8000-000000000002/1.jpg'), null,
  'denied: changing someone else''s photo (0 rows)');

select * from finish();
rollback;
