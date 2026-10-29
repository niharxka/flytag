-- hook_restrict_signup_to_ucsd: the server-side @ucsd.edu gate (§9.2 AC).
begin;
select plan(6);

select is(public.hook_restrict_signup_to_ucsd('{"user":{"email":"triton@ucsd.edu"}}'),
  '{}'::jsonb, 'allowed: @ucsd.edu');
select is(public.hook_restrict_signup_to_ucsd('{"user":{"email":"  Triton@UCSD.EDU "}}'),
  '{}'::jsonb, 'allowed: case and spaces do not matter');
select is(public.hook_restrict_signup_to_ucsd('{"user":{"email":"someone@gmail.com"}}') -> 'error' ->> 'message',
  'Use your @ucsd.edu email.', 'denied: another domain, with the copy the app shows');
select ok(public.hook_restrict_signup_to_ucsd('{"user":{"email":"x@eng.ucsd.edu"}}') ? 'error',
  'denied: subdomains are not ucsd.edu');
select ok(public.hook_restrict_signup_to_ucsd('{"user":{"phone":"+18585550100"}}') ? 'error',
  'denied: no email at all');

set local role authenticated;
select throws_ok($$select public.hook_restrict_signup_to_ucsd('{}')$$, '42501', null,
  'denied: app users cannot call the hook themselves');
reset role;

select * from finish();
rollback;
