import type { Ride } from './rides.api';
import { formatSeats, groupRidesByDay } from './rides.logic';

const ride = (id: string, departAt: string): Ride => ({
  id,
  departAt,
  direction: 'to_airport',
  seatsMax: 4,
  seatsTaken: 1,
  riderNames: [],
  hostId: null,
  hostName: null,
  hostHome: null,
  isMember: false,
  isHost: false,
  meetSpot: null,
  estTotalCostCents: null,
  notes: null,
  cancelled: false,
});

describe('rides logic', () => {
  it('formats seats like the brand', () => {
    expect(formatSeats(2, 4)).toBe('2 of 4 seats');
  });

  it('groups by San Diego day, keeping order', () => {
    const now = new Date('2026-03-18T15:00:00Z'); // 8 AM 3/18 in San Diego
    const days = groupRidesByDay(
      [
        ride('a', '2026-03-18T18:00:00Z'), // 11 AM today
        ride('b', '2026-03-19T05:30:00Z'), // 10:30 PM today (already 3/19 in UTC)
        ride('c', '2026-03-19T18:00:00Z'), // tomorrow
        ride('d', '2026-03-21T18:00:00Z'),
      ],
      now,
    );
    expect(days.map((d) => [d.title, d.data.map((r) => r.id)])).toEqual([
      ['Today', ['a', 'b']],
      ['Tomorrow', ['c']],
      ['Sat 3/21', ['d']],
    ]);
  });
});
