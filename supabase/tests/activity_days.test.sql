-- activity_days: record_activity() marks today once per rider; the table itself is closed to the API.
begin;
set local search_path = public, extensions;
select plan(5);

insert into auth.users (id, email) values ('aaaaaaaa-0000-4000-8000-000000000001', 'ana@ucsd.edu');

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select lives_ok($$select public.record_activity()$$, 'allowed: a signed-in rider records today');
select lives_ok($$select public.record_activity()$$, 'allowed: calling again the same day is fine');
select throws_ok($$select * from public.activity_days$$, '42501', null, 'denied: the table can''t be read through the API');
reset role;

select is((select count(*) from public.activity_days where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'),
  1::bigint, 'two opens on one day make one row');

set local role anon;
select throws_ok($$select public.record_activity()$$, '42501', null, 'denied: signed-out visitors can''t record activity');
reset role;

select * from finish();
rollback;
