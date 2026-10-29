-- my_chats: the Chats tab. Rides I'm in, each with its latest message, most recently active
-- first. One request for the whole tab.
-- Rides stay listed until a day after departure (people sort out lost items and fares), and
-- cancelled rides drop off.
-- Spec: §6.3, §7.3, §9.7.

create function public.my_chats()
returns table (
  ride_id uuid,
  direction public.ride_direction,
  depart_at timestamptz,
  seats_taken integer,
  seats_max smallint,
  rider_names text[],
  host_name text,
  last_body text,
  last_kind public.message_kind,
  last_author_name text,
  last_is_mine boolean,
  last_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id, c.direction, c.depart_at, c.seats_taken, c.seats_max, c.rider_names, c.host_name,
    lm.body, lm.kind, lm.author_name, lm.is_mine, lm.created_at
  from public.ride_cards c
  -- The newest message (RLS: only rides I'm in return any).
  left join lateral (
    select m.body, m.kind, p.display_name as author_name, m.author_id = (select auth.uid()) as is_mine, m.created_at
    from public.messages m
    left join public.profiles p on p.id = m.author_id
    where m.ride_id = c.id
    order by m.created_at desc
    limit 1
  ) lm on true
  where c.is_member
    and c.status = 'active'
    and c.depart_at > now() - interval '1 day'
  -- Latest activity first; a ride with no messages sorts by its departure.
  order by coalesce(lm.created_at, c.depart_at) desc;
$$;

comment on function public.my_chats() is 'Rides I''m in with their latest message, most recent first (Chats tab).';

revoke execute on function public.my_chats from public, anon;
grant execute on function public.my_chats to authenticated;
