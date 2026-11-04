/**
 * Daily check-in emails (lib/checkins): Vercel Cron calls this at ~10am
 * Central. Each account gets at most one note; what went out is logged on
 * the account so cooldowns hold. Until CHECKINS_LIVE is on it sends nothing
 * and just reports how many of each it would send.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { todayInStudio } from "@/lib/booking/coach-calendar";
import {
  DIAMOND_PITCHING_PRICE_ID,
  activeSubscriberEmails,
} from "@/lib/stripe/subscription";
import {
  CHECKINS_LIVE,
  loadCheckinAccounts,
  pickCheckin,
  type CheckinLog,
} from "@/lib/checkins";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Say so plainly
  // when the secret was never set up, so a failing job is easy to spot.
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET isn't set on this deployment." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Without knowing who's a member, a member could get a "come back" note —
  // skip the day instead.
  let members: Set<string>;
  try {
    members = await activeSubscriberEmails(DIAMOND_PITCHING_PRICE_ID);
  } catch (e) {
    console.error("Check-ins: membership lookup failed:", e);
    return NextResponse.json({ error: "Couldn't check memberships." }, { status: 502 });
  }

  const admin = createAdminClient();
  const today = todayInStudio();
  const accounts = await loadCheckinAccounts(admin, members);
  const due = accounts.flatMap((account) => {
    const checkin = pickCheckin(account, today);
    return checkin ? [{ account, checkin }] : [];
  });
  const byKind: Record<string, number> = {};
  for (const { checkin } of due) byKind[checkin.kind] = (byKind[checkin.kind] ?? 0) + 1;

  if (!CHECKINS_LIVE) {
    return NextResponse.json({ ok: true, live: false, wouldSend: byKind });
  }

  let sent = 0;
  let failed = 0;
  for (const { account, checkin } of due) {
    try {
      await sendEmail({
        to: account.email,
        subject: checkin.subject,
        html: checkin.html,
        replyTo: "support@diamond9athletics.com",
      });
      sent++;
      const log: CheckinLog = { ...account.sent, [checkin.kind]: today, last: today };
      const { error } = await admin.auth.admin.updateUserById(account.userId, {
        app_metadata: { checkins: log },
      });
      if (error) console.error(`Check-ins: couldn't log ${checkin.kind} for ${account.userId}:`, error);
    } catch (e) {
      failed++;
      console.error(`Check-ins: ${checkin.kind} to ${account.userId} failed:`, e);
    }
    // Stay well under Resend's rate limit.
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  return NextResponse.json({ ok: true, live: true, sent, failed, byKind });
}
