/**
 * "Add to calendar" for booked sessions: a Google Calendar link and an
 * .ics file (Apple Calendar, Outlook, Gmail). Shared by the booking emails
 * and the account page, so a session added from either has the same
 * event id and calendars don't end up with duplicates. Safe in the browser.
 */
import { STUDIO_TZ } from "./tz";

export const STUDIO_LOCATION = "Diamond Nine Athletics, Austin, TX";
export const DASHBOARD_URL = "https://www.diamond9athletics.com/book/dashboard";

export type CalendarSession = { bookingId: string; startsAtIso: string; endsAtIso: string };

/** 20261104T230000Z — the UTC stamp calendars expect. */
export function calStamp(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function sessionTitle(serviceName: string) {
  return `${serviceName} — Diamond Nine Athletics`;
}

/** "Add to Google Calendar" link. A weekly run is one repeating event, kept
 *  in studio time so a DST change can't shift it. */
export function googleCalendarUrl(
  serviceName: string,
  trainerName: string,
  s: Pick<CalendarSession, "startsAtIso" | "endsAtIso">,
  weeks = 1,
) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: sessionTitle(serviceName),
    dates: `${calStamp(s.startsAtIso)}/${calStamp(s.endsAtIso)}`,
    details: `With ${trainerName}. Manage your booking: ${DASHBOARD_URL}`,
    location: STUDIO_LOCATION,
  });
  if (weeks > 1) {
    q.set("ctz", STUDIO_TZ);
    q.set("recur", `RRULE:FREQ=WEEKLY;COUNT=${weeks}`);
  }
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Calendar file Apple Calendar, Outlook and Gmail can all add — one event
 *  per session. */
export function sessionsIcs(sessions: CalendarSession[], serviceName: string, trainerName: string): string {
  const text = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  // Long lines are folded (CRLF + space) per the iCalendar spec.
  const fold = (line: string) => (line.match(/.{1,60}/g) ?? [line]).join("\r\n ");
  const stamp = calStamp(new Date().toISOString());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Diamond Nine Athletics//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...sessions.flatMap((s) => [
      "BEGIN:VEVENT",
      `UID:${s.bookingId}@diamond9athletics.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${calStamp(s.startsAtIso)}`,
      `DTEND:${calStamp(s.endsAtIso)}`,
      `SUMMARY:${text(sessionTitle(serviceName))}`,
      `DESCRIPTION:${text(`With ${trainerName}. Manage your booking at ${DASHBOARD_URL}`)}`,
      `LOCATION:${text(STUDIO_LOCATION)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");
}
