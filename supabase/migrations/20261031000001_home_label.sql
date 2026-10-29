-- home_label: a custom home location for riders who don't live at a UCSD college.
-- Why: off-campus students (Pacific Beach, La Jolla Village…) need something truer than
-- picking the nearest college. A rider's home is EITHER a college OR a short custom label.
-- It's shown to every signed-in user, so the app asks for a neighbourhood, not an address.
-- Also renames ride_cards.host_college → host_home, which now means "college or custom label".
-- Spec: §6.2 profiles (extends it), §9.3 onboarding, §9.9 profile editing (brought forward).

alter table public.profiles
  add column home_label text
    constraint home_label_length check (char_length(home_label) between 1 and 40)
    constraint home_label_trimmed check (home_label = btrim(home_label));

comment on column public.profiles.home_label is
  'Custom home location (e.g. "Pacific Beach") when not at a UCSD college. 1–40 chars. Visible to signed-in users.';
comment on column public.profiles.college_id is 'Home college. Null until onboarding, or when home_label is used instead.';

-- One home, not two; and onboarding needs one of them (replaces the college-only rule).
alter table public.profiles
  add constraint one_home check (college_id is null or home_label is null),
  drop constraint onboarded_needs_college,
  add constraint onboarded_needs_home check (onboarded_at is null or college_id is not null or home_label is not null);

grant update (home_label) on public.profiles to authenticated;

-- Ride cards: the host's home is their college name, or their custom label.
-- Renaming keeps list_rides/nearby_rides (which return ride_cards rows) working unchanged.
alter view public.ride_cards rename column host_college to host_home;

create or replace view public.ride_cards
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
  host.home as host_home,
  coalesce(m.seats_taken, 0) as seats_taken,
  coalesce(m.rider_names, '{}') as rider_names,
  coalesce(m.is_member, false) as is_member,
  host.user_id is not distinct from (select auth.uid()) as is_host
from public.rides r
left join lateral (
  select rm.user_id, p.display_name, coalesce(c.name, p.home_label) as home
  from public.ride_members rm
  join public.profiles p on p.id = rm.user_id
  left join public.colleges c on c.id = p.college_id
  where rm.ride_id = r.id and rm.role = 'host' and rm.left_at is null
) host on true
left join lateral (
  select
    count(*)::int as seats_taken,
    array_agg(p.display_name order by (rm.role = 'host') desc, rm.joined_at) as rider_names,
    bool_or(rm.user_id = (select auth.uid())) as is_member
  from public.ride_members rm
  join public.profiles p on p.id = rm.user_id
  where rm.ride_id = r.id and rm.left_at is null
) m on true;

comment on column public.ride_cards.host_home is 'Host''s college name, or their custom home label.';
