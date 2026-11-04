/**
 * Turn check-in emails off or back on, from the link in each one.
 * POST (form) { u: userId, t: signed token, off: "1" | "0" }
 * Booking confirmations, reminders and receipts aren't affected.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validPreferencesToken } from "@/lib/checkins";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const u = String(form.get("u") ?? "");
  const t = String(form.get("t") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(u) || !validPreferencesToken(u, t)) {
    return NextResponse.json({ error: "That link isn't valid." }, { status: 400 });
  }

  const { error } = await createAdminClient().auth.admin.updateUserById(u, {
    app_metadata: { checkins_off: form.get("off") === "1" },
  });
  if (error) {
    console.error("Check-in preference save failed:", error);
    return NextResponse.json({ error: "Couldn't save that. Try again." }, { status: 500 });
  }
  const back = new URLSearchParams({ u, t, saved: "1" });
  return NextResponse.redirect(new URL(`/book/email-preferences?${back}`, request.url), 303);
}
