import {
  defaultDepartAt,
  formatChatTime,
  formatDayHeader,
  formatRideDate,
  formatRideDateTime,
  formatRideTime,
  rideDayKey,
  withRideDay,
  withRideTime,
} from './dates';

// 2026-03-18 (a Wednesday) 18:00 UTC is 11:00 AM in San Diego (PDT, UTC−7).
const WED_11AM = new Date('2026-03-18T18:00:00Z');

describe('dates (San Diego time)', () => {
  it('formats like the brand', () => {
    expect(formatRideDate(WED_11AM)).toBe('Wed 3/18');
    expect(formatRideTime(WED_11AM)).toBe('11:00 AM');
    expect(formatRideDateTime(WED_11AM)).toBe('Wed 3/18 · 11:00 AM');
  });

  it('uses San Diego time, not UTC: 11 PM PDT is still the same day there', () => {
    const lateNight = new Date('2026-03-19T06:00:00Z'); // 11:00 PM on 3/18 in San Diego
    expect(rideDayKey(lateNight)).toBe('2026-03-18');
    expect(formatRideTime(lateNight)).toBe('11:00 PM');
  });

  it('labels today and tomorrow by San Diego date', () => {
    const now = new Date('2026-03-18T15:00:00Z'); // 8 AM 3/18 in San Diego
    expect(formatDayHeader(WED_11AM, now)).toBe('Today');
    expect(formatDayHeader(new Date('2026-03-19T18:00:00Z'), now)).toBe('Tomorrow');
    expect(formatDayHeader(new Date('2026-03-21T18:00:00Z'), now)).toBe('Sat 3/21');
  });

  it('changes the day but keeps the time of day', () => {
    const picked = new Date('2026-03-25T09:00:00Z'); // any instant on 3/25 in San Diego
    expect(withRideDay(WED_11AM, picked).toISOString()).toBe('2026-03-25T18:00:00.000Z');
  });

  it('changes the time but keeps the day', () => {
    const sixThirtyPm = new Date('2026-01-01T02:30:00Z'); // 6:30 PM (PST) on some other day
    expect(withRideTime(WED_11AM, sixThirtyPm).toISOString()).toBe('2026-03-19T01:30:00.000Z');
  });

  it('finds tomorrow across the spring-forward night', () => {
    const now = new Date('2026-03-08T07:30:00Z'); // 11:30 PM 3/7, clocks jump at 2 AM 3/8
    expect(formatDayHeader(new Date('2026-03-08T18:00:00Z'), now)).toBe('Tomorrow');
  });

  it('defaults to the next :00 or :30 at least an hour away', () => {
    expect(defaultDepartAt(new Date('2026-03-18T18:10:00Z')).toISOString()).toBe('2026-03-18T19:30:00.000Z');
  });

  it('labels chat times by San Diego day', () => {
    const now = new Date('2026-03-18T20:00:00Z'); // 1 PM 3/18
    expect(formatChatTime('2026-03-18T18:02:00Z', now)).toBe('11:02 AM');
    expect(formatChatTime('2026-03-17T18:00:00Z', now)).toBe('Yesterday');
    expect(formatChatTime('2026-03-14T18:00:00Z', now)).toBe('Sat 3/14');
  });
});
