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

export type TimelineStep = { label: string; state: 'done' | 'current' | 'next' };

const MINUTE = 60_000;
// When "Meet" lights up, and how long after departure the ride counts as arrived (§9.6).
const MEET_WINDOW_MIN = 30;
const ARRIVED_AFTER_MIN = 3 * 60;

/**
 * The ride's progress, Posted → Matched → Meet → At SAN / At campus (§9.6, 4 steps decided in
 * Phase 4). At most one step is "current":
 *   Matching   current until a 2nd rider joins (then done, labelled "Matched")
 *   Meet       current from 30 min before departure until departure
 *   At SAN     current after departure; done 3 h later
 * Between matching and the meet window nothing is current: there's nothing to do but wait.
 */
export function rideTimeline(
  ride: { departAt: string; seatsTaken: number; direction: 'to_airport' | 'to_campus' },
  now: Date = new Date(),
): TimelineStep[] {
  const depart = new Date(ride.departAt).getTime();
  const t = now.getTime();
  const departed = t >= depart;
  const arrived = t >= depart + ARRIVED_AFTER_MIN * MINUTE;
  const meeting = !departed && t >= depart - MEET_WINDOW_MIN * MINUTE;
  const matched = ride.seatsTaken >= 2;
  const destination = ride.direction === 'to_airport' ? 'At SAN' : 'At campus';

  return [
    { label: 'Posted', state: 'done' },
    // Once the ride has left, matching is over either way.
    {
      label: matched ? 'Matched' : 'Matching',
      state: matched || departed ? 'done' : meeting ? 'next' : 'current',
    },
    { label: 'Meet', state: departed ? 'done' : meeting ? 'current' : 'next' },
    { label: destination, state: arrived ? 'done' : departed ? 'current' : 'next' },
  ];
}

/**
 * "About $X each": the estimated total split between the people in the ride now (decided in
 * Phase 4), rounded up to whole dollars so nobody is short. Null when there's no estimate.
 */
export function fareShareDollars(estTotalCostCents: number | null, seatsTaken: number): number | null {
  if (estTotalCostCents == null) return null;
  return Math.ceil(estTotalCostCents / Math.max(seatsTaken, 1) / 100);
}
