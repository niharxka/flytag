-- colleges: signed-in users read the list; nobody can change it from the API.
begin;
-- Hosted projects keep pgTAP in the `extensions` schema; make it findable for this test only.
set local search_path = public, extensions;
select plan(4);

select is((select count(*) from public.colleges), 9::bigint, 'migration inserts 9 colleges (8 + Graduate student)');

-- Allowed: a signed-in user reads every college.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.colleges), 9::bigint, 'signed-in users can read all colleges');

-- Denied: signed-in users can't add one.
select throws_ok(
  $$insert into public.colleges (name, sort) values ('Fake College', 99)$$,
  '42501', null, 'signed-in users cannot insert colleges'
);
reset role;

-- Denied: signed-out (anon) callers see nothing.
set local role anon;
select is((select count(*) from public.colleges), 0::bigint, 'signed-out callers cannot read colleges');
reset role;

select * from finish();
rollback;
