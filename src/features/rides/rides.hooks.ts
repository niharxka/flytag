import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useIsGuest } from '@/features/auth';

import {
  cancelRide,
  createRide,
  getMyRideOutcome,
  getPendingRideOutcome,
  getRide,
  getRideGuest,
  getRiderContact,
  joinRide,
  leaveRide,
  listRideMembers,
  listRides,
  listRidesGuest,
  nearbyRides,
  recordRideOutcome,
  RIDES_PAGE_SIZE,
  ridesKeys,
  updateRide,
  type Direction,
  type Ride,
  type RideCursor,
  type RideOutcome,
  type RiderIntent,
} from './rides.api';
import type { PostRide } from './rides.schemas';

/**
 * Rides tab: pages of 20, fetched as you scroll. Refetches when you return to the app.
 * Guests read the names-free version; signing in clears the cache, so nothing carries over.
 */
export function useRides(direction: Direction) {
  const guest = useIsGuest();
  return useInfiniteQuery({
    queryKey: guest ? ridesKeys.guestList(direction) : ridesKeys.list(direction),
    queryFn: ({ pageParam }) => (guest ? listRidesGuest : listRides)(direction, pageParam),
    initialPageParam: null as RideCursor | null,
    // A short page means we've reached the end.
    getNextPageParam: (last) =>
      last.length < RIDES_PAGE_SIZE
        ? undefined
        : { departAt: last[last.length - 1].departAt, id: last[last.length - 1].id },
    select: (data) => data.pages.flat(),
  });
}

/** Rides worth joining instead of posting, for the time picked so far. */
export function useNearbyRides(direction: Direction, departAt: Date, enabled = true) {
  // Whole minutes only, so the key (and request) changes when the picked time does.
  const minute = new Date(Math.floor(departAt.getTime() / 60_000) * 60_000).toISOString();
  return useQuery({
    queryKey: ridesKeys.nearby(direction, minute),
    queryFn: () => nearbyRides(direction, minute),
    enabled,
    // Keep showing the last suggestions while the next time's load, instead of flickering.
    placeholderData: keepPreviousData,
  });
}

export function useRide(id: string) {
  const guest = useIsGuest();
  return useQuery({
    queryKey: guest ? ridesKeys.guestDetail(id) : ridesKeys.detail(id),
    queryFn: () => (guest ? getRideGuest : getRide)(id),
  });
}

export function useCreateRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, requestId }: { input: PostRide; requestId: string }) =>
      createRide(input, requestId),
    // The new ride belongs in that direction's list; everything else is unaffected.
    onSuccess: (_id, { input }) =>
      queryClient.invalidateQueries({ queryKey: ridesKeys.list(input.direction) }),
  });
}

/** Who's in a ride. Off for guests: the server would refuse, and they only see seat counts. */
export function useRideMembers(rideId: string) {
  const guest = useIsGuest();
  return useQuery({
    queryKey: ridesKeys.members(rideId),
    queryFn: () => listRideMembers(rideId),
    enabled: !guest,
  });
}

// Joining, leaving and editing change seat counts, names and "you're in" across the detail,
// the members panel and every list, so afterwards everything under ['rides'] is refetched.
function useRefreshRides() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ridesKeys.all });
}

/**
 * Join, optimistically (§8.2): the seat count and "You're in" change the moment you tap. If the
 * server says no (usually RIDE_FULL: someone took the last seat first), the old values come back
 * and the screen shows why.
 */
export function useJoinRide(rideId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefreshRides();
  return useMutation({
    mutationFn: (intent: RiderIntent | null) => joinRide(rideId, intent),
    onMutate: async () => {
      const key = ridesKeys.detail(rideId);
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<Ride>(key);
      if (before)
        queryClient.setQueryData<Ride>(key, { ...before, seatsTaken: before.seatsTaken + 1, isMember: true });
      return { before };
    },
    onError: (_err, _intent, context) => {
      if (context?.before) queryClient.setQueryData(ridesKeys.detail(rideId), context.before);
    },
    onSettled: refresh,
  });
}

export function useLeaveRide(rideId: string) {
  const refresh = useRefreshRides();
  return useMutation({ mutationFn: () => leaveRide(rideId), onSettled: refresh });
}

export function useUpdateRide(rideId: string) {
  const refresh = useRefreshRides();
  return useMutation({ mutationFn: (input: PostRide) => updateRide(rideId, input), onSuccess: refresh });
}

export function useCancelRide(rideId: string) {
  const refresh = useRefreshRides();
  return useMutation({ mutationFn: () => cancelRide(rideId), onSuccess: refresh });
}

/** Ask the server for a co-rider's number right when Call is tapped; never cached. */
export function useRiderContact(rideId: string) {
  return useMutation({ mutationFn: (userId: string) => getRiderContact(rideId, userId) });
}

/** The ride the Rides tab asks "Did you ride together?" about, if any. Off for guests. */
export function usePendingRideOutcome() {
  const guest = useIsGuest();
  return useQuery({
    queryKey: ridesKeys.pendingOutcome,
    queryFn: getPendingRideOutcome,
    enabled: !guest,
  });
}

/** Your answer for one ride; `enabled` is false until the ride has left and you were in it. */
export function useMyRideOutcome(rideId: string, enabled: boolean) {
  return useQuery({
    queryKey: ridesKeys.outcome(rideId),
    queryFn: () => getMyRideOutcome(rideId),
    enabled,
  });
}

export function useRecordRideOutcome(rideId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (outcome: RideOutcome) => recordRideOutcome(rideId, outcome),
    // The detail shows the answer; the Rides tab card moves on to the next ride (or disappears).
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ridesKeys.outcome(rideId) }),
        queryClient.invalidateQueries({ queryKey: ridesKeys.pendingOutcome }),
      ]),
  });
}
