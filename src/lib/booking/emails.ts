/**
 * Booking-specific email templates.
 */
import { fmtCT, sendEmail, shell } from "@/lib/email";
import { FREE_CANCEL_HOURS } from "./policy";
import { STUDIO_TZ } from "./tz";

export type BookedSession = {
  bookingId: string;
  startsAtIso: string;
  endsAtIso: string;
};

export type BookingEmailData = {
  /** Everything booked in one go, in date order: one session, or a weekly run. */
  sessions: BookedSession[];
  serviceName: string;
  athleteFirstName: string | null;
  athleteLastName: string | null;
  /** Where the athlete's emails go — the account's email and phone. */
  athleteEmail: string;
  athletePhone: string | null;
  /** Set when a parent booked for a brother or sister on their account:
   *  the account holder's name. The email goes to them. */
  bookedBy?: string | null;
  trainerFirstName: string | null;
  trainerLastName: string | null;
  trainerEmail: string;
};

const STUDIO = "Diamond Nine Athletics, Austin, TX";
const DASHBOARD = "https://www.diamond9athletics.com/book/dashboard";

/** 20261104T230000Z — the UTC stamp calendars expect. */
function calStamp(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** "Wednesdays at 5:00 PM" when every session is the same weekday and time. */
function weeklySlot(sessions: BookedSession[]): string | null {
  const part = (s: BookedSession, opts: Intl.DateTimeFormatOptions) =>
    new Date(s.startsAtIso).toLocaleString("en-US", { timeZone: STUDIO_TZ, ...opts });
  const weekday = (s: BookedSession) => part(s, { weekday: "long" });
  const time = (s: BookedSession) => part(s, { hour: "numeric", minute: "2-digit" });
  const [first] = sessions;
  if (!sessions.every((s) => weekday(s) === weekday(first) && time(s) === time(first))) {
    return null;
  }
  return `${weekday(first)}s at ${time(first)}`;
}

/** True when the sessions run every week with none missing in between. */
function everyWeek(sessions: BookedSession[]): boolean {
  const day = (s: BookedSession) =>
    Date.parse(new Date(s.startsAtIso).toLocaleDateString("en-CA", { timeZone: STUDIO_TZ }));
  return sessions.every((s, i) => i === 0 || day(s) - day(sessions[i - 1]) === 7 * 86_400_000);
}

/** "Add to Google Calendar" link. A weekly run is one repeating event, kept
 *  in studio time so a DST change can't shift it. */
function googleCalendarUrl(d: BookingEmailData, trainerName: string, s: BookedSession, weeks = 1) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `${d.serviceName} — Diamond Nine Athletics`,
    dates: `${calStamp(s.startsAtIso)}/${calStamp(s.endsAtIso)}`,
    details: `With ${trainerName}. Manage your booking: ${DASHBOARD}`,
    location: STUDIO,
  });
  if (weeks > 1) {
    q.set("ctz", STUDIO_TZ);
    q.set("recur", `RRULE:FREQ=WEEKLY;COUNT=${weeks}`);
  }
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Calendar file Apple Calendar, Outlook and Gmail can all add — one event
 *  per session. */
