-- hook_restrict_signup_to_ucsd: only @ucsd.edu emails can create an account.
-- Why: FlyTag is for UCSD students. The app also checks the domain for a friendly error, but
-- that's only a convenience; this hook is the real gate, because anyone can call the Auth API
-- directly. Supabase Auth calls it before creating any user (enabled in supabase/config.toml).
-- Spec: §2.5, §7.2, §9.2 AC.

create function public.hook_restrict_signup_to_ucsd(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  email text := lower(btrim(event -> 'user' ->> 'email'));
begin
  -- 1. Allow only addresses whose domain is exactly ucsd.edu (not eng.ucsd.edu, not xucsd.edu).
  if email is not null and email like '%@ucsd.edu' then
    return '{}'::jsonb;
  end if;

  -- 2. Anything else is refused; Auth returns this message to the app.
  return jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'Use your @ucsd.edu email.')
  );
end;
$$;

comment on function public.hook_restrict_signup_to_ucsd(jsonb) is
  'before-user-created Auth hook: rejects signups whose email is not @ucsd.edu.';

-- Only Supabase Auth may call it; nobody using the API can.
revoke execute on function public.hook_restrict_signup_to_ucsd(jsonb) from public, anon, authenticated;
grant execute on function public.hook_restrict_signup_to_ucsd(jsonb) to supabase_auth_admin;
