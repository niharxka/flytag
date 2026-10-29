import { formatDayHeader, rideDayKey } from '@/lib/dates';

import type { Ride } from './rides.api';

/** "2 of 4 seats" (brand format). */
export function formatSeats(taken: number, max: number): string {
  return `${taken} of ${max} seats`;
}

export type RideDay = { key: string; title: string; data: Ride[] };

/**
 * Split a soonest-first list into San Diego calendar days for the sticky headers
 * ("Today", "Tomorrow", "Sat 3/21"). Input order is kept, so pages can simply be concatenated.
 */
export function groupRidesByDay(rides: Ride[], now: Date = new Date()): RideDay[] {
  const days: RideDay[] = [];
  for (const ride of rides) {
    const key = rideDayKey(ride.departAt);
    const last = days[days.length - 1];
    if (last?.key === key) last.data.push(ride);
    else days.push({ key, title: formatDayHeader(ride.departAt, now), data: [ride] });
  }
  return days;
}
