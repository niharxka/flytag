import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import type { PostRide } from './rides.schemas';

export type Direction = Database['public']['Enums']['ride_direction'];
type RideCardRow = Database['public']['Views']['ride_cards']['Row'];
type GuestRideRow = Database['public']['CompositeTypes']['guest_ride'];

/** A ride as every screen sees it (camelCase, computed fields filled in). */
export type Ride = {
  id: string;
  direction: Direction;
  departAt: string;
  seatsMax: number;
  seatsTaken: number;
  riderNames: string[];
  hostId: string | null;
  hostName: string | null;
  hostHome: string | null;
  isMember: boolean;
  isHost: boolean;
  meetSpot: string | null;
  estTotalCostCents: number | null;
  notes: string | null;
  cancelled: boolean;
};

/** Where the next page starts: the last ride of the previous page. */
export type RiderIntent = Database['public']['Enums']['rider_intent'];

/** A person in a ride, as the riders panel shows them. */
export type RideMember = {
  userId: string;
  displayName: string;
  home: string | null;
  avatarPath: string | null;
  intent: RiderIntent | null;
  isHost: boolean;
  /** They share a phone with co-riders. Never the number itself (see getRiderContact). */
  phoneShared: boolean;
  isMe: boolean;
};

export type RideCursor = { departAt: string; id: string };

export const RIDES_PAGE_SIZE = 20;

export const ridesKeys = {
  all: ['rides'] as const,
  list: (direction: Direction) => [...ridesKeys.all, 'list', direction] as const,
  detail: (id: string) => [...ridesKeys.all, 'detail', id] as const,
  members: (id: string) => [...ridesKeys.all, 'members', id] as const,
  // "Did you ride together?": your answer for one ride, and the ride the Rides tab asks about.
  outcome: (id: string) => [...ridesKeys.all, 'outcome', id] as const,
  // Under 'rides', so joining or leaving (which refreshes everything there) refreshes it too.
  pendingOutcome: ['rides', 'pending-outcome'] as const,
  // Signed-out reads have their own keys: a different shape (no names) must never be served
  // from, or into, a signed-in cache entry.
  guestList: (direction: Direction) => [...ridesKeys.all, 'guest', 'list', direction] as const,
  guestDetail: (id: string) => [...ridesKeys.all, 'guest', 'detail', id] as const,
  // Rounded to the minute by the caller so typing in the picker doesn't refetch per second.
  nearby: (direction: Direction, departAt: string) =>
    [...ridesKeys.all, 'nearby', direction, departAt] as const,
};

// The view's columns are all nullable in the generated types (Postgres can't prove otherwise
// for views); the SQL guarantees the computed ones, so default them here, once.
function toRide(r: RideCardRow): Ride {
  return {
    id: r.id,
    direction: r.direction,
    departAt: r.depart_at,
    seatsMax: r.seats_max,
    seatsTaken: r.seats_taken ?? 0,
    riderNames: r.rider_names ?? [],
    hostId: r.host_id,
    hostName: r.host_name,
    hostHome: r.host_home,
    isMember: r.is_member ?? false,
    isHost: r.is_host ?? false,
    meetSpot: r.meet_spot,
    estTotalCostCents: r.est_total_cost_cents,
    notes: r.notes,
    cancelled: r.status === 'cancelled',
  };
}

// Guests get times and seats only (list_rides_guest), so everything about people is empty and
// every free-text field is null. Screens already hide a section whose value is null.
function toGuestRide(r: GuestRideRow): Ride {
  return {
    id: r.id!,
    direction: r.direction!,
    departAt: r.depart_at!,
    seatsMax: r.seats_max!,
    seatsTaken: r.seats_taken ?? 0,
    riderNames: [],
    hostId: null,
    hostName: null,
    hostHome: null,
    isMember: false,
    isHost: false,
    meetSpot: null,
    estTotalCostCents: null,
    notes: null,
    cancelled: r.status === 'cancelled',
  };
}

/** Signed-out version of listRides: same paging, no names. */
export async function listRidesGuest(direction: Direction, after: RideCursor | null): Promise<Ride[]> {
  const { data, error } = await supabase.rpc('list_rides_guest', {
    p_direction: direction,
    p_after_depart_at: after?.departAt,
    p_after_id: after?.id,
    p_page_size: RIDES_PAGE_SIZE,
  });
  if (error) throw error;
  return data.map(toGuestRide);
}

/** Signed-out version of getRide. */
export async function getRideGuest(id: string): Promise<Ride> {
  const { data, error } = await supabase.rpc('get_ride_guest', { p_ride_id: id }).single();
  if (error) throw error;
  return toGuestRide(data);
}

