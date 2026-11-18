import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sessionsIcs } from "@/lib/booking/calendar-links";

/**
 * GET /api/booking/ics?id=BOOKING_ID
 *
 * The calendar file for one of the signed-in account's own upcoming
 * sessions — "Add to calendar" on the account page. iPhones open it
 * straight into Calendar; computers download it. Same event id as the
 * confirmation email's invite, so adding both doesn't make a duplicate.
 */
export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Missing booking" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, user_id, starts_at, ends_at, status, service:services(name), trainer:profiles!bookings_trainer_id_fkey(first_name, last_name)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const service = Array.isArray(booking.service) ? booking.service[0] : booking.service;
  const trainer = Array.isArray(booking.trainer) ? booking.trainer[0] : booking.trainer;
  const trainerName = `${trainer?.first_name ?? ""} ${trainer?.last_name ?? ""}`.trim() || "your coach";
  const ics = sessionsIcs(
    [{ bookingId: booking.id, startsAtIso: booking.starts_at, endsAtIso: booking.ends_at }],
    service?.name ?? "Training Session",
    trainerName,
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="d9-session.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
