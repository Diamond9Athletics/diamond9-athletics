/**
 * "Forgot password?" — emails a one-click link (through Resend, like the
 * rest of our email) that signs the athlete in and lands on the
 * set-a-new-password page. Works on any device; see lib/auth/sign-in-link.
 *
 * Always answers the same way, so it can't be used to find out which
 * emails have accounts, and sends at most one email a minute per account.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordResetEmail, signInLink } from "@/lib/auth/sign-in-link";
import { sendEmail } from "@/lib/email";

const MIN_GAP_MS = 60_000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter the email you signed up with." }, { status: 400 });
  }

  const admin = createAdminClient();
  // Account emails are stored lowercase (checked), so an exact match is safe.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profile) {
    const { data } = await admin.auth.admin.getUserById(profile.id);
    const user = data?.user;
    const lastSent = Date.parse(String(user?.app_metadata?.recovery_sent_at ?? ""));
    if (user?.email && !(Date.now() - lastSent < MIN_GAP_MS)) {
      const link = await signInLink(admin, user.email, request.nextUrl.origin, "/book/reset-password");
      if (link) {
        await admin.auth.admin.updateUserById(user.id, {
          app_metadata: { recovery_sent_at: new Date().toISOString() },
        });
        try {
          await sendEmail({
            to: user.email,
            ...passwordResetEmail(link),
            replyTo: "support@diamond9athletics.com",
          });
        } catch (e) {
          console.error("Forgot-password email failed:", e);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
