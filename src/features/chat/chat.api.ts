import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type MessageRow = Database['public']['Tables']['messages']['Row'];
type Direction = Database['public']['Enums']['ride_direction'];

export type Message = {
  id: string;
  rideId: string;
  authorId: string | null;
  /** From the join when loaded; null for live messages (the screen fills it in from the riders list). */
  authorName: string | null;
  kind: 'text' | 'system';
  body: string;
  createdAt: string;
  /** Only on your own messages that haven't reached the server yet. */
  status?: 'sending' | 'failed';
};

export type ChatSummary = {
  rideId: string;
  direction: Direction;
  departAt: string;
  seatsTaken: number;
  seatsMax: number;
  riderNames: string[];
  lastBody: string | null;
  lastKind: 'text' | 'system' | null;
  lastAuthorName: string | null;
  lastIsMine: boolean;
  lastAt: string | null;
};

/** Where the next (older) page starts: the oldest message of the previous one. */
export type MessageCursor = { createdAt: string; id: string };

export const MESSAGES_PAGE_SIZE = 50;

export const chatKeys = {
  all: ['chat'] as const,
  messages: (rideId: string) => [...chatKeys.all, 'messages', rideId] as const,
  myChats: () => [...chatKeys.all, 'my-chats'] as const,
};

function toMessage(r: MessageRow & { profiles?: { display_name: string } | null }): Message {
  return {
    id: r.id,
    rideId: r.ride_id,
    authorId: r.author_id,
    authorName: r.profiles?.display_name ?? null,
    kind: r.kind,
    body: r.body,
    createdAt: r.created_at,
  };
}

/** A page of a ride's messages, newest first. RLS returns nothing unless you're in the ride. */
export async function listMessages(rideId: string, before: MessageCursor | null): Promise<Message[]> {
  let q = supabase
    .from('messages')
    .select('id, ride_id, author_id, kind, body, created_at, profiles(display_name)')
    .eq('ride_id', rideId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(MESSAGES_PAGE_SIZE);
  // Older than the cursor (created_at ties broken by id, matching the order above).
  if (before)
    q = q.or(`created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`);
  const { data, error } = await q;
  if (error) throw error;
  return data.map(toMessage);
}

/**
 * Post a text message. The id comes from the app so the live echo can be matched to the
 * "sending…" bubble. author_id and kind are filled in by the database, not sent.
 */
export async function sendMessage(id: string, rideId: string, body: string): Promise<void> {
  const { error } = await supabase.from('messages').insert({ id, ride_id: rideId, body });
  // 23505 = that id already exists: a retry of a message that did arrive. That's success.
  if (error && error.code !== '23505') throw error;
}

export async function listMyChats(): Promise<ChatSummary[]> {
  const { data, error } = await supabase.rpc('my_chats');
  if (error) throw error;
  return data.map((c) => ({
    rideId: c.ride_id,
    direction: c.direction,
    departAt: c.depart_at,
    seatsTaken: c.seats_taken,
    seatsMax: c.seats_max,
    riderNames: c.rider_names ?? [],
    lastBody: c.last_body,
    lastKind: c.last_kind,
    lastAuthorName: c.last_author_name,
    lastIsMine: c.last_is_mine ?? false,
    lastAt: c.last_at,
  }));
}

/**
 * Listen to one ride (§8.3): new messages, and anyone joining or leaving. Realtime only delivers
 * rows your RLS lets you read, so non-members receive nothing. Returns a function that stops
 * listening; call it when the screen loses focus.
 */
export function subscribeToRide(
  rideId: string,
  handlers: { onMessage: (m: Message) => void; onMembersChanged: () => void; onConnected: () => void },
): () => void {
  const channel = supabase
    .channel(`ride:${rideId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `ride_id=eq.${rideId}` },
      (p) => handlers.onMessage(toMessage(p.new as MessageRow)),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'ride_members', filter: `ride_id=eq.${rideId}` },
      () => handlers.onMembersChanged(),
    )
    // Realtime only delivers rows written after it's listening. Messages sent while the
    // connection was being set up would be missed, so the caller reloads once it's connected.
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') handlers.onConnected();
    });
  return () => {
    void supabase.removeChannel(channel);
  };
}
