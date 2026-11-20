-- list_rides_guest + get_ride_guest: what a signed-out visitor sees on the Rides tab and a ride page.
-- Why: people can look around before signing in. Guests get times and seats only: no names,
-- colleges, meet spot, notes or fare, because the app is open to anyone, not just UCSD students.
-- These are security definer so anon never gets a policy on rides, ride_members or profiles:
-- the return type below is the full list of what a guest can ever see.
-- Spec: §9.1–9.4, §9.6 (guest browsing).

create type public.guest_ride as (
  id uuid,
  direction public.ride_direction,
  depart_at timestamptz,
  seats_max smallint,
  seats_taken integer,
  status public.ride_status
);

comment on type public.guest_ride is 'A ride as a signed-out visitor sees it: when, which way, and how full. Nothing about who.';

-- Same filters, order and keyset paging as list_rides, so guests and riders see the same list.
create function public.list_rides_guest(
  p_direction public.ride_direction,
  p_after_depart_at timestamptz default null,
  p_after_id uuid default null,
  p_page_size integer default 20
)
returns setof public.guest_ride
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.direction,
    r.depart_at,
    r.seats_max,
    -- 1. Count seats without touching profiles: a number, never a name.
    (select count(*)::int from public.ride_members rm where rm.ride_id = r.id and rm.left_at is null),
    r.status
  from public.rides r
  where r.direction = p_direction
    and r.status = 'active'
    and r.depart_at >= public.ride_past_cutoff()
    -- 2. Start after the cursor, if there is one.
    and (p_after_depart_at is null or (r.depart_at, r.id) > (p_after_depart_at, p_after_id))
  -- 3. Soonest first; id breaks ties so the cursor is stable.
  order by r.depart_at, r.id
  -- 4. Never more than 50 per page.
  limit least(greatest(p_page_size, 1), 50);
$$;

comment on function public.list_rides_guest is
  'Signed-out version of list_rides: upcoming active rides in one direction with seat counts only.';

-- One ride by id. Cancelled and past rides still come back (a shared link should say what
-- happened), matching what ride_cards shows a signed-in rider.
create function public.get_ride_guest(p_ride_id uuid)
returns setof public.guest_ride
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.direction,
    r.depart_at,
    r.seats_max,
    (select count(*)::int from public.ride_members rm where rm.ride_id = r.id and rm.left_at is null),
    r.status
  from public.rides r
  where r.id = p_ride_id;
$$;

comment on function public.get_ride_guest is 'Signed-out version of a ride page: when, which way, seats. Empty if no such ride.';

-- Guests only. Signed-in riders keep list_rides / ride_cards, which carry names and is_member.
revoke execute on function public.list_rides_guest, public.get_ride_guest from public, authenticated;
grant execute on function public.list_rides_guest, public.get_ride_guest to anon;
