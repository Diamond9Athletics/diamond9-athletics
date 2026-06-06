import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, shell, fmtCT } from "@/lib/email";

/**
 * POST /api/booking/cancel
 * Body: { bookingId }
 *
 * - Verifies the user owns the booking (or is admin).
 * - Marks it cancelled.
 * - Refunds a credit to the bucket the booking pulled from.
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
      "id, user_id, trainer_id, credit_bucket_id, status, starts_at, service:services(name), athlete:profiles!bookings_user_id_fkey(first_name, last_name, email), trainer:profiles!bookings_trainer_id_fkey(first_name, last_name, email)",
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

  // Mark cancelled.
  await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", booking.id);

  // Refund the credit.
  if (booking.credit_bucket_id) {
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

  // Send cancellation emails.
  try {
    const svc = Array.isArray(booking.service) ? booking.service[0] : booking.service;
    const ath = Array.isArray(booking.athlete) ? booking.athlete[0] : booking.athlete;
    const trn = Array.isArray(booking.trainer) ? booking.trainer[0] : booking.trainer;
    const when = fmtCT(booking.starts_at);
    const athleteName = `${ath?.first_name ?? ""} ${ath?.last_name ?? ""}`.trim() || "Athlete";

    if (ath?.email) {
      await sendEmail({
        to: ath.email,
        subject: `Session cancelled — ${when}`,
        html: shell({
          title: "Session cancelled",
          body: `
            <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fff;">Session cancelled.</h1>
            <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;">
              Your ${escape(svc?.name ?? "session")} on <b style="color:#fff;">${escape(when)}</b> has been cancelled. The credit is back on your account.
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
        subject: `Cancellation — ${athleteName} — ${when}`,
        html: shell({
          title: "Booking cancelled",
          body: `
            <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#fff;">Booking cancelled.</h1>
            <p style="margin:0;color:#a1a1aa;font-size:14px;">
              ${escape(athleteName)} cancelled their ${escape(svc?.name ?? "session")} on <b style="color:#fff;">${escape(when)}</b>.
            </p>
          `,
        }),
        replyTo: ath?.email,
      });
    }
  } catch (e) {
    console.error("Cancellation email failed:", e);
  }

  return NextResponse.json({ ok: true });
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
