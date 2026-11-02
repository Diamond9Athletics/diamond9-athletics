/**
 * Google Calendar API helpers.
 *
 * All calls accept a trainer's access_token (the caller is responsible
 * for refreshing it if needed via getValidAccessToken).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { zonedWallToUtc } from "@/lib/booking/tz";
import { refreshAccessToken } from "./oauth";

/** Refreshes the access token if it's within 60s of expiry. Returns a valid token. */
export async function getValidAccessToken(trainerId: string): Promise<{
  accessToken: string;
  calendarId: string;
}> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("trainer_google_oauth")
    .select("access_token, refresh_token, token_expires_at, calendar_id")
    .eq("trainer_id", trainerId)
    .single();
  if (error || !row) throw new Error("Trainer has not connected Google Calendar");

  const expiresAt = new Date(row.token_expires_at).getTime();
  if (Date.now() < expiresAt - 60_000) {
    return { accessToken: row.access_token, calendarId: row.calendar_id };
  }

  const refreshed = await refreshAccessToken(row.refresh_token);
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
  await admin
    .from("trainer_google_oauth")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiresAt.toISOString(),
    })
    .eq("trainer_id", trainerId);
  return { accessToken: refreshed.access_token, calendarId: row.calendar_id };
}

/** List the trainer's Google Calendars. Used right after OAuth to pick one. */
export async function listCalendars(accessToken: string): Promise<
  { id: string; summary: string; primary?: boolean }[]
> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`calendarList failed: ${await res.text()}`);
  const json = await res.json();
  return (json.items ?? []).map((c: { id: string; summary: string; primary?: boolean }) => ({
    id: c.id,
    summary: c.summary,
    primary: c.primary,
  }));
}

export type BusyRange = { start: Date; end: Date };

type CalendarEvent = {
  status?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
  extendedProperties?: { private?: Record<string, string> };
};

/**
 * Busy ranges on the trainer's calendar in [timeMin, timeMax) — their own
 * appointments. Our session events are skipped (createEvent tags them
 * with d9BookingId); otherwise a pitching slot would look full after its
 * first athlete. Otherwise follows Google's free/busy rules: "Show as:
 * Free" events, cancelled events and declined invites don't count.
 */
export async function getBusy({
  accessToken,
  calendarId,
  timeMin,
  timeMax,
}: {
  accessToken: string;
  calendarId: string;
  timeMin: Date;
  timeMax: Date;
}): Promise<BusyRange[]> {
  const busy: BusyRange[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      maxResults: "250",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) {
      console.error("Calendar events list failed:", await res.text());
      return []; // Don't break booking if Google hiccups.
    }
    const json = await res.json();
    for (const ev of (json.items ?? []) as CalendarEvent[]) {
      if (ev.status === "cancelled" || ev.transparency === "transparent") continue;
      if (ev.extendedProperties?.private?.d9BookingId) continue;
      if (ev.attendees?.some((a) => a.self && a.responseStatus === "declined")) continue;
      const start = eventTime(ev.start);
      const end = eventTime(ev.end);
      if (start && end) busy.push({ start, end });
    }
    pageToken = json.nextPageToken;
  } while (pageToken);
  return busy;
}

/** Timed events carry an instant; all-day events a date, read as studio midnight. */
function eventTime(t: CalendarEvent["start"]): Date | null {
  if (t?.dateTime) return new Date(t.dateTime);
  if (t?.date) return zonedWallToUtc(t.date, "00:00");
  return null;
}

/**
 * Create the event for a booking. Returns the Google event id. The event
 * is tagged with the booking id so getBusy can tell our sessions apart
 * from the trainer's own appointments.
 */
export async function createEvent({
  accessToken,
  calendarId,
  bookingId,
  startsAt,
  endsAt,
  summary,
  description,
  attendeeEmail,
}: {
  accessToken: string;
  calendarId: string;
  bookingId: string;
  startsAt: Date;
  endsAt: Date;
  summary: string;
  description?: string;
  attendeeEmail?: string;
}): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=none`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startsAt.toISOString() },
        end: { dateTime: endsAt.toISOString() },
        attendees: attendeeEmail ? [{ email: attendeeEmail }] : undefined,
        reminders: { useDefault: true },
        extendedProperties: { private: { d9BookingId: bookingId } },
      }),
    },
  );
  if (!res.ok) throw new Error(`createEvent failed: ${await res.text()}`);
  const json = await res.json();
  return json.id as string;
}

/** Move an existing event to a new start/end. Same event id kept. */
export async function patchEvent({
  accessToken,
  calendarId,
  eventId,
  startsAt,
  endsAt,
}: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  startsAt: Date;
  endsAt: Date;
}): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start: { dateTime: startsAt.toISOString() },
        end: { dateTime: endsAt.toISOString() },
      }),
    },
  );
  if (!res.ok) throw new Error(`patchEvent failed: ${await res.text()}`);
}

/** Delete an event. */
export async function deleteEvent({
  accessToken,
  calendarId,
  eventId,
}: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`deleteEvent failed: ${await res.text()}`);
  }
}
