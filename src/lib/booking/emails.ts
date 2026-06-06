/**
 * Booking-specific email templates.
 */
import { fmtCT, sendEmail, shell } from "@/lib/email";

export type BookingEmailData = {
  bookingId: string;
  startsAtIso: string;
  serviceName: string;
  athleteFirstName: string | null;
  athleteLastName: string | null;
  athleteEmail: string;
  athletePhone: string | null;
  trainerFirstName: string | null;
  trainerLastName: string | null;
  trainerEmail: string;
};

export async function sendBookingConfirmedEmails(d: BookingEmailData) {
  const when = fmtCT(d.startsAtIso);
  const athleteName =
    `${d.athleteFirstName ?? ""} ${d.athleteLastName ?? ""}`.trim() || "Athlete";
  const trainerName =
    `${d.trainerFirstName ?? ""} ${d.trainerLastName ?? ""}`.trim() || "your trainer";

  // 1) Athlete confirmation.
  const athleteHtml = shell({
    title: "Session booked",
    body: `
      <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.01em;">Session booked.</h1>
      <p style="margin:0 0 22px 0;color:#a1a1aa;font-size:14px;">Looking forward to seeing you, ${escape(athleteName.split(" ")[0])}.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(153,84,210,0.06);border:1px solid rgba(153,84,210,0.15);border-radius:12px;padding:18px;margin:0 0 22px 0;">
        <tr><td style="padding:6px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">When</td></tr>
        <tr><td style="padding:0 0 14px 0;color:#fff;font-size:16px;font-weight:600;">${escape(when)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Service</td></tr>
        <tr><td style="padding:0 0 14px 0;color:#fff;font-size:16px;">${escape(d.serviceName)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Trainer</td></tr>
        <tr><td style="padding:0;color:#fff;font-size:16px;">${escape(trainerName)}</td></tr>
      </table>

      <p style="margin:0 0 8px 0;color:#a1a1aa;font-size:13px;">Need to cancel or reschedule? Reply to this email and we'll take care of it.</p>
    `,
  });
  await sendEmail({
    to: d.athleteEmail,
    subject: `Session booked — ${when}`,
    html: athleteHtml,
    replyTo: "support@diamond9athletics.com",
  });

  // 2) Trainer heads-up.
  const trainerHtml = shell({
    title: "New booking",
    body: `
      <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.01em;">New booking</h1>
      <p style="margin:0 0 22px 0;color:#a1a1aa;font-size:14px;">${escape(athleteName)} just booked a session.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;margin:0 0 14px 0;">
        <tr><td style="padding:4px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">When</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#fff;font-size:15px;font-weight:600;">${escape(when)}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Service</td></tr>
        <tr><td style="padding:0 0 10px 0;color:#fff;font-size:15px;">${escape(d.serviceName)}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Athlete</td></tr>
        <tr><td style="padding:0;color:#fff;font-size:15px;">
          ${escape(athleteName)}<br>
          <a href="mailto:${escape(d.athleteEmail)}" style="color:#b07adf;text-decoration:none;">${escape(d.athleteEmail)}</a>
          ${d.athletePhone ? `<br><a href="tel:${escape(d.athletePhone)}" style="color:#b07adf;text-decoration:none;">${escape(d.athletePhone)}</a>` : ""}
        </td></tr>
      </table>
    `,
  });
  await sendEmail({
    to: d.trainerEmail,
    subject: `New booking — ${athleteName} — ${when}`,
    html: trainerHtml,
    replyTo: d.athleteEmail,
  });
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
