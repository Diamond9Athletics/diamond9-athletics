/**
 * Admin blast endpoint for the September 1st Diamond membership announcement.
 *
 * POST body:
 *   { dryRun: true }                      → return recipient count + sample, no send
 *   { dryRun: false, confirm: "SEND FOR REAL" } → actually send
 *
 * Restricted to profiles.is_admin === true. Sends are batched to be gentle
 * on Resend's rate limit.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { renderDiamondAnnouncement, ANNOUNCEMENT_SUBJECT } from "@/lib/email-templates/diamond-announcement";

const BATCH_SIZE = 5;
const BATCH_PAUSE_MS = 400;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const dryRun = body?.dryRun !== false; // default to dry-run for safety

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  if (!dryRun && body?.confirm !== "SEND FOR REAL") {
    return NextResponse.json(
      { error: "Real send requires confirm: 'SEND FOR REAL'." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("profiles")
    .select("id, email, first_name")
    .not("email", "is", null);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // De-dupe by lowercase email in case of stray duplicates.
  const seen = new Set<string>();
  const recipients: { email: string; firstName: string | null }[] = [];
  for (const r of rows ?? []) {
    const em = (r.email ?? "").trim().toLowerCase();
    if (!em || seen.has(em)) continue;
    seen.add(em);
    recipients.push({ email: em, firstName: r.first_name ?? null });
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      count: recipients.length,
      sample: recipients.slice(0, 5).map((r) => r.email),
    });
  }

  // Real send. Batch to keep Resend happy.
  let sent = 0;
  const failures: { email: string; error: string }[] = [];
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (r) => {
        try {
          await sendEmail({
            to: r.email,
            subject: ANNOUNCEMENT_SUBJECT,
            html: renderDiamondAnnouncement(),
            replyTo: "support@diamond9athletics.com",
          });
          sent += 1;
        } catch (e) {
          failures.push({
            email: r.email,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }),
    );
    if (i + BATCH_SIZE < recipients.length) {
      await sleep(BATCH_PAUSE_MS);
    }
  }

  return NextResponse.json({
    dryRun: false,
    sent,
    failed: failures.length,
    failures: failures.slice(0, 20),
  });
}
