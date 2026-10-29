-- rides + ride_members: the trips people post, and who is in each one.
-- Why: the core of FlyTag. A ride's seat count is never stored; it's the number of
-- ride_members rows with left_at null, so it can't drift out of sync.
-- Spec: §6.1 enums, §6.2 tables 4–5, §7.1 RLS.
-- Writes happen only through RPCs (create_ride now; join/leave/update/cancel in Phase 4), so
-- there are no insert/update/delete policies here. Hiding blocked hosts arrives in Phase 7.

create type public.ride_direction as enum ('to_airport', 'to_campus');
create type public.ride_status as enum ('active', 'cancelled'); -- "past" is computed from depart_at
create type public.member_role as enum ('host', 'rider');

-- ------------------------------------------------------------------- rides

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  direction public.ride_direction not null,
  depart_at timestamptz not null,
  airport_code text not null default 'SAN',
  seats_max smallint not null default 4
    constraint seats_max_range check (seats_max between 2 and 6),
  meet_spot text
    constraint meet_spot_length check (char_length(meet_spot) <= 80),
  est_total_cost_cents integer
    constraint cost_range check (est_total_cost_cents between 0 and 50000),
  notes text
    constraint notes_length check (char_length(notes) <= 280),
  status public.ride_status not null default 'active',
  -- Set by the app once per "Post ride" form, so a retried request can't create a second ride.
  client_request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_ride_per_request unique (created_by, client_request_id)
);

comment on table public.rides is 'A posted trip to or from SAN. Created only by create_ride().';
comment on column public.rides.created_by is 'Original poster. The current host is the ride_members row with role host.';
comment on column public.rides.direction is 'to_airport (leave campus) or to_campus (meet at SAN).';
comment on column public.rides.depart_at is 'to_airport: when the ride leaves campus. to_campus: meet time at SAN. UTC.';
comment on column public.rides.seats_max is 'Total seats including the host, 2–6.';
comment on column public.rides.meet_spot is 'Where riders meet, e.g. "Sixth market". Optional, ≤ 80 chars.';
comment on column public.rides.est_total_cost_cents is 'Estimated total fare in US cents; the app shows a per-person share.';
comment on column public.rides.notes is 'Free text from the host, ≤ 280 chars.';
comment on column public.rides.status is 'active or cancelled. "Past" = depart_at more than 15 min ago, not a status.';
comment on column public.rides.client_request_id is 'Idempotency key from the Post ride form (one per submit).';

-- The list's only query shape: one direction, upcoming, soonest first.
create index rides_active_direction_depart_idx on public.rides (direction, depart_at, id) where status = 'active';
create index rides_created_by_idx on public.rides (created_by);

create trigger rides_set_updated_at
  before update on public.rides
  for each row execute function public.set_updated_at();

alter table public.rides enable row level security;

create policy "signed-in users can read rides"
  on public.rides for select
  to authenticated
  using (true);

revoke insert, update, delete on public.rides from anon, authenticated;

-- ------------------------------------------------------------ ride_members

create table public.ride_members (
  ride_id uuid not null references public.rides (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'rider',
  intent public.rider_intent,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (ride_id, user_id)
);

comment on table public.ride_members is 'Who is in which ride. Leaving sets left_at (history is kept). Written only by RPCs.';
comment on column public.ride_members.role is 'host (exactly one active per ride) or rider.';
comment on column public.ride_members.intent is 'The rider''s tag for this ride, copied from their profile when they join.';
comment on column public.ride_members.left_at is 'Null while in the ride. Seats taken = members with left_at null.';

-- Exactly one active host per ride.
create unique index ride_members_one_host_idx on public.ride_members (ride_id) where role = 'host' and left_at is null;
-- "My rides" lookups.
create index ride_members_user_idx on public.ride_members (user_id) where left_at is null;

alter table public.ride_members enable row level security;

create policy "signed-in users can read members of rides they can see"
  on public.ride_members for select
  to authenticated
  using (exists (select 1 from public.rides r where r.id = ride_id));

revoke insert, update, delete on public.ride_members from anon, authenticated;
