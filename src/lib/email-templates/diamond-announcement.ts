/**
 * The September 1st Diamond membership announcement email.
 *
 * The copy is locked — Wes signed off on this version. Change with care.
 */
import { shell } from "@/lib/email";

export const ANNOUNCEMENT_SUBJECT = "Big change coming — the new Diamond Plan";

const SIGNUP_URL = "https://diamond9athletics.com/book/signup?next=/book/subscribe";

export function renderDiamondAnnouncement(): string {
  const body = `
    <h1 style="margin:0 0 12px 0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.01em;line-height:1.15;">
      A big change to the Diamond Plan.
    </h1>
    <p style="margin:0 0 20px 0;color:#a1a1aa;font-size:14px;line-height:1.6;">
      Quick update from Wes at Diamond Nine.
    </p>

    <p style="margin:0 0 18px 0;color:#e4e4e7;font-size:14px;line-height:1.6;">
      <strong style="color:#fff;">We just moved into our own space.</strong> New equipment,
      better setup, way more consistent availability — but it also means real overhead
      I have to cover. That's a big reason for the change I'm about to walk you through:
      moving away from the old plan and into real programming for the guys who actually train.
    </p>

    <div style="background:rgba(153,84,210,0.08);border:1px solid rgba(153,84,210,0.22);border-radius:12px;padding:18px 20px;margin:0 0 22px 0;">
      <p style="margin:0 0 6px 0;color:#b07adf;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Starting September 1</p>
      <p style="margin:0 0 4px 0;color:#fff;font-size:20px;font-weight:800;">The Diamond Plan is going monthly.</p>
      <p style="margin:0;color:#a1a1aa;font-size:14px;">$350/month · cancel anytime</p>
    </div>

    <p style="margin:0 0 10px 0;color:#fff;font-size:14px;font-weight:700;">Here's what's in it:</p>
    <ul style="margin:0 0 22px 20px;padding:0;color:#e4e4e7;font-size:14px;line-height:1.7;">
      <li><strong style="color:#fff;">Unlimited sessions per month</strong> — come in whenever the schedule is open</li>
      <li>Your own throwing plan, plyo plan, mobility + arm care programming, built around your data</li>
      <li>Rapsodo tracking every session, saved to your D9 profile</li>
      <li>Unlimited video review + recruiting content on request</li>
      <li>Full access to the D9 app with all your data</li>
    </ul>

    <p style="margin:0 0 8px 0;color:#fff;font-size:15px;font-weight:700;">Why this is actually a better deal.</p>
    <p style="margin:0 0 14px 0;color:#e4e4e7;font-size:14px;line-height:1.6;">
      Under the old Diamond plan, you're paying $300 for 4 bullpens with me — that was it.
      Whatever you did between those bullpens (high-intent throwing, plyo work, pulldowns,
      med ball) you were on your own for.
    </p>
    <p style="margin:0 0 14px 0;color:#e4e4e7;font-size:14px;line-height:1.6;">
      The new Diamond Plan is <strong style="color:#fff;">only $50 more per month</strong>
      and it gets you <strong style="color:#fff;">unlimited coached sessions</strong> —
      bullpens, high-intent throwing days, plyo ball, pulldowns, med ball. All of it, with me there.
    </p>
    <p style="margin:0 0 22px 0;color:#e4e4e7;font-size:14px;line-height:1.6;">
      And that matters. Your high-intent throwing days are the ones where technique breaks down,
      arm fatigue compounds, and small mistakes turn into injuries. Those are exactly the
      sessions I want to be there for — coaching you through your intent, watching your
      mechanics, making adjustments on the fly. Not the ones you should be gutting out alone.
    </p>

    <p style="margin:0 0 8px 0;color:#fff;font-size:15px;font-weight:700;">How scheduling works going forward.</p>
    <p style="margin:0 0 14px 0;color:#e4e4e7;font-size:14px;line-height:1.6;">
      Everything moves online. <strong style="color:#fff;">You'll need to create an account
      on the D9 website</strong> — all scheduling goes through there now. Head to
      <a href="${SIGNUP_URL}" style="color:#b07adf;text-decoration:underline;">${SIGNUP_URL}</a>
      to make one. Once you're subscribed, log in anytime you want to come train and grab
      an open time slot on the calendar. If a slot is open, it's yours.
    </p>
    <p style="margin:0 0 22px 0;color:#a1a1aa;font-size:13px;line-height:1.6;background:rgba(255,255,255,0.03);border-left:2px solid rgba(153,84,210,0.35);padding:10px 14px;border-radius:4px;">
      <strong style="color:#e4e4e7;">Heads up:</strong> the website has changed since you last used it.
      If your old login isn't working or it won't let you sign up, just create a fresh account —
      takes 30 seconds and gets you sorted.
    </p>

    <p style="margin:0 0 8px 0;color:#fff;font-size:15px;font-weight:700;">Why the change from the old plan.</p>
    <p style="margin:0 0 22px 0;color:#e4e4e7;font-size:14px;line-height:1.6;">
      The old plan bullpens were fine, but they don't build athletes. A real weekly rhythm —
      bullpens for command, in-between days for arm strength and output — is what actually
      adds mph and keeps arms healthy. This membership lets me build every guy a plan tuned
      to their exact data, then coach them through it every week.
    </p>

    <p style="margin:0 0 14px 0;color:#a1a1aa;font-size:13px;line-height:1.6;">
      <strong style="color:#e4e4e7;">If you already bought the old Diamond plan:</strong>
      nothing changes for you. Your remaining credits don't expire — use them whenever.
      When they're gone, you can move to the monthly plan or keep buying Gold and Single sessions.
    </p>
    <p style="margin:0 0 26px 0;color:#a1a1aa;font-size:13px;line-height:1.6;">
      <strong style="color:#e4e4e7;">Not ready for monthly?</strong> Gold (3 sessions, $285)
      and Single ($125) are still there. Training plans, plyo work, and full D9 app access
      are Diamond-only going forward.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px 0;">
      <tr>
        <td align="center">
          <a href="${SIGNUP_URL}" style="display:inline-block;background:linear-gradient(135deg,#9954d2,#7a40b0);color:#fff;text-decoration:none;padding:14px 32px;border-radius:999px;font-size:13px;font-weight:800;letter-spacing:0.15em;">
            CREATE ACCOUNT &amp; SUBSCRIBE →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 6px 0;color:#a1a1aa;font-size:13px;line-height:1.6;">
      Reply to this email with any questions.
    </p>
    <p style="margin:0;color:#e4e4e7;font-size:14px;">
      — Wes<br>
      <span style="color:#71717a;font-size:12px;">Diamond Nine Athletics</span>
    </p>
  `;

  return shell({ title: ANNOUNCEMENT_SUBJECT, body });
}
