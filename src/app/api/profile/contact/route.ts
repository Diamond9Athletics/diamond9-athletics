/**
 * The signed-in account's phone number and text-reminder choice.
 *
 * Body: { phone, textReminders, source: "booking" | "profile" }
 *    or { dismiss: true }: "Not now" on the booking page's phone
 *       prompt, so it doesn't ask again.
 *
 * The phone goes in profiles. The text choice goes in app_metadata.sms
 * (server-only), stamped with when, where and for which number.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatUsPhone } from "@/lib/phone";
import { readTextConsent, type TextConsent } from "@/lib/text-reminders";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => null)) ?? {};
  const admin = createAdminClient();

  if (body.dismiss === true) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        phonePrompt: { dismissedAt: new Date().toISOString() },
      },
    });
    if (error) {
      console.error("Phone prompt dismiss failed:", error);
      return NextResponse.json({ error: "Couldn't save that. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const source = body.source === "booking" ? "booking" : "profile";
  const raw = typeof body.phone === "string" ? body.phone.trim() : "";
  const phone = raw ? formatUsPhone(raw) : null;
  if (raw && !phone) {
    return NextResponse.json(
      { error: "Please enter a 10-digit U.S. phone number." },
      { status: 400 },
    );
  }
  if (!phone && source === "booking") {
    return NextResponse.json({ error: "Please enter your phone number." }, { status: 400 });
  }
  const textReminders = body.textReminders === true && phone !== null;

  const { error: profileError } = await admin
    .from("profiles")
    .update({ phone })
    .eq("id", user.id);
  if (profileError) {
    console.error("Phone save failed:", profileError);
    return NextResponse.json(
      { error: "Couldn't save your phone number. Please try again." },
      { status: 500 },
    );
  }

  // Only a change gets a new stamp, so the record keeps the original yes.
  const before = readTextConsent(user.app_metadata);
  if (!before || before.reminders !== textReminders || before.phone !== phone) {
    const consent: TextConsent = {
      reminders: textReminders,
      phone,
      at: new Date().toISOString(),
      source,
      ip: (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || undefined,
    };
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, sms: consent },
    });
    if (error) {
      console.error("Text reminder choice save failed:", error);
      return NextResponse.json(
        {
          error:
            "Your phone number was saved, but your text reminder choice wasn't. Please try again.",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, phone, textReminders });
}