function sessionIcs(d: BookingEmailData, trainerName: string): string {
  const text = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  // Long lines are folded (CRLF + space) per the iCalendar spec.
  const fold = (line: string) => (line.match(/.{1,60}/g) ?? [line]).join("\r\n ");
  const stamp = calStamp(new Date().toISOString());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Diamond Nine Athletics//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...d.sessions.flatMap((s) => [
      "BEGIN:VEVENT",
      `UID:${s.bookingId}@diamond9athletics.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${calStamp(s.startsAtIso)}`,
      `DTEND:${calStamp(s.endsAtIso)}`,
      `SUMMARY:${text(`${d.serviceName} — Diamond Nine Athletics`)}`,
      `DESCRIPTION:${text(`With ${trainerName}. Manage your booking at ${DASHBOARD}`)}`,
      `LOCATION:${text(STUDIO)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");
}

/** "Wed, Nov 4" — a session's date in a list of several. */
function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: STUDIO_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export async function sendBookingConfirmedEmails(
  d: BookingEmailData,
  opts: { notifyTrainer?: boolean } = {},
) {
  const [first] = d.sessions;
  const count = d.sessions.length;
  const series = count > 1;
  const slot = series ? weeklySlot(d.sessions) : null;
  const when = fmtCT(first.startsAtIso);
  // For subject lines: the weekly pattern, or where a run starts.
  const pattern = slot ?? `starting ${when}`;
  const athleteName =
    `${d.athleteFirstName ?? ""} ${d.athleteLastName ?? ""}`.trim() || "Athlete";
  const trainerName =
    `${d.trainerFirstName ?? ""} ${d.trainerLastName ?? ""}`.trim() || "your trainer";
  const athleteFirst = athleteName.split(" ")[0];
  const parentFirst = d.bookedBy?.trim().split(" ")[0] ?? "";
  const greeting =
    d.bookedBy != null
      ? `${parentFirst ? `Hi ${parentFirst} — ` : ""}${athleteFirst} is all set. Looking forward to seeing them.`
      : `Looking forward to seeing you, ${athleteFirst}.`;

  // A weekly run with no gaps adds to Google as one repeating event; with a
  // gap, each date gets its own link instead.
  const oneLink = !series || everyWeek(d.sessions);
  const dateRows = (withLinks: boolean) =>
    d.sessions
      .map(
        (s) => `<tr><td style="padding:2px 0;color:#fff;font-size:15px;">${escape(shortDate(s.startsAtIso))}${
          withLinks
            ? ` <a href="${escape(googleCalendarUrl(d, trainerName, s))}" style="color:#b07adf;text-decoration:none;font-size:12px;">· Add to Google Calendar</a>`
            : ""
        }</td></tr>`,
      )
      .join("");
  const whenRows = (labelStyle: string, valueStyle: string, withLinks: boolean) =>
    series
      ? `<tr><td style="${labelStyle}">When</td></tr>
        <tr><td style="padding:0 0 6px 0;color:#fff;font-size:16px;font-weight:600;">${escape(slot ? `${slot} (Central)` : `${count} sessions`)}</td></tr>
        ${dateRows(withLinks)}
        <tr><td style="padding:0 0 14px 0;"></td></tr>`
      : `<tr><td style="${labelStyle}">When</td></tr>
        <tr><td style="${valueStyle}font-weight:600;">${escape(when)}</td></tr>`;

  // 1) Athlete confirmation.
  const label = "padding:6px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;";
  const value = "padding:0 0 14px 0;color:#fff;font-size:16px;";
  const athleteHtml = shell({
    title: series ? "Sessions booked" : "Session booked",
    body: `
      <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.01em;">${series ? `${count} sessions booked.` : "Session booked."}</h1>
      <p style="margin:0 0 22px 0;color:#a1a1aa;font-size:14px;">${escape(greeting)}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(153,84,210,0.06);border:1px solid rgba(153,84,210,0.15);border-radius:12px;padding:18px;margin:0 0 22px 0;">
        ${whenRows(label, value, !oneLink)}
        <tr><td style="${label}">Service</td></tr>
        <tr><td style="${value}">${escape(d.serviceName)}</td></tr>
        <tr><td style="${label}">Trainer</td></tr>
        <tr><td style="padding:0;color:#fff;font-size:16px;">${escape(trainerName)}</td></tr>
      </table>

      ${
        oneLink
          ? `<p style="margin:0 0 10px 0;">
        <a href="${escape(googleCalendarUrl(d, trainerName, first, count))}" style="display:inline-block;background:linear-gradient(135deg,#9954d2,#7a40b0);color:#000;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:800;letter-spacing:0.1em;font-size:12px;">ADD TO GOOGLE CALENDAR</a>
      </p>`
          : ""
      }
      <p style="margin:0 0 22px 0;color:#71717a;font-size:12px;">On an iPhone or using Outlook? Open the attached invite to add ${series ? "them" : "it"} to your calendar.</p>

      <p style="margin:0 0 8px 0;color:#a1a1aa;font-size:13px;">Need to change ${series ? "one" : "it"}? Cancel or reschedule from your <a href="${DASHBOARD}" style="color:#b07adf;text-decoration:none;">dashboard</a> — free up to ${FREE_CANCEL_HOURS} hours before the session. After that it counts as a used session.</p>
    `,
  });
  await sendEmail({
    to: d.athleteEmail,
    subject: series ? `${count} sessions booked — ${pattern}` : `Session booked — ${when}`,
    html: athleteHtml,
    replyTo: "support@diamond9athletics.com",
    attachments: [
      {
        filename: series ? "sessions.ics" : "session.ics",
        content: Buffer.from(sessionIcs(d, trainerName)),
        contentType: "text/calendar; charset=utf-8; method=PUBLISH",
      },
    ],
  });

  // 2) Trainer heads-up. Skipped when the trainer made the booking.
  if (opts.notifyTrainer === false) return;
  const tLabel = "padding:4px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;";
  const tValue = "padding:0 0 10px 0;color:#fff;font-size:15px;";
  const trainerHtml = shell({
    title: "New booking",
    body: `
      <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.01em;">New booking</h1>
      <p style="margin:0 0 22px 0;color:#a1a1aa;font-size:14px;">${escape(athleteName)} just booked ${series ? `${count} weekly sessions` : "a session"}${
        d.bookedBy ? ` (booked by ${escape(d.bookedBy)})` : ""
      }.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;margin:0 0 14px 0;">
        ${whenRows(tLabel, tValue, false)}
        <tr><td style="${tLabel}">Service</td></tr>
        <tr><td style="${tValue}">${escape(d.serviceName)}</td></tr>
        <tr><td style="${tLabel}">Athlete</td></tr>
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
    subject: series
      ? `New booking — ${athleteName} — ${count} sessions, ${pattern}`
      : `New booking — ${athleteName} — ${when}`,
    html: trainerHtml,
    replyTo: d.athleteEmail,
  });
}

