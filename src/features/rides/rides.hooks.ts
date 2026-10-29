import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createRide,
  getRide,
  listRides,
  nearbyRides,
  RIDES_PAGE_SIZE,
  ridesKeys,
  type Direction,
  type RideCursor,
} from './rides.api';
import type { PostRide } from './rides.schemas';

/** Rides tab: pages of 20, fetched as you scroll. Refetches when you return to the app. */
export function useRides(direction: Direction) {
  return useInfiniteQuery({
    queryKey: ridesKeys.list(direction),
    queryFn: ({ pageParam }) => listRides(direction, pageParam),
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
export function useNearbyRides(direction: Direction, departAt: Date) {
  // Whole minutes only, so the key (and request) changes when the picked time does.
  const minute = new Date(Math.floor(departAt.getTime() / 60_000) * 60_000).toISOString();
  return useQuery({
    queryKey: ridesKeys.nearby(direction, minute),
    queryFn: () => nearbyRides(direction, minute),
    // Keep showing the last suggestions while the next time's load, instead of flickering.
    placeholderData: keepPreviousData,
  });
}

export function useRide(id: string) {
  return useQuery({ queryKey: ridesKeys.detail(id), queryFn: () => getRide(id) });
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
