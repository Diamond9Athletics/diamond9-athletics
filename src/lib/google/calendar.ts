/**
 * Google Calendar API helpers.
 *
 * All calls accept a trainer's access_token (the caller is responsible
 * for refreshing it if needed via getValidAccessToken).
 */
import { createAdminClient } from "@/lib/supabase/admin";
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

/** freeBusy query — returns the busy ranges on the trainer's calendar in [timeMin, timeMax). */
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
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  });
  if (!res.ok) {
    console.error("freeBusy failed:", await res.text());
    return []; // Don't break booking if Google hiccups.
  }
  const json = await res.json();
  const busy = json.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b: { start: string; end: string }) => ({
    start: new Date(b.start),
    end: new Date(b.end),
  }));
}

/** Create an event. Returns the Google event id. */
export async function createEvent({
  accessToken,
  calendarId,
  startsAt,
  endsAt,
  summary,
  description,
  attendeeEmail,
}: {
  accessToken: string;
  calendarId: string;
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
      }),
    },
  );
  if (!res.ok) throw new Error(`createEvent failed: ${await res.text()}`);
  const json = await res.json();
  return json.id as string;
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
