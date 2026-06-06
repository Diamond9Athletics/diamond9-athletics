/**
 * Email sender — wraps Resend for transactional booking emails.
 * Uses noreply@diamond9athletics.com as the sender (verified domain).
 */
import { Resend } from "resend";

const FROM = "Diamond Nine Athletics <noreply@diamond9athletics.com>";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const r = await client().emails.send({
    from: FROM,
    to,
    subject,
    html,
    replyTo,
  });
  if (r.error) {
    console.error("Resend send failed:", r.error);
    throw new Error(r.error.message);
  }
  return r.data;
}

/**
 * Wrap any body content in a consistent dark-themed email shell that
 * matches the website.  Inline styles only — many email clients ignore
 * external CSS.
 */
export function shell({ title, body }: { title: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#040200;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#040200;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0a0707;border:1px solid rgba(153,84,210,0.15);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;background:linear-gradient(135deg,rgba(153,84,210,0.15),rgba(122,64,176,0.05));border-bottom:1px solid rgba(153,84,210,0.2);">
              <p style="margin:0;font-size:11px;letter-spacing:0.25em;color:#b07adf;font-weight:700;">DIAMOND NINE ATHLETICS</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid rgba(255,255,255,0.05);font-size:11px;color:#71717a;">
              Diamond Nine Athletics · Austin, TX<br>
              Questions? Reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Formats a UTC instant as a wall-clock string in Austin time.
 */
export function fmtCT(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
