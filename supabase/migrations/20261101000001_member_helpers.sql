-- is_active_member: "is this user in this ride right now?", the question every membership
-- rule asks. One definition so join, leave, contact and chat (Phase 5) all agree.
-- Spec: §7.1 helper functions.

create function public.is_active_member(p_ride_id uuid, p_user_id uuid)
returns boolean
language sql
stable
-- Runs as owner so RLS policies can call it without recursing into ride_members' own policy.
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.ride_members
    where ride_id = p_ride_id and user_id = p_user_id and left_at is null
  );
$$;

comment on function public.is_active_member is 'True if the user is currently in the ride (left_at is null).';

revoke execute on function public.is_active_member from public, anon;
grant execute on function public.is_active_member to authenticated;
