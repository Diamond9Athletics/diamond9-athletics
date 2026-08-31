/**
 * Admin: move a booking to a new time.
 *
 * Body: { bookingId, newStartIso }
 *
 * Keeps the same booking row, service, and credit assignment — just
 * changes starts_at / ends_at. Fails if the new slot overlaps another
 * confirmed booking with the same trainer. If a Google Calendar event
 * exists for the booking, it's patched in place.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidAccessToken, patchEvent } from "@/lib/google/calendar";
import { zonedWallToUtc } from "@/lib/booking/tz";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin, is_trainer")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin && !me?.is_trainer) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { bookingId, date, time } = (await request.json()) ?? {};
  if (!bookingId || !date || !time) {
    return NextResponse.json(
      { error: "bookingId, date (YYYY-MM-DD) and time (HH:MM) required" },
      { status: 400 },
    );
  }
  // date + time arrive in studio wall-clock. Convert to UTC instant.
  const newStart = zonedWallToUtc(date, time);
  if (Number.isNaN(newStart.getTime())) {
    return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking, error: fetchErr } = await admin
    .from("bookings")
    .select(
      "id, trainer_id, service_id, status, google_event_id, service:services(duration_min)",
    )
    .eq("id", bookingId)
    .single();
  if (fetchErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "confirmed") {
    return NextResponse.json(
      { error: "Only confirmed bookings can be moved." },
      { status: 400 },
    );
  }

  const svc = Array.isArray(booking.service) ? booking.service[0] : booking.service;
  const durationMin = svc?.duration_min ?? 60;
  const newEnd = new Date(newStart.getTime() + durationMin * 60_000);

  // Trainers can only move their own bookings; admins can move anyone's.
  if (!me.is_admin && booking.trainer_id !== user.id) {
    return NextResponse.json({ error: "Not your booking" }, { status: 403 });
  }

  // Overlap check — same trainer, another confirmed booking, not this one.
  const { data: clashing } = await admin
    .from("bookings")
    .select("id")
    .eq("trainer_id", booking.trainer_id)
    .eq("status", "confirmed")
    .neq("id", booking.id)
    .lt("starts_at", newEnd.toISOString())
    .gt("ends_at", newStart.toISOString())
    .limit(1);
  if (clashing && clashing.length > 0) {
    return NextResponse.json(
      { error: "That new time overlaps another booking." },
      { status: 409 },
    );
  }

  const { error: updErr } = await admin
    .from("bookings")
    .update({
      starts_at: newStart.toISOString(),
      ends_at: newEnd.toISOString(),
    })
    .eq("id", booking.id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Patch the Google Calendar event if one exists. Silent fail is fine —
  // the booking is moved regardless.
  if (booking.google_event_id) {
    try {
      const { accessToken, calendarId } = await getValidAccessToken(
        booking.trainer_id,
      );
      await patchEvent({
        accessToken,
        calendarId,
        eventId: booking.google_event_id,
        startsAt: newStart,
        endsAt: newEnd,
      });
    } catch (e) {
      console.warn("Move: Google patch skipped:", (e as Error).message);
    }
  }

  return NextResponse.json({ ok: true });
}
