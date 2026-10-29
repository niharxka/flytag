-- messages: a ride's chat.
-- Why: riders coordinate the meet-up here. Only people currently in the ride can read or write,
-- and that rule lives in RLS, so it also holds for Realtime: Supabase only streams a new row to
-- subscribers whose select policy allows it. Leave the ride and the chat goes quiet for you.
-- Spec: §6.2 table 6, §7.1 RLS, §8.3 realtime, §10 rate limit. Hiding blocked authors arrives
-- with blocks in Phase 7.

create type public.message_kind as enum ('text', 'system');

create table public.messages (
  -- The app picks the id, so when Realtime echoes your own message back it can match it to
  -- the "sending…" bubble instead of showing it twice.
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides (id) on delete cascade,
  -- Set by the database, never by the app, so nobody can post as someone else. Null after the
  -- author deletes their account (shown as "Former rider") and for system messages.
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  kind public.message_kind not null default 'text',
  body text not null
    constraint body_length check (char_length(body) between 1 and 1000),
  -- clock_timestamp, not now(): two messages written in one transaction (a join and its
  -- system line) still get distinct, ordered times.
  created_at timestamptz not null default clock_timestamp()
);

comment on table public.messages is 'Ride chat. Text from members; system lines ("Jake joined") from triggers.';
comment on column public.messages.author_id is 'Who wrote it (auth.uid() by default). Null for system lines and deleted accounts.';
comment on column public.messages.kind is 'text (a rider wrote it) or system (written by a trigger).';
comment on column public.messages.body is '1–1000 characters.';

-- The chat screen's only query: one ride, newest first, page by page.
create index messages_ride_created_idx on public.messages (ride_id, created_at desc);
-- The rate limit's question: how many has this author sent in the last minute?
create index messages_author_created_idx on public.messages (author_id, created_at desc);

alter table public.messages enable row level security;

create policy "members can read their ride's messages"
  on public.messages for select
  to authenticated
  using (public.is_active_member(ride_id, (select auth.uid())));

create policy "members can post text as themselves"
  on public.messages for insert
  to authenticated
  with check (
    kind = 'text'
    and author_id = (select auth.uid())
    and public.is_active_member(ride_id, (select auth.uid()))
  );

-- No edits or deletes in v1. The app may only send id, ride_id and body; author_id and kind
-- come from defaults, and system lines only from triggers.
revoke insert, update, delete on public.messages from anon, authenticated;
grant insert (id, ride_id, body) on public.messages to authenticated;

-- ------------------------------------------------------------ rate limit
-- §10: at most 20 text messages per minute per person, so a stuck button or a script can't
-- flood a ride. Raises RATE_LIMITED (mapped to copy in src/lib/errors.ts).

create function public.enforce_message_rate_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind = 'text' and (
    select count(*) from public.messages
    where author_id = new.author_id and kind = 'text' and created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'RATE_LIMITED';
  end if;
  return new;
end;
$$;

comment on function public.enforce_message_rate_limit() is 'Rejects a 21st text message within a minute from the same author.';

create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.enforce_message_rate_limit();

-- ------------------------------------------------------------- realtime
-- Stream new messages and membership changes to the ride screen (§8.3). RLS above decides
-- which subscribers receive each row.
alter publication supabase_realtime add table public.messages, public.ride_members;