/** One page of upcoming rides, soonest first (list_rides). */
export async function listRides(direction: Direction, after: RideCursor | null): Promise<Ride[]> {
  const { data, error } = await supabase.rpc('list_rides', {
    p_direction: direction,
    p_after_depart_at: after?.departAt,
    p_after_id: after?.id,
    p_page_size: RIDES_PAGE_SIZE,
  });
  if (error) throw error;
  return data.map(toRide);
}

/** Up to 3 joinable rides within an hour of a time: the "Ride together instead?" suggestion. */
export async function nearbyRides(direction: Direction, departAt: string): Promise<Ride[]> {
  const { data, error } = await supabase.rpc('nearby_rides', {
    p_direction: direction,
    p_depart_at: departAt,
  });
  if (error) throw error;
  return data.map(toRide);
}

export async function getRide(id: string): Promise<Ride> {
  const { data, error } = await supabase.from('ride_cards').select('*').eq('id', id).single();
  if (error) throw error;
  return toRide(data);
}

/** Post a ride; returns its id. The same requestId twice returns the same ride (double tap). */
export async function createRide(input: PostRide, requestId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_ride', {
    p_direction: input.direction,
    p_depart_at: input.departAt.toISOString(),
    p_seats_max: input.seatsMax,
    p_meet_spot: input.meetSpot,
    p_est_total_cost_cents: input.estTotalCostCents,
    p_notes: input.notes,
    p_client_request_id: requestId,
  });
  if (error) throw error;
  return data;
}

/** Current members, host first (list_ride_members). */
export async function listRideMembers(rideId: string): Promise<RideMember[]> {
  const { data, error } = await supabase.rpc('list_ride_members', { p_ride_id: rideId });
  if (error) throw error;
  return data.map((m) => ({
    userId: m.user_id,
    displayName: m.display_name,
    home: m.home,
    avatarPath: m.avatar_path,
    intent: m.intent,
    isHost: m.role === 'host',
    phoneShared: m.phone_shared,
    isMe: m.is_me,
  }));
}

/** Take a seat with the tag chosen for this ride. Fails with RIDE_FULL if the last seat just went. */
export async function joinRide(rideId: string, intent: RiderIntent | null): Promise<void> {
  const { error } = await supabase.rpc('join_ride', { p_ride_id: rideId, p_intent: intent ?? undefined });
  if (error) throw error;
}

export async function leaveRide(rideId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_ride', { p_ride_id: rideId });
  if (error) throw error;
}

/** Host only. Sends every editable field; direction can't change once posted. */
export async function updateRide(rideId: string, input: PostRide): Promise<void> {
  const { error } = await supabase.rpc('update_ride', {
    p_ride_id: rideId,
    p_depart_at: input.departAt.toISOString(),
    p_seats_max: input.seatsMax,
    p_meet_spot: input.meetSpot,
    p_est_total_cost_cents: input.estTotalCostCents,
    p_notes: input.notes,
  });
  if (error) throw error;
}

export async function cancelRide(rideId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_ride', { p_ride_id: rideId });
  if (error) throw error;
}

/** A co-rider's phone. The server refuses (NOT_ALLOWED) unless you're both in and they share. */
export async function getRiderContact(rideId: string, userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_rider_contact', { p_ride_id: rideId, p_user_id: userId });
  if (error) throw error;
  return data;
}

/** Your answer to "Did you ride together?" for one ride. */
export type RideOutcome = { rodeTogether: boolean; totalFareCents: number | null };

/** Your most recent shared ride that left 1 h–14 days ago and you haven't answered, or null. */
export async function getPendingRideOutcome(): Promise<Ride | null> {
  const { data, error } = await supabase.rpc('pending_ride_outcome');
  if (error) throw error;
  return data[0] ? toRide(data[0]) : null;
}

/** RLS returns only your own answer, so a ride id is enough. Null until you answer. */
export async function getMyRideOutcome(rideId: string): Promise<RideOutcome | null> {
  const { data, error } = await supabase
    .from('ride_outcomes')
    .select('rode_together, total_fare_cents')
    .eq('ride_id', rideId)
    .maybeSingle();
  if (error) throw error;
  return data && { rodeTogether: data.rode_together, totalFareCents: data.total_fare_cents };
}

/** Save (or change) your answer. Errors: RIDE_NOT_DEPARTED, NOT_MEMBER, INVALID_DETAILS, … */
export async function recordRideOutcome(rideId: string, outcome: RideOutcome): Promise<void> {
  const { error } = await supabase.rpc('record_ride_outcome', {
    p_ride_id: rideId,
    p_rode_together: outcome.rodeTogether,
    p_total_fare_cents: outcome.totalFareCents ?? undefined,
  });
  if (error) throw error;
}
