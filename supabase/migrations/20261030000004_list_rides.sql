-- list_rides + nearby_rides: the two ways the app reads rides as cards.
-- Why: the Rides tab needs one request per page (§9.4 AC), and Post a ride suggests joining an
-- existing ride at a similar time instead of posting a duplicate (decision for §15 #4).
-- Both read the ride_cards view, so they obey RLS and share the seat math.
-- Spec: §6.3, §7.3, §9.4, §9.5.

-- Rides that left more than this long ago are "past" and drop off the list (§6.3).
create function public.ride_past_cutoff()
returns timestamptz
language sql
stable
as $$ select now() - interval '15 minutes' $$;

comment on function public.ride_past_cutoff() is 'Rides departing before this are past. One definition for every query.';

-- Keyset pagination: each page continues after the last (depart_at, id) the app saw, so
-- rides added while scrolling never shift a page and nothing is shown twice.
create function public.list_rides(
  p_direction public.ride_direction,
  p_after_depart_at timestamptz default null,
  p_after_id uuid default null,
  p_page_size integer default 20
)
returns setof public.ride_cards
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.ride_cards c
  where c.direction = p_direction
    and c.status = 'active'
    and c.depart_at >= public.ride_past_cutoff()
    -- 1. Start after the cursor, if there is one.
    and (p_after_depart_at is null or (c.depart_at, c.id) > (p_after_depart_at, p_after_id))
  -- 2. Soonest first; id breaks ties so the order (and the cursor) is stable.
  order by c.depart_at, c.id
  -- 3. Never more than 50 per page, whatever the app asks for.
  limit least(greatest(p_page_size, 1), 50);
$$;

comment on function public.list_rides is
  'Upcoming active rides in one direction, soonest first, full ones included. Page with the last row''s (depart_at, id).';

-- Up to 3 rides the caller could join instead of posting: same direction, not cancelled, not
-- departed, a seat free, not already theirs, and within the window of the time they picked.
create function public.nearby_rides(
  p_direction public.ride_direction,
  p_depart_at timestamptz,
  p_window_minutes integer default 60
)
returns setof public.ride_cards
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.ride_cards c
  where c.direction = p_direction
    and c.status = 'active'
    and c.depart_at > now()
    and c.seats_taken < c.seats_max
    and not c.is_member
    and c.depart_at between p_depart_at - make_interval(mins => p_window_minutes)
                        and p_depart_at + make_interval(mins => p_window_minutes)
  -- Closest in time first.
  order by abs(extract(epoch from c.depart_at - p_depart_at)), c.id
  limit 3;
$$;

comment on function public.nearby_rides is
  'Joinable rides within ±window minutes of a time, closest first, max 3. For the "Ride together instead?" suggestion.';

revoke execute on function public.list_rides, public.nearby_rides from public, anon;
grant execute on function public.list_rides, public.nearby_rides to authenticated;
