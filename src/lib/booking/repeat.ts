/**
 * Weekly repeat booking: the same time on the same weekday for a few
 * weeks running, all inside the booking window. Shared by the booking
 * page (to show the dates) and POST /api/booking/create (to book them).
 */
import { addDays } from "./coach-calendar";
import { STUDIO_TZ, zonedWallToUtc } from "./tz";

/** How far ahead anyone can book (matches the credit-expiry rule). */
export const BOOKING_WINDOW_DAYS = 31;

/** Most sessions one weekly repeat books. */
export const MAX_REPEAT_WEEKS = 5;

/** Whether a session start falls inside the booking window. */
export function inBookingWindow(start: Date, now = Date.now()): boolean {
  return start.getTime() <= now + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/** Up to `weeks` sessions a week apart (`date` is the studio day), at the
 *  first one's studio wall-clock time — 5:00 PM stays 5:00 PM across a
 *  DST change. Callers check each against the booking window. */
export function weeklyStarts(first: Date, weeks: number): { start: Date; date: string }[] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(first);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const firstDate = `${part("year")}-${part("month")}-${part("day")}`;
  const time = `${part("hour")}:${part("minute")}`;

  const out: { start: Date; date: string }[] = [];
  for (let k = 0; k < Math.min(weeks, MAX_REPEAT_WEEKS); k++) {
    const date = addDays(firstDate, 7 * k);
    out.push({ start: k === 0 ? first : zonedWallToUtc(date, time), date });
  }
  return out;
}
