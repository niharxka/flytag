-- get_rider_contact: the only way anyone gets someone else's phone number.
-- Rule: you get it only if you are BOTH in the same ride right now AND they turned sharing
-- on. Anything else (not in the ride, they left, sharing off, no number) is NOT_ALLOWED, with
-- no hint about which, so the function can't be used to probe who has a number.
-- Spec: §7.3, §SCHEMA 4, §9.6 AC (call button only after this succeeds).
--
-- Errors: NOT_ALLOWED

create function public.get_rider_contact(p_ride_id uuid, p_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phone text;
begin
  -- 1. Both people must be in the ride right now.
  if not (public.is_active_member(p_ride_id, (select auth.uid())) and public.is_active_member(p_ride_id, p_user_id)) then
    raise exception 'NOT_ALLOWED';
  end if;

  -- 2. And the rider must have chosen to share a number they actually set.
  select phone_e164 into v_phone from public.profile_private
  where user_id = p_user_id and share_phone;
  if v_phone is null then
    raise exception 'NOT_ALLOWED';
  end if;

  return v_phone;
end;
$$;

comment on function public.get_rider_contact is
  'A co-rider''s phone, only if both are current members and they share it. Errors: NOT_ALLOWED.';

revoke execute on function public.get_rider_contact from public, anon;
grant execute on function public.get_rider_contact to authenticated;
