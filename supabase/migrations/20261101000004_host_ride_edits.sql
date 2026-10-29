-- update_ride + cancel_ride: what only the host can do to a ride.
-- Why RPCs: rides have no update policy at all (see the rides migration), so these are the
-- only way to change one. update_ride also enforces a rule plain RLS can't express: seats
-- can't drop below the people already in the ride. Both lock the ride like join_ride, so an
-- edit can't race a join for the last seat.
-- Spec: §7.3. Notifying riders of changes arrives in Phase 6.
--
-- Errors: NOT_HOST, RIDE_NOT_FOUND, RIDE_NOT_ACTIVE, INVALID_TIME, INVALID_SEATS, INVALID_DETAILS

create function public.update_ride(
  p_ride_id uuid,
  p_depart_at timestamptz,
  p_seats_max smallint,
  p_meet_spot text default null,
  p_est_total_cost_cents integer default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_status public.ride_status;
  v_taken integer;
begin
  -- 1. Lock the ride, then check the caller is its current host.
  select status into v_status from public.rides where id = p_ride_id for update;
  if not found then
    raise exception 'RIDE_NOT_FOUND';
  end if;
  if not exists (
    select 1 from public.ride_members
    where ride_id = p_ride_id and user_id = v_user and role = 'host' and left_at is null
  ) then
    raise exception 'NOT_HOST';
  end if;
  if v_status <> 'active' then
    raise exception 'RIDE_NOT_ACTIVE';
  end if;

  -- 2. Same rules as create_ride, plus: never fewer seats than people already in.
  if p_depart_at is null or p_depart_at <= now() or p_depart_at > now() + interval '90 days' then
    raise exception 'INVALID_TIME';
  end if;
  select count(*) into v_taken from public.ride_members where ride_id = p_ride_id and left_at is null;
  if p_seats_max is null or p_seats_max not between 2 and 6 or p_seats_max < v_taken then
    raise exception 'INVALID_SEATS';
  end if;
  if char_length(p_meet_spot) > 80
     or char_length(p_notes) > 280
     or p_est_total_cost_cents not between 0 and 50000 then
    raise exception 'INVALID_DETAILS';
  end if;

  -- 3. Save. Every editable field is sent each time, so clearing one is just sending null.
  update public.rides
  set depart_at = p_depart_at,
      seats_max = p_seats_max,
      meet_spot = nullif(btrim(p_meet_spot), ''),
      est_total_cost_cents = p_est_total_cost_cents,
      notes = nullif(btrim(p_notes), '')
  where id = p_ride_id;
end;
$$;

comment on function public.update_ride is
  'Host edits time, seats (never below seats taken), meet spot, fare, notes. Errors: NOT_HOST, RIDE_NOT_FOUND, RIDE_NOT_ACTIVE, INVALID_TIME, INVALID_SEATS, INVALID_DETAILS.';

create function public.cancel_ride(p_ride_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  -- 1. Lock, then host check.
  perform 1 from public.rides where id = p_ride_id for update;
  if not found then
    raise exception 'RIDE_NOT_FOUND';
  end if;
  if not exists (
    select 1 from public.ride_members
    where ride_id = p_ride_id and user_id = v_user and role = 'host' and left_at is null
  ) then
    raise exception 'NOT_HOST';
  end if;

  -- 2. Cancelled rides drop out of every list; members keep their rows as history.
  update public.rides set status = 'cancelled' where id = p_ride_id;
end;
$$;

comment on function public.cancel_ride is 'Host cancels a ride (status cancelled). Errors: NOT_HOST, RIDE_NOT_FOUND.';

revoke execute on function public.update_ride, public.cancel_ride from public, anon;
grant execute on function public.update_ride, public.cancel_ride to authenticated;
