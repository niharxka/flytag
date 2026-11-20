-- analytics: saved queries for the success metrics, read in the Supabase SQL editor.
-- Why: the numbers that matter (where riders come from, completed rides, money saved,
-- retention) each take a few joins. Writing them once here means every check uses the same
-- definitions, and `select * from analytics.rides_weekly` is all you type.
-- The `analytics` schema is not in the API's exposed schemas (supabase/config.toml [api]), and
-- anon/authenticated get no access, so the app can never read these. They run as their owner,
-- which is why they can count across everyone's rows.
-- All weeks and months are San Diego calendar ones.
-- Spec: §14 success metrics.

create schema analytics;
comment on schema analytics is 'Dashboard-only metric views. Never exposed to the API.';
revoke all on schema analytics from public, anon, authenticated;

-- ---------------------------------------------------------- signups_by_source

create view analytics.signups_by_source as
select
  date_trunc('month', p.created_at at time zone 'America/Los_Angeles')::date as month,
  coalesce(pp.signup_source, '(untagged)') as signup_source,
  coalesce(pp.heard_from::text, '(no answer)') as heard_from,
  count(*) as signups,
  count(p.onboarded_at) as onboarded
from public.profiles p
join public.profile_private pp on pp.user_id = p.id
group by 1, 2, 3
order by 1 desc, 4 desc;

comment on view analytics.signups_by_source is
  'Signups per month by tagged link (utm_source) and onboarding answer. onboarded = finished onboarding.';

-- --------------------------------------------------------------- ride_results

-- One row per ride that has left and wasn't cancelled.
-- riders: people still in it at departure. completed: at least one rider said yes (a no from
-- one person and a yes from another usually means someone missed the car; the ride happened).
-- fare: the middle of the fares riders reported, else the host's estimate.
-- saved: fare × (riders − 1), what the group saved against everyone riding alone. It assumes
-- everyone still in the ride was in the car, which slightly overcounts when someone dropped out.
create view analytics.ride_results as
with members as (
  select ride_id, count(*) as riders
  from public.ride_members
  where left_at is null
  group by ride_id
),
answers as (
  select
    ride_id,
    count(*) filter (where rode_together) as yes_answers,
    count(*) filter (where not rode_together) as no_answers,
    percentile_disc(0.5) within group (order by total_fare_cents)
      filter (where rode_together and total_fare_cents is not null) as reported_fare_cents
  from public.ride_outcomes
  group by ride_id
)
select
  r.id as ride_id,
  r.direction,
  r.depart_at,
  date_trunc('week', r.depart_at at time zone 'America/Los_Angeles')::date as week,
  coalesce(m.riders, 0) as riders,
  coalesce(m.riders, 0) >= 2 as matched,
  coalesce(a.yes_answers, 0) as yes_answers,
  coalesce(a.no_answers, 0) as no_answers,
  coalesce(a.yes_answers, 0) > 0 as completed,
  coalesce(a.reported_fare_cents, r.est_total_cost_cents) as fare_cents,
  case
    when coalesce(a.yes_answers, 0) > 0
      then coalesce(a.reported_fare_cents, r.est_total_cost_cents) * (coalesce(m.riders, 0) - 1)
  end as saved_cents
from public.rides r
left join members m on m.ride_id = r.id
left join answers a on a.ride_id = r.id
where r.status = 'active' and r.depart_at <= now();

comment on view analytics.ride_results is
  'Per departed ride: riders, matched (2+), completed (a rider said yes), fare and money saved.';

-- --------------------------------------------------------------- rides_weekly

create view analytics.rides_weekly as
select
  week,
  count(*) as rides_departed,
  count(*) filter (where matched) as matched,
  count(*) filter (where completed) as completed,
  count(*) filter (where matched and yes_answers + no_answers = 0) as matched_unanswered,
  round(coalesce(sum(saved_cents), 0) / 100.0, 2) as dollars_saved
from analytics.ride_results
group by week
order by week desc;

comment on view analytics.rides_weekly is
  'Weekly: rides that left, matched, completed (north star) and dollars saved. matched_unanswered = nobody has answered yet.';

-- -------------------------------------------------------------- monthly_active

create view analytics.monthly_active as
select
  date_trunc('month', day)::date as month,
  count(distinct user_id) as active_riders,
  count(*) as active_days
from public.activity_days
group by 1
order by 1 desc;

comment on view analytics.monthly_active is 'Riders who opened the app at least once that month (data starts when activity_days shipped).';

-- ------------------------------------------------------------ retention_monthly

-- Cohort = the month a rider was first seen in activity_days (not signup month: riders who
-- signed up before this table existed have no earlier history). months_later 0 is 100%.
create view analytics.retention_monthly as
with firsts as (
  select user_id, date_trunc('month', min(day))::date as cohort
  from public.activity_days
  group by user_id
),
active as (
  select distinct user_id, date_trunc('month', day)::date as month
  from public.activity_days
)
select
  f.cohort,
  (extract(year from age(a.month, f.cohort)) * 12 + extract(month from age(a.month, f.cohort)))::int as months_later,
  count(*) as returned,
  (select count(*) from firsts f2 where f2.cohort = f.cohort) as cohort_size,
  round(100.0 * count(*) / (select count(*) from firsts f2 where f2.cohort = f.cohort), 1) as pct
from firsts f
join active a on a.user_id = f.user_id
group by f.cohort, a.month
order by f.cohort desc, months_later;

comment on view analytics.retention_monthly is
  'Of riders first seen in a month, how many came back N months later. Compare across school breaks.';

revoke all on all tables in schema analytics from public, anon, authenticated;
