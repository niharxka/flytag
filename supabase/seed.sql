-- Local-only demo data (runs on `npm run db:reset`, never in production).
-- Two onboarded riders so a second account exists to test against. Sign in as either from the
-- app: the OTP code arrives in Mailpit (http://127.0.0.1:54324).
-- Inserting into auth.users directly skips the signup hook (that only guards the Auth API) but
-- still fires on_auth_user_created, so profiles + profile_private get created as usual.

insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'niharika@ucsd.edu', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Niharika"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'jake@ucsd.edu', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Jake"}', now(), now(), '', '', '', '');

-- Email identities, so these accounts can sign in with an OTP like real users.
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
from auth.users u
where u.email in ('niharika@ucsd.edu', 'jake@ucsd.edu');

update public.profiles p
set college_id = (select id from public.colleges where name = c.college),
    intent = c.intent::public.rider_intent,
    onboarded_at = now()
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid, 'Sixth College', 'flypal'),
  ('22222222-2222-4222-8222-222222222222'::uuid, 'Thurgood Marshall College', 'networking')
) as c(id, college, intent)
where p.id = c.id;

update public.profile_private set phone_e164 = '+18585550101', share_phone = true
where user_id = '11111111-1111-4111-8111-111111111111';
