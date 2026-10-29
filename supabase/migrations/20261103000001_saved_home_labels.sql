-- saved_home_labels: the custom home areas a rider has added, so they can switch between them.
-- Why: riders who move around (Pacific Beach in fall, Del Mar in spring) add each area once and
-- pick it again later. Only the chosen one is public (profiles.home_label); the list itself is
-- private, so it lives in profile_private, whose policies already limit it to its owner.
-- A list column, not a table: an area has no data of its own and is always read and saved
-- with the rest of the private row.
-- Spec: §9.9 profile editing (Home picker).

-- 1. The rule for a valid list, as a function because a CHECK can't loop over array items.
--    At most 10 areas, each trimmed and 1–40 chars (the same rule as profiles.home_label).
create function public.home_labels_valid(labels text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(labels) <= 10
    and not exists (
      select 1 from unnest(labels) as l
      where l is null or l <> btrim(l) or char_length(l) not between 1 and 40
    );
$$;

comment on function public.home_labels_valid(text[]) is
  'Check for profile_private.saved_home_labels: at most 10, each trimmed and 1–40 chars.';

-- 2. The column. Existing rows get an empty list.
alter table public.profile_private
  add column saved_home_labels text[] not null default '{}'
    constraint saved_home_labels_valid check (public.home_labels_valid(saved_home_labels));

comment on column public.profile_private.saved_home_labels is
  'Custom home areas this rider has added (max 10). Private; only the chosen one is copied to profiles.home_label.';

-- 3. Owners may edit it, like their other settings. The existing row policies already stop
--    anyone reading or changing another rider's list.
grant update (saved_home_labels) on public.profile_private to authenticated;
