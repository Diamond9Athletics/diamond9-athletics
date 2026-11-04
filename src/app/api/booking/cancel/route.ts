import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, shell, fmtCT } from "@/lib/email";
import { deleteEvent, getValidAccessToken } from "@/lib/google/calendar";
import { FREE_CANCEL_HOURS, LATE_CANCELLED, isLateCancel } from "@/lib/booking/policy";

/**
 * POST /api/booking/cancel
 * Body: { bookingId }
 *
 * - Verifies the user owns the booking (or is admin).
 * - Marks it cancelled — or late_cancelled inside the free-cancel window
 *   (see lib/booking/policy), which frees the slot but counts as used.
 * - Refunds the credit unless it's a late cancellation.
 * - Sends a cancellation email to both the athlete and the trainer.
 */
export async function POST(request: NextRequest) {
  const { bookingId } = (await request.json()) ?? {};
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      "id, user_id, trainer_id, credit_bucket_id, status, starts_at, google_event_id, service:services(name), athlete:profiles!bookings_user_id_fkey(first_name, last_name, email), sibling:athletes(first_name, last_name), trainer:profiles!bookings_trainer_id_fkey(first_name, last_name, email)",
    )
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Athletes can cancel their own; admins can cancel anyone's.
  const { data: me } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (booking.user_id !== user.id && !me?.is_admin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "Booking is not active" }, { status: 400 });
  }

  // Inside the free-cancel window it's a late cancellation — unless an
  // admin is cancelling someone else's booking, which is never charged.
  const byStaff = booking.user_id !== user.id && Boolean(me?.is_admin);
  const late = !byStaff && isLateCancel(booking.starts_at);

  // Mark cancelled.
  await admin
    .from("bookings")
    .update({ status: late ? LATE_CANCELLED : "cancelled" })
    .eq("id", booking.id);

  // Refund the credit (not for late cancellations).
  if (booking.credit_bucket_id && !late) {
    const { data: bucket } = await admin
      .from("credit_buckets")
      .select("credits_remaining")
      .eq("id", booking.credit_bucket_id)
      .single();
    if (bucket) {
      await admin
        .from("credit_buckets")
        .update({ credits_remaining: bucket.credits_remaining + 1 })
        .eq("id", booking.credit_bucket_id);
    }
  }

  // Remove Google Calendar event if any.
  if (booking.google_event_id) {
    try {
      const { accessToken, calendarId } = await getValidAccessToken(
        booking.trainer_id,
      );
      await deleteEvent({
        accessToken,
        calendarId,
        eventId: booking.google_event_id,
      });
    } catch (e) {
      console.warn("Google event delete skipped:", (e as Error).message);
    }
  }

  // Send cancellation emails.
  try {
    const svc = Array.isArray(booking.service) ? booking.service[0] : booking.service;
    const ath = Array.isArray(booking.athlete) ? booking.athlete[0] : booking.athlete;
    // A brother's or sister's session: their name, the account's email.
    const sib = Array.isArray(booking.sibling) ? booking.sibling[0] : booking.sibling;
    const trn = Array.isArray(booking.trainer) ? booking.trainer[0] : booking.trainer;
    const when = fmtCT(booking.starts_at);
    const named = sib ?? ath;
    const athleteName = `${named?.first_name ?? ""} ${named?.last_name ?? ""}`.trim() || "Athlete";
    const outcome = late
      ? `Because it was less than ${FREE_CANCEL_HOURS} hours before the session, it counts as a used session${booking.credit_bucket_id ? " — the credit isn't returned" : ""}.`
      : booking.credit_bucket_id
        ? "The credit is back on your account."
        : "Book another time whenever you're ready.";

    if (ath?.email) {
      await sendEmail({
        to: ath.email,
        subject: `Session cancelled — ${when}`,
        html: shell({
          title: "Session cancelled",
          body: `
            <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fff;">Session cancelled.</h1>
            <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;">
              ${sib ? `${escape(sib.first_name)}&rsquo;s` : "Your"} ${escape(svc?.name ?? "session")} on <b style="color:#fff;">${escape(when)}</b> has been cancelled. ${escape(outcome)}
            </p>
            <p style="margin:0;color:#71717a;font-size:13px;">Ready to rebook? Sign in at diamond9athletics.com.</p>
          `,
        }),
        replyTo: "support@diamond9athletics.com",
      });
    }
    if (trn?.email) {
      await sendEmail({
        to: trn.email,
        subject: `${late ? "Late cancellation" : "Cancellation"} — ${athleteName} — ${when}`,
        html: shell({
          title: "Booking cancelled",
          body: `
            <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#fff;">${late ? "Late cancellation." : "Booking cancelled."}</h1>
            <p style="margin:0;color:#a1a1aa;font-size:14px;">
              ${escape(athleteName)} cancelled their ${escape(svc?.name ?? "session")} on <b style="color:#fff;">${escape(when)}</b>${
                late ? ` — less than ${FREE_CANCEL_HOURS} hours before, so it counts as used` : ""
              }.
            </p>
          `,
        }),
        replyTo: ath?.email,
      });
    }
  } catch (e) {
    console.error("Cancellation email failed:", e);
  }

  return NextResponse.json({ ok: true, late });
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
