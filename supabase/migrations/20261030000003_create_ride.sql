-- create_ride: post a ride and become its host, in one transaction.
-- Why: posting writes two tables (rides + the host's ride_members row). Doing both in one
-- function means you can never end up with a ride that has no host. It also owns the rules
-- (future time, seats 2–6) so they hold even if someone skips the app.
-- Spec: §7.3, §9.5 AC. The system chat message ("Niharika posted this ride") is added to this
-- function in Phase 5, when the messages table exists.
--
-- Errors (the message is the code; src/lib/errors.ts maps it to copy):
--   NOT_ONBOARDED   caller hasn't finished onboarding
--   INVALID_TIME    depart_at is in the past or more than 90 days away
--   INVALID_SEATS   seats_max outside 2–6
--   INVALID_DETAILS meet spot, fare or notes too long / out of range

create function public.create_ride(
  p_direction public.ride_direction,
  p_depart_at timestamptz,
  p_seats_max smallint default 4,
  p_meet_spot text default null,
  p_est_total_cost_cents integer default null,
  p_notes text default null,
  p_client_request_id uuid default null
)
returns uuid
language plpgsql
-- Runs as the owner because the caller has no insert rights on rides/ride_members.
-- search_path is empty so every name below is schema-qualified and can't be hijacked.
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_intent public.rider_intent;
  v_onboarded timestamptz;
  v_ride uuid;
begin
  -- 1. Only a signed-in, onboarded rider may post.
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  select onboarded_at, intent into v_onboarded, v_intent from public.profiles where id = v_user;
  if v_onboarded is null then
    raise exception 'NOT_ONBOARDED';
  end if;

  -- 2. Same form submitted twice (double tap, retry after a timeout)? Return the first ride.
  if p_client_request_id is not null then
    select id into v_ride from public.rides
    where created_by = v_user and client_request_id = p_client_request_id;
    if v_ride is not null then
      return v_ride;
    end if;
  end if;

  -- 3. Validate. The app checks the same things first; these are the rules that count.
  if p_depart_at is null or p_depart_at <= now() or p_depart_at > now() + interval '90 days' then
    raise exception 'INVALID_TIME';
  end if;
  if p_seats_max is null or p_seats_max not between 2 and 6 then
    raise exception 'INVALID_SEATS';
  end if;
  if char_length(p_meet_spot) > 80
     or char_length(p_notes) > 280
     or p_est_total_cost_cents not between 0 and 50000 then
    raise exception 'INVALID_DETAILS';
  end if;

  -- 4. The ride. Blank optional text is stored as null.
  begin
    insert into public.rides (created_by, direction, depart_at, seats_max, meet_spot, est_total_cost_cents, notes, client_request_id)
    values (v_user, p_direction, p_depart_at, p_seats_max,
            nullif(btrim(p_meet_spot), ''), p_est_total_cost_cents, nullif(btrim(p_notes), ''), p_client_request_id)
    returning id into v_ride;
  exception when unique_violation then
    -- Two copies of the same request raced past step 2; the other one won. Return its ride.
    select id into v_ride from public.rides
    where created_by = v_user and client_request_id = p_client_request_id;
    return v_ride;
  end;

  -- 5. The poster is the host and takes the first seat.
  insert into public.ride_members (ride_id, user_id, role, intent)
  values (v_ride, v_user, 'host', v_intent);

  return v_ride;
end;
$$;

comment on function public.create_ride is
  'Posts a ride with the caller as host. Idempotent per p_client_request_id. Errors: NOT_ONBOARDED, INVALID_TIME, INVALID_SEATS, INVALID_DETAILS.';

revoke execute on function public.create_ride from public, anon;
grant execute on function public.create_ride to authenticated;
