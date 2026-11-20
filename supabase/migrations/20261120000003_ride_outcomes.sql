-- ride_outcomes: after a ride leaves, each rider says whether they actually rode together and,
-- optionally, what the whole fare was.
-- Why: "matched" only means 2+ people were in the ride, not that they shared a car. A yes here
-- is a completed ride, the more honest north star. The fare turns into "students saved $X":
-- a group of n splitting fare F saves F × (n − 1) against everyone riding alone.
-- One row per rider per ride, so riders can't outvote each other by answering twice; answering
-- again changes your answer. Writes go through record_ride_outcome(), which checks you were in
-- the ride and that it has left.
-- Spec: §14 success metrics (completed rides, money saved).
--
-- Errors (record_ride_outcome): RIDE_NOT_FOUND, RIDE_NOT_ACTIVE (cancelled),
-- RIDE_NOT_DEPARTED, NOT_MEMBER, INVALID_DETAILS

create table public.ride_outcomes (
  ride_id uuid not null references public.rides (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rode_together boolean not null,
  total_fare_cents integer
    constraint total_fare_range check (total_fare_cents between 0 and 50000),
  answered_at timestamptz not null default now(),
  primary key (ride_id, user_id),
  -- A fare only means something if the ride happened.
  constraint fare_needs_ride check (rode_together or total_fare_cents is null)
);

comment on table public.ride_outcomes is
  'Each rider''s answer to "Did you ride together?" after departure. Written only by record_ride_outcome().';
comment on column public.ride_outcomes.rode_together is 'true: shared the car. false: the ride fell through or they went separately.';
comment on column public.ride_outcomes.total_fare_cents is 'What the whole ride cost, in US cents, as this rider remembers it. Optional.';

alter table public.ride_outcomes enable row level security;

-- Your own answers only: the app needs them to know whether to ask again.
create policy "riders can read their own ride answers"
  on public.ride_outcomes for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on public.ride_outcomes from anon, authenticated;

-- ------------------------------------------------------- record_ride_outcome

create function public.record_ride_outcome(
  p_ride_id uuid,
  p_rode_together boolean,
  p_total_fare_cents integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_ride public.rides;
begin
  if v_user is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  -- 1. The ride must exist, not be cancelled, and have left.
  select * into v_ride from public.rides where id = p_ride_id;
  if not found then
    raise exception 'RIDE_NOT_FOUND';
  end if;
  if v_ride.status = 'cancelled' then
    raise exception 'RIDE_NOT_ACTIVE';
  end if;
  if v_ride.depart_at > now() then
    raise exception 'RIDE_NOT_DEPARTED';
  end if;

  -- 2. Only people still in the ride at departure can say how it went.
  if not public.is_active_member(p_ride_id, v_user) then
    raise exception 'NOT_MEMBER';
  end if;

  -- 3. Same limits as the table, as a code the app can show (a CHECK failure can't be mapped).
  if p_rode_together is null
     or (p_total_fare_cents is not null and (not p_rode_together or p_total_fare_cents not between 0 and 50000)) then
    raise exception 'INVALID_DETAILS';
  end if;

  -- 4. Save, or replace an earlier answer.
  insert into public.ride_outcomes (ride_id, user_id, rode_together, total_fare_cents)
  values (p_ride_id, v_user, p_rode_together, p_total_fare_cents)
  on conflict (ride_id, user_id) do update
    set rode_together = excluded.rode_together,
        total_fare_cents = excluded.total_fare_cents,
        answered_at = now();
end;
$$;

comment on function public.record_ride_outcome is
  'Saves (or changes) the caller''s "did you ride together?" answer and optional total fare. Errors: RIDE_NOT_FOUND, RIDE_NOT_ACTIVE, RIDE_NOT_DEPARTED, NOT_MEMBER, INVALID_DETAILS.';

revoke execute on function public.record_ride_outcome from public, anon;
grant execute on function public.record_ride_outcome to authenticated;

-- ------------------------------------------------------ pending_ride_outcome

-- The ride to ask about on the Rides tab: your most recent one that left between an hour and
-- two weeks ago (long enough to have arrived, recent enough to remember), had someone besides
-- you in it, and that you haven't answered. Runs as the caller, so ride_cards' RLS applies.
create function public.pending_ride_outcome()
returns setof public.ride_cards
language sql
stable
set search_path = ''
as $$
  select rc.*
  from public.ride_cards rc
  where rc.is_member
    and rc.status = 'active'
    and rc.seats_taken >= 2
    and rc.depart_at between now() - interval '14 days' and now() - interval '1 hour'
    and not exists (
      select 1 from public.ride_outcomes o
      where o.ride_id = rc.id and o.user_id = (select auth.uid())
    )
  order by rc.depart_at desc
  limit 1;
$$;

comment on function public.pending_ride_outcome is
  'The caller''s latest unanswered shared ride that left 1 hour–14 days ago, or nothing.';

revoke execute on function public.pending_ride_outcome from public, anon;
grant execute on function public.pending_ride_outcome to authenticated;
