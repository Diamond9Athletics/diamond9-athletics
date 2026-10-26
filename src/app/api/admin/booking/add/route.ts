/**
 * Trainer: add a session for any client at any time.
 *
 * Body: {
 *   athleteId, serviceId,
 *   date (YYYY-MM-DD), time (HH:MM) — America/Chicago wall-clock,
 *   useCredit?: boolean   (default true)
 *   sendEmail?: boolean   (default true; only sent for future sessions)
 *   note?: string
 * }
 *
 * The booking is created on the signed-in trainer's calendar. None of
 * the athlete-side booking rules apply — slot capacity, the 5-hour lead
 * time, the 31-day window, and the first-session solo rule are all
 * skipped. The coach decides.
 *
 * Credits: when useCredit is on, a pitching session for an active
 * Diamond member is covered by the membership; otherwise the oldest
 * valid credit for that service is used. With no credit available the
 * session is still booked, just without one.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { zonedWallToUtc } from "@/lib/booking/tz";
import { sendBookingConfirmedEmails } from "@/lib/booking/emails";
import { createEvent, getValidAccessToken } from "@/lib/google/calendar";
import {
  DIAMOND_PITCHING_PRICE_ID,
  hasActiveSubscription,
} from "@/lib/stripe/subscription";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("is_trainer, first_name, last_name, email")
    .eq("id", user.id)
    .single();
  if (!me?.is_trainer) {
    return NextResponse.json({ error: "Only trainers can add sessions." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) ?? {};
  const athleteId: string | undefined = body.athleteId;
  const serviceId: string | undefined = body.serviceId;
  const date: string | undefined = body.date;
  const time: string | undefined = body.time;
  const useCredit = body.useCredit !== false;
  const wantEmail = body.sendEmail !== false;
  const note =
    typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";

  if (!athleteId || !serviceId) {
    return NextResponse.json(
      { error: "Pick a client and a session type." },
      { status: 400 },
    );
  }
  if (!date || !DATE_RE.test(date) || !time || !TIME_RE.test(time)) {
    return NextResponse.json(
      { error: "Pick a date and a start time." },
      { status: 400 },
    );
  }

  const startDate = zonedWallToUtc(date, time);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "That date or time isn't valid." }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: athlete }, { data: service }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, first_name, last_name, email, phone")
      .eq("id", athleteId)
      .single(),
    admin
      .from("services")
      .select("id, name, category, duration_min, active")
      .eq("id", serviceId)
      .single(),
  ]);
  if (!athlete) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }
  if (!service || !service.active) {
    return NextResponse.json({ error: "Session type not found." }, { status: 404 });
  }

  const endDate = new Date(startDate.getTime() + service.duration_min * 60_000);

  // ── Credits ──────────────────────────────────────────────────────────
  let creditBucketId: string | null = null;
  let creditNote = "Booked without using a credit.";

  if (useCredit) {
    let coveredByMembership = false;
    if (service.category === "pitching" && athlete.email) {
      try {
        coveredByMembership = await hasActiveSubscription(
          athlete.email,
          DIAMOND_PITCHING_PRICE_ID,
        );
      } catch (e) {
        console.warn("Add session: subscription check failed:", (e as Error).message);
      }
    }

    if (coveredByMembership) {
      creditNote = "Covered by their Diamond membership.";
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const { data: buckets } = await admin
        .from("credit_buckets")
        .select("id, credits_remaining, first_booking_date, expiry_days")
        .eq("user_id", athlete.id)
        .eq("service_id", service.id)
        .gt("credits_remaining", 0)
        .or(`expires_at.is.null,expires_at.gte.${today}`)
        .order("created_at", { ascending: true })
        .limit(1);
      const bucket = buckets?.[0];

      if (bucket) {
        const update: Record<string, unknown> = {
          credits_remaining: bucket.credits_remaining - 1,
        };
        // First use of a pack starts its expiry clock, same as a normal booking.
        if (!bucket.first_booking_date) {
          update.first_booking_date = startDate.toISOString().slice(0, 10);
          const exp = new Date(startDate);
          exp.setDate(exp.getDate() + (bucket.expiry_days ?? 31));
          update.expires_at = exp.toISOString().slice(0, 10);
        }
        const { error: bucketErr } = await admin
          .from("credit_buckets")
          .update(update)
          .eq("id", bucket.id);
        if (bucketErr) {
          return NextResponse.json(
            { error: `Couldn't use their credit: ${bucketErr.message}` },
            { status: 500 },
          );
        }
        creditBucketId = bucket.id;
        const left = bucket.credits_remaining - 1;
        creditNote = `Used 1 credit (${left} left for ${service.name}).`;
      } else {
        creditNote = "They had no credits for this session type, so it was booked free.";
      }
    }
  }

  // ── Booking ──────────────────────────────────────────────────────────
  const notes = note ? `Added by coach — ${note}` : "Added by coach";
  const { data: booking, error: bookErr } = await admin
    .from("bookings")
    .insert({
      user_id: athlete.id,
      trainer_id: user.id,
      service_id: service.id,
      credit_bucket_id: creditBucketId,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
      status: "confirmed",
      notes,
    })
    .select("id, starts_at")
    .single();

  if (bookErr || !booking) {
    // Give the credit back if the booking itself failed.
    if (creditBucketId) {
      const { data: b } = await admin
        .from("credit_buckets")
        .select("credits_remaining")
        .eq("id", creditBucketId)
        .single();
      if (b) {
        await admin
          .from("credit_buckets")
          .update({ credits_remaining: b.credits_remaining + 1 })
          .eq("id", creditBucketId);
      }
    }
    return NextResponse.json(
      { error: `Couldn't save the session: ${bookErr?.message ?? "unknown error"}` },
      { status: 500 },
    );
  }

  const athleteName =
    `${athlete.first_name ?? ""} ${athlete.last_name ?? ""}`.trim() || "Athlete";

  // ── Google Calendar (skipped quietly if not connected) ───────────────
  try {
    const { accessToken, calendarId } = await getValidAccessToken(user.id);
    const eventId = await createEvent({
      accessToken,
      calendarId,
      startsAt: startDate,
      endsAt: endDate,
      summary: `${athleteName} — ${service.category === "pitching" ? "Pitching" : "Hitting"}`,
      description:
        `Diamond Nine Athletics booking (added by coach)\n\n` +
        `Athlete: ${athleteName}\n` +
        `Email: ${athlete.email ?? "—"}\n` +
        (athlete.phone ? `Phone: ${athlete.phone}\n` : "") +
        (note ? `\nNote: ${note}\n` : ""),
    });
    await admin.from("bookings").update({ google_event_id: eventId }).eq("id", booking.id);
  } catch (e) {
    console.warn("Add session: Google event skipped:", (e as Error).message);
  }

  // ── Athlete confirmation (future sessions only) ──────────────────────
  let emailed = false;
  if (wantEmail && startDate.getTime() > Date.now() && athlete.email) {
    try {
      await sendBookingConfirmedEmails(
        {
          bookingId: booking.id,
          startsAtIso: booking.starts_at,
          serviceName: service.name,
          athleteFirstName: athlete.first_name,
          athleteLastName: athlete.last_name,
          athleteEmail: athlete.email,
          athletePhone: athlete.phone,
          trainerFirstName: me.first_name,
          trainerLastName: me.last_name,
          trainerEmail: me.email,
        },
        { notifyTrainer: false },
      );
      emailed = true;
    } catch (e) {
      console.error("Add session: confirmation email failed:", e);
    }
  }

  return NextResponse.json({
    ok: true,
    bookingId: booking.id,
    athleteName,
    creditNote,
    emailed,
  });
}
