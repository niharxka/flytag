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

-- Demo rides, dated relative to today in San Diego time so they're always upcoming after a
-- reset. Inserted directly (create_ride needs a signed-in caller). Covers: a ride with two
-- riders, one with only its host, a full ride, a to-campus ride, and a past one (hidden).
with today as (select date_trunc('day', now() at time zone 'America/Los_Angeles') as d),
r as (
  insert into public.rides (id, created_by, direction, depart_at, seats_max, meet_spot, est_total_cost_cents, notes)
  select v.id, v.host, v.direction::public.ride_direction,
         (today.d + v.at) at time zone 'America/Los_Angeles', v.seats, v.spot, v.cost, v.notes
  from today, (values
    ('a0000000-0000-4000-8000-000000000001'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'to_airport', interval '1 day 11 hours', 4, 'Sixth market', 4800, 'Two carry-ons, happy to share an Uber XL.'),
    ('a0000000-0000-4000-8000-000000000002'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'to_airport', interval '1 day 11 hours 30 minutes', 4, 'Marshall field', null, null),
    ('a0000000-0000-4000-8000-000000000003'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'to_airport', interval '2 days 14 hours', 2, null, 3600, null),
    ('a0000000-0000-4000-8000-000000000004'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'to_campus', interval '3 days 18 hours 30 minutes', 4, 'Terminal 2 baggage claim', null, 'Landing on the 6:05 from SFO.'),
    ('a0000000-0000-4000-8000-000000000005'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'to_airport', interval '-1 hour', 4, null, null, 'Already left: should never show.')
  ) as v(id, host, direction, at, seats, spot, cost, notes)
  returning id, created_by
)
insert into public.ride_members (ride_id, user_id, role, intent)
select r.id, r.created_by, 'host', p.intent from r join public.profiles p on p.id = r.created_by;

-- Jake joins Niharika's 11:00 ride; Niharika joins Jake's 2-seat ride, filling it.
insert into public.ride_members (ride_id, user_id, role, intent, joined_at) values
  ('a0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'rider', 'networking', now()),
  ('a0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'rider', 'flypal', now());