export type PurchaseEmailData = {
  athleteFirstName: string | null;
  athleteLastName: string | null;
  athleteEmail: string;
  packageName: string;
  amountCents: number;
  credits: number;
  isEnrollment: boolean;
  purchaseId: string;
};

/**
 * Sent to the athlete immediately after Stripe webhook confirms payment.
 * Trainer also gets a heads-up so they see the new athlete on their radar.
 */
export async function sendPurchaseReceipt(
  d: PurchaseEmailData,
  trainerEmails: string[],
) {
  const athleteName =
    `${d.athleteFirstName ?? ""} ${d.athleteLastName ?? ""}`.trim() || "Athlete";
  const price = `$${(d.amountCents / 100).toFixed(2)}`;
  const creditLine = d.isEnrollment
    ? "Full program enrollment"
    : `${d.credits} ${d.credits === 1 ? "credit" : "credits"} added to your account`;
  const nextStep = d.isEnrollment
    ? `Your coach will reach out shortly to get you scheduled.`
    : `Head to your dashboard to book your first session — credits expire 31 days after your first booking, so schedule anytime.`;

  // Athlete receipt.
  const athleteHtml = shell({
    title: "Payment received",
    body: `
      <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.01em;">You're in.</h1>
      <p style="margin:0 0 22px 0;color:#a1a1aa;font-size:14px;">Thanks, ${escape(athleteName.split(" ")[0])} — payment received.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(153,84,210,0.06);border:1px solid rgba(153,84,210,0.15);border-radius:12px;padding:18px;margin:0 0 22px 0;">
        <tr><td style="padding:6px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Package</td></tr>
        <tr><td style="padding:0 0 14px 0;color:#fff;font-size:16px;font-weight:600;">${escape(d.packageName)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Amount</td></tr>
        <tr><td style="padding:0 0 14px 0;color:#fff;font-size:16px;">${escape(price)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">On your account</td></tr>
        <tr><td style="padding:0;color:#fff;font-size:16px;">${escape(creditLine)}</td></tr>
      </table>

      <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;line-height:1.5;">${escape(nextStep)}</p>
      <p style="margin:0 0 22px 0;">
        <a href="https://www.diamond9athletics.com/book/dashboard" style="display:inline-block;background:linear-gradient(135deg,#9954d2,#7a40b0);color:#000;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:800;letter-spacing:0.1em;font-size:12px;">GO TO DASHBOARD</a>
      </p>

      <p style="margin:0;color:#71717a;font-size:12px;">Receipt reference: ${escape(d.purchaseId.slice(0, 8).toUpperCase())}</p>
    `,
  });
  await sendEmail({
    to: d.athleteEmail,
    subject: `Payment received — ${d.packageName}`,
    html: athleteHtml,
    replyTo: "support@diamond9athletics.com",
  });

  // Trainer heads-up — new athlete on the roster.
  const trainerHtml = shell({
    title: "New athlete purchase",
    body: `
      <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#fff;">New purchase</h1>
      <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;">
        ${escape(athleteName)} just purchased <b style="color:#fff;">${escape(d.packageName)}</b>.
      </p>
      <p style="margin:0 0 8px 0;color:#a1a1aa;font-size:14px;">
        ${d.isEnrollment
          ? "Reach out to schedule — no credits, full program enrollment."
          : `${d.credits} ${d.credits === 1 ? "credit" : "credits"} added to their account. They'll book their own sessions from the dashboard.`}
      </p>
      <p style="margin:14px 0 0 0;color:#71717a;font-size:13px;">
        Contact: <a href="mailto:${escape(d.athleteEmail)}" style="color:#b07adf;">${escape(d.athleteEmail)}</a>
      </p>
    `,
  });
  for (const to of trainerEmails) {
    try {
      await sendEmail({
        to,
        subject: `New purchase — ${athleteName} — ${d.packageName}`,
        html: trainerHtml,
        replyTo: d.athleteEmail,
      });
    } catch (e) {
      console.warn(`Trainer notification to ${to} failed:`, (e as Error).message);
    }
  }
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
