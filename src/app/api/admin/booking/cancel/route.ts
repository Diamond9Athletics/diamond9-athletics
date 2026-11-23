/**
 * Admin: cancel someone's session from the coach calendar.
 *
 * POST /api/admin/booking/cancel
 * Body: { bookingId, refund?: boolean = true, notify?: boolean = true, note?: string }
 *
 * - Admins only.
 * - Frees the time. With `refund` (the default) the session goes back on the
 *   account; without it the booking is marked late_cancelled, which counts
 *   as a used session (e.g. a same-day no-show). A membership session has no
 *   credit to return either way.
 * - Removes the coach's Google Calendar event.
 * - With `notify`, emails the athlete's account, including the admin's
 *   optional note. The session's coach is told too when it isn't the admin.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, shell, fmtCT } from "@/lib/email";
import { deleteEvent, getValidAccessToken } from "@/lib/google/calendar";
import { LATE_CANCELLED } from "@/lib/booking/policy";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOTE_MAX = 500;

type Person = { first_name: string | null; last_name: string | null; email?: string | null };
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
const fullName = (p: Person | null) => `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim();

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const admin = createAdminClient();
  const { data: me } = await admin
    .from("profiles")
    .select("is_admin, first_name, last_name")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const body = (await request.json().catch(() => null)) ?? {};
  const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
  if (!UUID.test(bookingId)) return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  const refund = body.refund !== false;
  const notify = body.notify !== false;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, NOTE_MAX) : "";

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, user_id, trainer_id, credit_bucket_id, status, starts_at, google_event_id, service:services(name), athlete:profiles!bookings_user_id_fkey(first_name, last_name, email), sibling:athletes(first_name, last_name), trainer:profiles!bookings_trainer_id_fkey(first_name, last_name, email)",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "This session is already cancelled." }, { status: 409 });
  }

  // Only the request that actually flips it from confirmed goes on to give
  // the session back, so a double tap can't return two.
  const returnsCredit = refund && Boolean(booking.credit_bucket_id);
  const { data: flipped, error: updErr } = await admin
    .from("bookings")
    .update({ status: refund ? "cancelled" : LATE_CANCELLED })
    .eq("id", booking.id)
    .eq("status", "confirmed")
    .select("id");
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  if (!flipped?.length) {
    return NextResponse.json({ error: "This session is already cancelled." }, { status: 409 });
  }

  if (returnsCredit) {
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

  if (booking.google_event_id) {
    try {
      const { accessToken, calendarId } = await getValidAccessToken(booking.trainer_id);
      await deleteEvent({ accessToken, calendarId, eventId: booking.google_event_id });
    } catch (e) {
      console.warn("Admin cancel: Google event delete skipped:", (e as Error).message);
    }
  }

  const svc = one(booking.service as { name: string } | { name: string }[] | null);
  const account = one(booking.athlete as Person | Person[] | null);
  // A brother's or sister's session: their name, the account's email.
  const sibling = one(booking.sibling as Person | Person[] | null);
  const coach = one(booking.trainer as Person | Person[] | null);
  const when = fmtCT(booking.starts_at);
  const service = svc?.name ?? "session";
  const athleteName = fullName(sibling ?? account) || "Athlete";
  const adminName = fullName(me) || "Diamond Nine Athletics";
  const coachFirst = coach?.first_name?.trim();
  const noteHtml = note
    ? `<div style="margin:0 0 18px 0;padding:12px 14px;border-left:3px solid #a97ce2;background:#17151c;color:#e4e4e7;font-size:14px;line-height:1.55;">
         <div style="color:#8f8b99;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px;">A note from ${escape(me.first_name?.trim() || "D9")}</div>
         ${escape(note).replace(/\n/g, "<br>")}
       </div>`
    : "";

  // Each email on its own, so one failing doesn't stop the other.
  let emailed = false;
  if (notify && account?.email) {
    const outcome = returnsCredit
      ? "The session is back on your account, so you can book another time whenever you’re ready."
      : booking.credit_bucket_id
        ? "This one counts as a used session."
        : "Book another time whenever you’re ready.";
    try {
      await sendEmail({
        to: account.email,
        subject: `Session cancelled — ${when}`,
        html: shell({
          title: "Session cancelled",
          body: `
            <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fff;">Session cancelled.</h1>
            <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;">
              ${sibling ? `${escape(sibling.first_name ?? "Your athlete")}&rsquo;s` : "Your"} ${escape(service)}${coachFirst ? ` with ${escape(coachFirst)}` : ""} on <b style="color:#fff;">${escape(when)}</b> has been cancelled by Diamond Nine Athletics. ${escape(outcome)}
            </p>
            ${noteHtml}
          `,
        }),
        replyTo: "support@diamond9athletics.com",
        idempotencyKey: `admin-cancel-${booking.id}-athlete`,
      });
      emailed = true;
    } catch (e) {
      console.error("Admin cancel: athlete email failed:", e);
    }
  }

  // The coach hears about it when someone else cancelled their session.
  if (booking.trainer_id !== user.id && coach?.email) {
    try {
      await sendEmail({
        to: coach.email,
        subject: `Session cancelled — ${athleteName} — ${when}`,
        html: shell({
          title: "Session cancelled",
          body: `
            <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#fff;">Session cancelled.</h1>
            <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;">
              ${escape(adminName)} cancelled ${escape(athleteName)}&rsquo;s ${escape(service)} on <b style="color:#fff;">${escape(when)}</b>. The time is open again.
            </p>
            ${noteHtml}
          `,
        }),
        idempotencyKey: `admin-cancel-${booking.id}-coach`,
      });
    } catch (e) {
      console.error("Admin cancel: coach email failed:", e);
    }
  }

  return NextResponse.json({ ok: true, refunded: returnsCredit, emailed });
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
