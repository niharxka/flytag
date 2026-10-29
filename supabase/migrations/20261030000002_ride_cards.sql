-- ride_cards: a ride as the app shows it on a card, with the numbers that are computed rather
-- than stored (seats taken, rider names, am I in it, am I the host).
-- Why: list_rides and nearby_rides both need exactly this shape. Defining it once means the
-- seat math lives in one place. security_invoker makes the view obey the caller's RLS, so it
-- can never show more than the underlying tables would.
-- Spec: §6.3 derived data.

create view public.ride_cards
with (security_invoker = true)
as
select
  r.id,
  r.direction,
  r.depart_at,
  r.seats_max,
  r.status,
  r.meet_spot,
  r.est_total_cost_cents,
  r.notes,
  host.user_id as host_id,
  host.display_name as host_name,
  host.college_name as host_college,
  coalesce(m.seats_taken, 0) as seats_taken,
  coalesce(m.rider_names, '{}') as rider_names,
  coalesce(m.is_member, false) as is_member,
  host.user_id is not distinct from (select auth.uid()) as is_host
from public.rides r
-- The current host (role host, still in the ride).
left join lateral (
  select rm.user_id, p.display_name, c.name as college_name
  from public.ride_members rm
  join public.profiles p on p.id = rm.user_id
  left join public.colleges c on c.id = p.college_id
  where rm.ride_id = r.id and rm.role = 'host' and rm.left_at is null
) host on true
-- Everyone still in the ride: host first, then in the order they joined.
left join lateral (
  select
    count(*)::int as seats_taken,
    array_agg(p.display_name order by (rm.role = 'host') desc, rm.joined_at) as rider_names,
    bool_or(rm.user_id = (select auth.uid())) as is_member
  from public.ride_members rm
  join public.profiles p on p.id = rm.user_id
  where rm.ride_id = r.id and rm.left_at is null
) m on true;

comment on view public.ride_cards is 'One row per ride with computed seats_taken, rider_names, is_member, is_host. Obeys RLS.';
comment on column public.ride_cards.rider_names is 'Display names of current members, host first. At most seats_max (≤ 6).';

revoke all on public.ride_cards from anon;
grant select on public.ride_cards to authenticated;
