-- leave_ride: give up your seat. If the host leaves, the ride doesn't die: the rider who
-- joined earliest becomes host. If nobody is left, the ride is cancelled.
-- Why an RPC: leaving can touch three rows (your membership, the new host's, the ride itself),
-- and they must change together. It locks the ride like join_ride, so a join and a host
-- leaving at the same moment can't leave a ride with no host or two.
-- Spec: §7.3, §13 Phase 4 exit ("host handoff works"). The "Jake left" chat message and the
-- rider_left notification arrive in Phases 5–6.
--
-- Errors: NOT_MEMBER

create function public.leave_ride(p_ride_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_role public.member_role;
  v_next_host uuid;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  -- 1. Lock the ride so joins and other leaves wait for us.
  perform 1 from public.rides where id = p_ride_id for update;

  -- 2. You must be in it.
  select role into v_role from public.ride_members
  where ride_id = p_ride_id and user_id = v_user and left_at is null;
  if not found then
    raise exception 'NOT_MEMBER';
  end if;

  -- 3. Leave. The row stays (with left_at) as history, and so you can rejoin later.
  update public.ride_members set left_at = now() where ride_id = p_ride_id and user_id = v_user;

  -- 4. A rider leaving is the whole story. A host leaving hands the ride on.
  if v_role <> 'host' then
    return;
  end if;
  select user_id into v_next_host from public.ride_members
  where ride_id = p_ride_id and left_at is null
  order by joined_at, user_id
  limit 1;

  if v_next_host is null then
    -- 5a. Nobody left: the ride is over.
    update public.rides set status = 'cancelled' where id = p_ride_id;
  else
    -- 5b. Earliest rider becomes host (the old host's row, now left, no longer counts as one).
    update public.ride_members set role = 'host' where ride_id = p_ride_id and user_id = v_next_host;
  end if;
end;
$$;

comment on function public.leave_ride is
  'Leaves a ride. A leaving host is replaced by the earliest rider, or the ride is cancelled if empty. Errors: NOT_MEMBER.';

revoke execute on function public.leave_ride from public, anon;
grant execute on function public.leave_ride to authenticated;
