/**
 * Error alerts: an email to the admins when something on the site breaks,
 * so Wes hears about it before a customer does.
 *
 * The same problem emails at most once every 6 hours. Each alert carries
 * an idempotency key made of the problem and the 6-hour window it happened
 * in, and Resend skips any send whose key it saw in the last 24 hours.
 *
 * Never throws: a failing alert must not take the request down with it.
 */
import { createHash } from "node:crypto";
import { sendEmail, shell } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { STUDIO_TZ } from "@/lib/booking/tz";

const FALLBACK_TO = "support@diamond9athletics.com";
const WINDOW_MS = 6 * 60 * 60 * 1000;
const LOGS_URL = "https://vercel.com/wes-gafford-s-projects/diamond9-athletics/logs";

export type Alert = {
  /** Where it happened, e.g. "Stripe webhook" or "GET /book/schedule". */
  where: string;
  /** What went wrong, in plain words. Also the email's subject. */
  what: string;
  /** What it means for customers, and what to do about it. */
  impact?: string;
  error?: unknown;
  /** Facts worth having when fixing it (ids, routes). */
  details?: Record<string, string | number | boolean | null | undefined>;
  /** Groups alerts for the once-per-6-hours limit. Defaults to where + what
   *  + the error message with ids and numbers taken out. */
  fingerprint?: string;
};

export function errorMessage(error: unknown): string {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return String(error);
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 24);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The same failure on different records should count as one problem. */
function normalize(message: string): string {
  return message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>")
    .replace(/\b(cs|pi|ch|in|sub|cus|evt|re)_[A-Za-z0-9]+/g, "<stripe-id>")
    .replace(/\d+/g, "#")
    .slice(0, 300);
}

async function recipients(): Promise<string[]> {
  try {
    const { data } = await createAdminClient().from("profiles").select("email").eq("is_admin", true);
    const to = [...new Set((data ?? []).map((a) => a.email).filter(Boolean))];
    return to.length > 0 ? to : [FALLBACK_TO];
  } catch {
    return [FALLBACK_TO];
  }
}

export async function alertOwner(alert: Alert): Promise<void> {
  try {
    const message = errorMessage(alert.error);
    console.error(`[alert] ${alert.where}: ${alert.what}`, alert.error ?? "", alert.details ?? "");
    if (!process.env.RESEND_API_KEY) return;

    const fingerprint = hash(alert.fingerprint ?? `${alert.where}|${alert.what}|${normalize(message)}`);
    const window = Math.floor(Date.now() / WINDOW_MS);
    const when = new Date().toLocaleString("en-US", {
      timeZone: STUDIO_TZ,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const row = (label: string, value: string) =>
      `<tr><td style="padding:4px 0;color:#71717a;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">${label}</td></tr>
       <tr><td style="padding:0 0 12px 0;color:#fff;font-size:14px;line-height:1.5;">${value}</td></tr>`;
    const details = Object.entries(alert.details ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${esc(k)}: ${esc(String(v))}`)
      .join("<br>");

    const html = shell({
      title: "Something on the site broke",
      body: `
        <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#fff;">Something on the site broke</h1>
        <p style="margin:0 0 18px 0;color:#a1a1aa;font-size:14px;">${esc(when)} Central</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;">
          ${row("What happened", esc(alert.what))}
          ${alert.impact ? row("What it means", esc(alert.impact)) : ""}
          ${row("Where", esc(alert.where))}
          ${message ? row("Error", `<code style="font-size:12px;color:#fca5a5;word-break:break-word;">${esc(message.slice(0, 600))}</code>`) : ""}
          ${details ? row("Details", `<span style="font-size:12px;color:#d4d4d8;">${details}</span>`) : ""}
        </table>
        <p style="margin:18px 0 0 0;color:#a1a1aa;font-size:13px;line-height:1.6;">
          To get it fixed, paste this email into Claude. The full error is in the
          <a href="${LOGS_URL}" style="color:#b07adf;">Vercel logs</a>.
          You'll get at most one email about this every 6 hours.
        </p>`,
    });

    // ALERT_EMAIL sends them somewhere else instead (testing).
    const to_ = process.env.ALERT_EMAIL ? [process.env.ALERT_EMAIL] : await recipients();
    for (const to of to_) {
      try {
        await sendEmail({
          to,
          subject: `Site problem: ${alert.what}`.slice(0, 150),
          html,
          idempotencyKey: `alert-${fingerprint}-${window}-${hash(to).slice(0, 8)}`,
        });
      } catch {
        // Already sent this window (Resend refuses the repeat key), or
        // Resend itself is down. Either way, nothing more to do here.
      }
    }
  } catch (e) {
    console.error("Couldn't send the alert:", e);
  }
}
