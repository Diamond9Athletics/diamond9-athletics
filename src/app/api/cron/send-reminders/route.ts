/**
 * Daily reminder job.
 *
 * Vercel Cron pings GET /api/cron/send-reminders each morning at ~9am CT.
 * For every confirmed booking in the next 22–26 hours, we send:
 *   • Email reminder to the athlete
 *   • SMS reminder to the athlete IF they have a phone number and
 *     Twilio is configured
 *   • Email reminder to the trainer with the day's schedule (once)
 *
 * Vercel authenticates cron requests with a bearer token — CRON_SECRET
 * in env. External hits without it are rejected.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, shell, fmtCT } from "@/lib/email";
import { sendSms } from "@/lib/sms";

export const runtime = "nodejs";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 22-26h ahead — a wide-enough band that a cron that fires slightly
  // early/late still catches tomorrow's sessions.
  const now = Date.now();
  const from = new Date(now + 22 * 3600_000);
  const to = new Date(now + 26 * 3600_000);

  const { data: bookings, error } = await admin
    .from("bookings")
    .select(
      "id, starts_at, trainer_id, service:services(name, duration_min), athlete:profiles!bookings_user_id_fkey(first_name, last_name, email, phone), trainer:profiles!bookings_trainer_id_fkey(first_name, last_name, email)",
    )
    .eq("status", "confirmed")
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let athleteEmails = 0;
  let athleteSms = 0;
  let trainerEmails = 0;
  const trainerAgenda = new Map<
    string,
    { email: string; name: string; items: string[] }
  >();

  for (const b of bookings ?? []) {
    const svc = Array.isArray(b.service) ? b.service[0] : b.service;
    const ath = Array.isArray(b.athlete) ? b.athlete[0] : b.athlete;
    const trn = Array.isArray(b.trainer) ? b.trainer[0] : b.trainer;
    if (!ath || !svc || !trn) continue;

    const when = fmtCT(b.starts_at);
    const athleteName =
      `${ath.first_name ?? ""} ${ath.last_name ?? ""}`.trim() || "Athlete";
    const trainerName =
      `${trn.first_name ?? ""} ${trn.last_name ?? ""}`.trim() || "your trainer";

    // Athlete email
    try {
      await sendEmail({
        to: ath.email,
        subject: `Reminder: ${svc.name} tomorrow at ${when.split(" at ")[1] ?? when}`,
        html: shell({
          title: "Session reminder",
          body: `
            <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#fff;">See you tomorrow.</h1>
            <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;">Hey ${escapeHtml((ath.first_name ?? "").trim() || athleteName.split(" ")[0])} — quick reminder of your session.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(153,84,210,0.06);border:1px solid rgba(153,84,210,0.15);border-radius:12px;padding:18px;margin:0 0 18px 0;">
              <tr><td style="padding:4px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">When</td></tr>
              <tr><td style="padding:0 0 10px 0;color:#fff;font-size:16px;font-weight:600;">${escapeHtml(when)}</td></tr>
              <tr><td style="padding:4px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Service</td></tr>
              <tr><td style="padding:0 0 10px 0;color:#fff;font-size:16px;">${escapeHtml(svc.name)}</td></tr>
              <tr><td style="padding:4px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Trainer</td></tr>
              <tr><td style="padding:0;color:#fff;font-size:16px;">${escapeHtml(trainerName)}</td></tr>
            </table>
            <p style="margin:0;color:#71717a;font-size:12px;">Need to reschedule or cancel? Sign in at diamond9athletics.com.</p>
          `,
        }),
        replyTo: "support@diamond9athletics.com",
      });
      athleteEmails++;
    } catch (e) {
      console.error(`athlete email failed for booking ${b.id}:`, e);
    }

    // Athlete SMS
    if (ath.phone) {
      const ok = await sendSms(
        ath.phone,
        `Diamond Nine: reminder of your ${svc.name} tomorrow — ${when}. Reply STOP to opt out.`,
      );
      if (ok) athleteSms++;
    }

    // Roll up per-trainer agenda for a single summary email.
    if (!trainerAgenda.has(b.trainer_id)) {
      trainerAgenda.set(b.trainer_id, {
        email: trn.email,
        name: trainerName,
        items: [],
      });
    }
    trainerAgenda.get(b.trainer_id)!.items.push(
      `${when} — ${athleteName} — ${svc.name}`,
    );
  }

  for (const { email, name, items } of trainerAgenda.values()) {
    const list = items
      .map(
        (i) =>
          `<li style="padding:6px 0;color:#fff;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.05);">${escapeHtml(i)}</li>`,
      )
      .join("");
    try {
      await sendEmail({
        to: email,
        subject: `Tomorrow's schedule — ${items.length} session${items.length === 1 ? "" : "s"}`,
        html: shell({
          title: "Tomorrow's schedule",
          body: `
            <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#fff;">Tomorrow's schedule</h1>
            <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;">${escapeHtml(name)} — here's what's on tomorrow.</p>
            <ul style="margin:0;padding:0;list-style:none;">${list}</ul>
          `,
        }),
      });
      trainerEmails++;
    } catch (e) {
      console.error(`trainer email failed for ${email}:`, e);
    }
  }

  return NextResponse.json({
    ok: true,
    bookingsProcessed: bookings?.length ?? 0,
    athleteEmails,
    athleteSms,
    trainerEmails,
  });
}
