-- join_ride: take a seat in a ride, safely, even when two people tap Join on the last seat.
-- Why it locks: without the lock, two joins can both count "3 of 4", both insert, and the ride
-- ends up 5 of 4. `select … for update` makes the second join wait until the first commits;
-- it then counts again, sees 4 of 4, and gets RIDE_FULL. Exactly one wins.
-- The rider picks their tag for this ride when joining (decision for §15 #7).
-- Spec: §7.3, §9.6 AC. The "Jake joined" chat message arrives with messages in Phase 5;
-- refusing blocked users (BLOCKED) arrives with blocks in Phase 7.
--
-- Errors: NOT_ONBOARDED, RIDE_NOT_FOUND, RIDE_NOT_ACTIVE (cancelled), RIDE_DEPARTED,
--         ALREADY_MEMBER, RIDE_FULL

create function public.join_ride(p_ride_id uuid, p_intent public.rider_intent default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_ride public.rides%rowtype;
  v_taken integer;
begin
  -- 1. Signed in and onboarded.
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = v_user and onboarded_at is not null) then
    raise exception 'NOT_ONBOARDED';
  end if;

  -- 2. Lock the ride row. Any other join/leave/edit of this ride waits here until we commit.
  select * into v_ride from public.rides where id = p_ride_id for update;
  if not found then
    raise exception 'RIDE_NOT_FOUND';
  end if;

  -- 3. The ride must still be happening.
  if v_ride.status <> 'active' then
    raise exception 'RIDE_NOT_ACTIVE';
  end if;
  if v_ride.depart_at <= now() then
    raise exception 'RIDE_DEPARTED';
  end if;

  -- 4. Not already in it.
  if public.is_active_member(p_ride_id, v_user) then
    raise exception 'ALREADY_MEMBER';
  end if;

  -- 5. Count seats now that we hold the lock: this count can't be stale.
  select count(*) into v_taken from public.ride_members where ride_id = p_ride_id and left_at is null;
  if v_taken >= v_ride.seats_max then
    raise exception 'RIDE_FULL';
  end if;

  -- 6. Take the seat. Someone who left earlier rejoins on their old row (history is one row
  --    per person per ride), as a rider, with the tag they chose this time.
  insert into public.ride_members (ride_id, user_id, role, intent)
  values (p_ride_id, v_user, 'rider', p_intent)
  on conflict (ride_id, user_id) do update
    set left_at = null, joined_at = now(), role = 'rider', intent = excluded.intent;
end;
$$;

comment on function public.join_ride is
  'Joins a ride, locking it so the last seat goes to exactly one person. Errors: NOT_ONBOARDED, RIDE_NOT_FOUND, RIDE_NOT_ACTIVE, RIDE_DEPARTED, ALREADY_MEMBER, RIDE_FULL.';

revoke execute on function public.join_ride from public, anon;
grant execute on function public.join_ride to authenticated;
