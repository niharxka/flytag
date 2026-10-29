import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/**
 * Every date the app shows or reasons about ("today", "tomorrow") is in San Diego time, even if
 * the phone is set to another zone (§10). The database stores UTC; this file is the only place
 * that converts. Formats follow the brand: "Tue 3/18", "11:00 AM", "Tue 3/18 · 11:00 AM".
 */
export const RIDE_TZ = 'America/Los_Angeles';

type DateInput = Date | string | number;

/** "Tue 3/18" */
export function formatRideDate(d: DateInput): string {
  return formatInTimeZone(d, RIDE_TZ, 'EEE M/d');
}

/** "11:00 AM" */
export function formatRideTime(d: DateInput): string {
  return formatInTimeZone(d, RIDE_TZ, 'h:mm a');
}

/** "Tue 3/18 · 11:00 AM" */
export function formatRideDateTime(d: DateInput): string {
  return `${formatRideDate(d)} · ${formatRideTime(d)}`;
}

/** "2026-03-18": the San Diego calendar day, for grouping rides by day. */
export function rideDayKey(d: DateInput): string {
  return formatInTimeZone(d, RIDE_TZ, 'yyyy-MM-dd');
}

/** Day header for the rides list: "Today", "Tomorrow", else "Tue 3/18". */
export function formatDayHeader(d: DateInput, now: Date = new Date()): string {
  const key = rideDayKey(d);
  const today = rideDayKey(now);
  if (key === today) return 'Today';
  // Noon today + 24 h is always tomorrow, even on the 23- and 25-hour daylight-saving days.
  const tomorrow = rideDayKey(fromZonedTime(`${today}T12:00:00`, RIDE_TZ).getTime() + 24 * 60 * 60 * 1000);
  if (key === tomorrow) return 'Tomorrow';
  return formatRideDate(d);
}

/**
 * Keep `base`'s San Diego time of day but move it to `day`'s San Diego calendar date. Used when
 * the date picker changes (it returns a full instant; only its day matters).
 */
export function withRideDay(base: Date, day: Date): Date {
  const date = formatInTimeZone(day, RIDE_TZ, 'yyyy-MM-dd');
  const time = formatInTimeZone(base, RIDE_TZ, 'HH:mm');
  return fromZonedTime(`${date}T${time}:00`, RIDE_TZ);
}

/** Keep `base`'s San Diego date but take `time`'s San Diego hour and minute. */
export function withRideTime(base: Date, time: Date): Date {
  const date = formatInTimeZone(base, RIDE_TZ, 'yyyy-MM-dd');
  const hm = formatInTimeZone(time, RIDE_TZ, 'HH:mm');
  return fromZonedTime(`${date}T${hm}:00`, RIDE_TZ);
}

/** A sensible default departure: at least an hour out, on the next :00 or :30. */
export function defaultDepartAt(now: Date = new Date()): Date {
  const halfHour = 30 * 60 * 1000;
  return new Date(Math.ceil((now.getTime() + 60 * 60 * 1000) / halfHour) * halfHour);
}

/** Chats tab: "11:02 AM" today, "Yesterday", else "Tue 3/18" (San Diego days). */
export function formatChatTime(d: DateInput, now: Date = new Date()): string {
  const key = rideDayKey(d);
  const today = rideDayKey(now);
  if (key === today) return formatRideTime(d);
  // Noon yesterday is always yesterday, whatever daylight saving does.
  const yesterday = rideDayKey(fromZonedTime(`${today}T12:00:00`, RIDE_TZ).getTime() - 24 * 60 * 60 * 1000);
  if (key === yesterday) return 'Yesterday';
  return formatRideDate(d);
}
