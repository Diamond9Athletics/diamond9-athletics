/**
 * Catch-up sync: puts a trainer's upcoming sessions onto their Google
 * Calendar. Runs right after they connect, because bookings made before
 * the connection (or while it was broken) never got an event.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createEvent, getValidAccessToken } from "./calendar";

type Category = "pitching" | "hitting";
type Athlete = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};
type Row = {
  id: string;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  service: { category: Category } | { category: Category }[] | null;
  athlete: Athlete | Athlete[] | null;
};

/** Returns how many events were created. */
export async function syncUpcomingBookings(trainerId: string): Promise<number> {
  const admin = createAdminClient();
  const { accessToken, calendarId } = await getValidAccessToken(trainerId);
  const { data, error } = await admin
    .from("bookings")
    .select(
      "id, starts_at, ends_at, notes, service:services(category), athlete:profiles!bookings_user_id_fkey(first_name, last_name, email, phone)",
    )
    .eq("trainer_id", trainerId)
    .eq("status", "confirmed")
    .is("google_event_id", null)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Row[];
  let created = 0;
  // A few at a time: quick, without tripping Google's rate limits.
  for (let i = 0; i < rows.length; i += 5) {
    const results = await Promise.allSettled(
      rows.slice(i, i + 5).map(async (b) => {
        const svc = Array.isArray(b.service) ? b.service[0] : b.service;
        const ath = Array.isArray(b.athlete) ? b.athlete[0] : b.athlete;
        const athleteName =
          `${ath?.first_name ?? ""} ${ath?.last_name ?? ""}`.trim() || "Athlete";
        // No attendee here — athletes shouldn't suddenly find old
        // sessions popping onto their own calendars.
        const eventId = await createEvent({
          accessToken,
          calendarId,
          bookingId: b.id,
          startsAt: new Date(b.starts_at),
          endsAt: new Date(b.ends_at),
          summary: `${athleteName} — ${svc?.category === "pitching" ? "Pitching" : "Hitting"}`,
          description:
            `Diamond Nine Athletics booking\n\n` +
            `Athlete: ${athleteName}\n` +
            `Email: ${ath?.email ?? "—"}\n` +
            (ath?.phone ? `Phone: ${ath.phone}\n` : "") +
            (b.notes ? `\nNote: ${b.notes}\n` : ""),
        });
        const { error: saveError } = await admin
          .from("bookings")
          .update({ google_event_id: eventId })
          .eq("id", b.id);
        if (saveError) throw new Error(saveError.message);
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled") created++;
      else console.warn("Calendar sync: event skipped:", (r.reason as Error).message);
    }
  }
  return created;
}
