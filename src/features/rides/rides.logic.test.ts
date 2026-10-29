import type { Ride } from './rides.api';
import { fareShareDollars, formatSeats, groupRidesByDay, rideTimeline } from './rides.logic';

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

describe('rideTimeline', () => {
  const depart = '2026-03-18T18:00:00Z';
  const at = (iso: string) => new Date(iso);
  const states = (steps: { label: string; state: string }[]) => steps.map((s) => `${s.label}:${s.state}`);

  it('waits for a second rider', () => {
    expect(
      states(
        rideTimeline(
          { departAt: depart, seatsTaken: 1, direction: 'to_airport' },
          at('2026-03-18T10:00:00Z'),
        ),
      ),
    ).toEqual(['Posted:done', 'Matching:current', 'Meet:next', 'At SAN:next']);
  });
  it('is matched with nothing current until the meet window', () => {
    expect(
      states(
        rideTimeline(
          { departAt: depart, seatsTaken: 2, direction: 'to_airport' },
          at('2026-03-18T10:00:00Z'),
        ),
      ),
    ).toEqual(['Posted:done', 'Matched:done', 'Meet:next', 'At SAN:next']);
  });
  it('lights up Meet 30 minutes before departure', () => {
    expect(
      states(
        rideTimeline(
          { departAt: depart, seatsTaken: 3, direction: 'to_airport' },
          at('2026-03-18T17:31:00Z'),
        ),
      ),
    ).toContain('Meet:current');
  });
  it('is on the way after departure, done 3 hours later', () => {
    const ride = { departAt: depart, seatsTaken: 2, direction: 'to_campus' as const };
    expect(states(rideTimeline(ride, at('2026-03-18T18:10:00Z')))).toEqual([
      'Posted:done',
      'Matched:done',
      'Meet:done',
      'At campus:current',
    ]);
    expect(states(rideTimeline(ride, at('2026-03-18T21:00:00Z')))).toContain('At campus:done');
  });
  it('never has two current steps', () => {
    for (let m = -240; m <= 240; m += 10) {
      const now = new Date(Date.parse(depart) + m * 60_000);
      for (const seats of [1, 2]) {
        const current = rideTimeline(
          { departAt: depart, seatsTaken: seats, direction: 'to_airport' },
          now,
        ).filter((s) => s.state === 'current');
        expect(current.length).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('fareShareDollars', () => {
  it('splits by the people in the ride now, rounding up', () => {
    expect(fareShareDollars(4800, 2)).toBe(24);
    expect(fareShareDollars(4800, 3)).toBe(16);
    expect(fareShareDollars(5000, 3)).toBe(17);
  });
  it('is the whole fare for one rider, and null with no estimate', () => {
    expect(fareShareDollars(4800, 1)).toBe(48);
    expect(fareShareDollars(null, 2)).toBeNull();
  });
});
