-- guest_meet_spot: signed-out visitors can see a ride's meet spot.
-- Why: where to meet is what a visitor needs to judge whether a ride works for them, and it's
-- a place ("Sixth market"), not a person. Names, colleges, notes and fare stay hidden.
-- guest_ride is the full list of what a guest can see, so adding the column here is the only
-- way the field reaches them. Both functions return that type, so both must return it too.
-- Spec: §9.1, §9.6 (guest browsing; meet spot visible from 2026-11-20).

alter type public.guest_ride add attribute meet_spot text;

comment on type public.guest_ride is
  'A ride as a signed-out visitor sees it: when, which way, how full and where to meet. Nothing about who.';

create or replace function public.list_rides_guest(
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
    r.status,
    r.meet_spot
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

create or replace function public.get_ride_guest(p_ride_id uuid)
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
    r.status,
    r.meet_spot
  from public.rides r
  where r.id = p_ride_id;
$$;

comment on function public.get_ride_guest is
  'Signed-out version of a ride page: when, which way, seats and meet spot. Empty if no such ride.';
