-- list_ride_members: the riders panel. Who is in a ride, with what the panel shows.
-- Why security definer: the panel must say whether each rider shares a phone ("Jake hasn't
-- shared a number" vs a live call button), and that flag lives in profile_private, which only
-- its owner can read. This function exposes exactly one yes/no from it, never the number.
-- The number itself is only ever returned by get_rider_contact.
-- Spec: §9.6 riders panel (an RPC the spec implies but doesn't list).

create function public.list_ride_members(p_ride_id uuid)
returns table (
  user_id uuid,
  display_name text,
  home text,
  avatar_path text,
  intent public.rider_intent,
  role public.member_role,
  joined_at timestamptz,
  phone_shared boolean,
  is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    rm.user_id,
    p.display_name,
    coalesce(c.name, p.home_label),
    p.avatar_path,
    rm.intent,
    rm.role,
    rm.joined_at,
    -- Shared AND actually set: otherwise the call button would promise a number that isn't there.
    coalesce(pp.share_phone and pp.phone_e164 is not null, false),
    rm.user_id = (select auth.uid())
  from public.ride_members rm
  join public.profiles p on p.id = rm.user_id
  left join public.colleges c on c.id = p.college_id
  left join public.profile_private pp on pp.user_id = rm.user_id
  where rm.ride_id = p_ride_id
    and rm.left_at is null
    -- Signed-in callers only (anon can't execute it anyway).
    and (select auth.uid()) is not null
  -- Host first, then in the order they joined.
  order by (rm.role = 'host') desc, rm.joined_at, rm.user_id;
$$;

comment on function public.list_ride_members is
  'Current members of a ride for the riders panel: name, home, photo, tag, role, and whether they share a phone (not the number).';

revoke execute on function public.list_ride_members from public, anon;
grant execute on function public.list_ride_members to authenticated;
