import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmedEmails } from "@/lib/booking/emails";

/**
 * POST /api/booking/create
 * Body: { trainerId, serviceId, startsAt (ISO) }
 *
 * - Verifies the user has a credit_bucket with credits_remaining > 0 for
 *   the matching service.
 * - Inserts the booking.
 * - Decrements credits_remaining on the bucket.
 * - If this is the user's first booking against the bucket, sets
 *   first_booking_date / expires_at on the bucket.
 *
 * Not yet atomic (no DB transaction in JS supabase SDK) — we'll harden
 * this in phase 3b. For MVP we serialize the steps and accept the tiny
 * race window.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { trainerId, serviceId, startsAt, rescheduleFor } = body ?? {};

  if (!trainerId || !serviceId || !startsAt) {
    return NextResponse.json(
      { error: "Missing trainerId, serviceId, or startsAt" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();

  // If this is a reschedule, atomically cancel the old booking and refund
  // its credit first.  Then continue with normal booking creation, which
  // will consume that refunded credit.
  if (rescheduleFor) {
    const { data: oldBooking } = await admin
      .from("bookings")
      .select("id, user_id, credit_bucket_id, status")
      .eq("id", rescheduleFor)
      .single();
    if (!oldBooking || oldBooking.user_id !== user.id) {
      return NextResponse.json(
        { error: "Original booking not found" },
        { status: 404 },
      );
    }
    if (oldBooking.status === "confirmed") {
      await admin
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", oldBooking.id);
      if (oldBooking.credit_bucket_id) {
        const { data: bk } = await admin
          .from("credit_buckets")
          .select("credits_remaining")
          .eq("id", oldBooking.credit_bucket_id)
          .single();
        if (bk) {
          await admin
            .from("credit_buckets")
            .update({ credits_remaining: bk.credits_remaining + 1 })
            .eq("id", oldBooking.credit_bucket_id);
        }
      }
    }
  }

  // 1) Look up the service to know its duration.
  const { data: service, error: svcErr } = await admin
    .from("services")
    .select("id, duration_min, category")
    .eq("id", serviceId)
    .single();
  if (svcErr || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const endDate = new Date(startDate.getTime() + service.duration_min * 60_000);

  // Bookings must be within the next 31 days (matches credit-expiry rule).
  const maxBookableMs = Date.now() + 31 * 24 * 60 * 60 * 1000;
  if (startDate.getTime() > maxBookableMs) {
    return NextResponse.json(
      { error: "You can only book up to 31 days in advance." },
      { status: 400 },
    );
  }

  // 2) Find an eligible credit_bucket — same service, credits_remaining > 0,
  //    not expired.
  const today = new Date().toISOString().slice(0, 10);
  const { data: buckets, error: bucketErr } = await admin
    .from("credit_buckets")
    .select("id, credits_remaining, expires_at, first_booking_date, expiry_days")
    .eq("user_id", user.id)
    .eq("service_id", serviceId)
    .gt("credits_remaining", 0)
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order("created_at", { ascending: true });

  if (bucketErr) {
    return NextResponse.json({ error: bucketErr.message }, { status: 500 });
  }
  if (!buckets || buckets.length === 0) {
    return NextResponse.json(
      { error: "You don't have credits for this service. Buy a package first." },
      { status: 402 },
    );
  }
  const bucket = buckets[0];

  // 3) Sanity: trainer is real, the requested slot doesn't overlap an
  //    existing booking, and it falls inside an availability rule.
  //    For MVP we trust the client's /slots query did most of this; we
  //    just re-check for direct overlap here.
  const { data: clashing } = await admin
    .from("bookings")
    .select("id")
    .eq("trainer_id", trainerId)
    .eq("status", "confirmed")
    .lt("starts_at", endDate.toISOString())
    .gt("ends_at", startDate.toISOString())
    .limit(1);

  if (clashing && clashing.length > 0) {
    return NextResponse.json(
      { error: "That slot was just taken. Please pick another." },
      { status: 409 },
    );
  }

  // 4) Insert booking.
  const { data: booking, error: bookErr } = await admin
    .from("bookings")
    .insert({
      user_id: user.id,
      trainer_id: trainerId,
      service_id: serviceId,
      credit_bucket_id: bucket.id,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
      status: "confirmed",
    })
    .select("id, starts_at, ends_at")
    .single();

  if (bookErr || !booking) {
    return NextResponse.json(
      { error: `Could not save booking: ${bookErr?.message}` },
      { status: 500 },
    );
  }

  // 5) Decrement the bucket.  If this is the first booking against it,
  //    also set first_booking_date and expires_at.
  const update: Record<string, unknown> = {
    credits_remaining: bucket.credits_remaining - 1,
  };
  if (!bucket.first_booking_date) {
    const firstDate = startDate.toISOString().slice(0, 10);
    update.first_booking_date = firstDate;
    const exp = new Date(startDate);
    exp.setDate(exp.getDate() + (bucket.expiry_days ?? 31));
    update.expires_at = exp.toISOString().slice(0, 10);
  }

  await admin.from("credit_buckets").update(update).eq("id", bucket.id);

  // Fire confirmation emails (athlete + trainer).  Don't fail the
  // booking if email sending hiccups — we log and move on.
  try {
    const [{ data: athlete }, { data: trainer }, { data: svcRow }] = await Promise.all([
      admin
        .from("profiles")
        .select("first_name, last_name, email, phone")
        .eq("id", user.id)
        .single(),
      admin
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", trainerId)
        .single(),
      admin.from("services").select("name").eq("id", serviceId).single(),
    ]);

    if (athlete && trainer && svcRow) {
      await sendBookingConfirmedEmails({
        bookingId: booking.id,
        startsAtIso: booking.starts_at,
        serviceName: svcRow.name,
        athleteFirstName: athlete.first_name,
        athleteLastName: athlete.last_name,
        athleteEmail: athlete.email,
        athletePhone: athlete.phone,
        trainerFirstName: trainer.first_name,
        trainerLastName: trainer.last_name,
        trainerEmail: trainer.email,
      });
    }
  } catch (e) {
    console.error("Failed to send booking emails:", e);
  }

  return NextResponse.json({ booking });
}
