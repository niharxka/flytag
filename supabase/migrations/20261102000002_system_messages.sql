-- System messages: the small centred lines in a ride's chat ("Jake joined", "Niharika is now
-- the host", "Ride updated: …"). Written by triggers, so every way a ride changes (create_ride,
-- join_ride, leave_ride, update_ride, cancel_ride, and anything added later) is covered
-- without each RPC remembering to do it.
-- Spec: §SCHEMA "Life of a ride" steps 3–4, §9.6 chat ("system messages centered").
-- Names are copied into the text when the event happens, like any chat history.

-- Writes one system line. Runs as the owner: system lines bypass the "post text as yourself"
-- policy and the rate limit (which only counts text).
create function public.post_system_message(p_ride_id uuid, p_body text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.messages (ride_id, author_id, kind, body) values (p_ride_id, null, 'system', p_body);
$$;

comment on function public.post_system_message is 'Internal: adds a system line to a ride''s chat. Not callable from the app.';
revoke execute on function public.post_system_message from public, anon, authenticated;

-- ------------------------------------------------------- membership changes

create function public.on_ride_member_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  select display_name into v_name from public.profiles where id = new.user_id;

  if tg_op = 'INSERT' then
    -- 1. A new row: the poster (host) or a first-time joiner.
    perform public.post_system_message(new.ride_id,
      case when new.role = 'host' then v_name || ' posted this ride' else v_name || ' joined' end);
  elsif old.left_at is null and new.left_at is not null then
    -- 2. Left the ride.
    perform public.post_system_message(new.ride_id, v_name || ' left');
  elsif old.left_at is not null and new.left_at is null then
    -- 3. Came back (join_ride reuses the old row).
    perform public.post_system_message(new.ride_id, v_name || ' joined');
  elsif old.role = 'rider' and new.role = 'host' and new.left_at is null then
    -- 4. Took over as host after the host left.
    perform public.post_system_message(new.ride_id, v_name || ' is now the host');
  end if;
  return new;
end;
$$;

comment on function public.on_ride_member_change() is 'Posts "joined" / "left" / "is now the host" lines to the ride chat.';

create trigger ride_members_system_messages
  after insert or update on public.ride_members
  for each row execute function public.on_ride_member_change();

-- ---------------------------------------------------------- ride changes

create function public.on_ride_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changes text[] := '{}';
begin
  -- 1. Cancelled (by the host, or because the last person left).
  if old.status = 'active' and new.status = 'cancelled' then
    perform public.post_system_message(new.id, 'This ride was cancelled');
    return new;
  end if;

  -- 2. Edited: say what changed, in San Diego time and the brand's formats.
  if new.depart_at is distinct from old.depart_at then
    v_changes := v_changes || ('time is now ' ||
      to_char(new.depart_at at time zone 'America/Los_Angeles', 'Dy FMMM/FMDD · FMHH12:MI AM'));
  end if;
  if new.seats_max is distinct from old.seats_max then
    v_changes := v_changes || (new.seats_max || ' seats');
  end if;
  if new.meet_spot is distinct from old.meet_spot then
    v_changes := v_changes || coalesce('meet at ' || new.meet_spot, 'no meet spot');
  end if;
  if new.est_total_cost_cents is distinct from old.est_total_cost_cents or new.notes is distinct from old.notes then
    v_changes := v_changes || 'details changed'::text;
  end if;

  if cardinality(v_changes) > 0 then
    perform public.post_system_message(new.id, 'Ride updated: ' || array_to_string(v_changes, ', '));
  end if;
  return new;
end;
$$;

comment on function public.on_ride_change() is 'Posts "Ride updated: …" and "This ride was cancelled" lines to the ride chat.';

create trigger rides_system_messages
  after update on public.rides
  for each row execute function public.on_ride_change();
