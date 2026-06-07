/**
 * Google bounces here after the trainer approves our scopes.
 * Exchange the code for tokens, save them, and send the trainer to
 * the calendar-picker page.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeCodeForTokens } from "@/lib/google/oauth";
import { listCalendars } from "@/lib/google/calendar";

function redirectUriFromRequest(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000";
  return `${proto}://${host}/api/google/callback`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/book-v2/trainer?google_error=${encodeURIComponent(errorParam)}`, request.url),
    );
  }
  if (!code) {
    return NextResponse.redirect(
      new URL("/book-v2/trainer?google_error=no_code", request.url),
    );
  }

  // Re-verify the signed-in user matches the state.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== stateParam) {
    return NextResponse.redirect(new URL("/book-v2/login", request.url));
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens({
      code,
      redirectUri: redirectUriFromRequest(request),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(
      new URL("/book-v2/trainer?google_error=exchange_failed", request.url),
    );
  }

  // Default to the trainer's primary calendar (first one or the one
  // flagged `primary`).  They can change it from a picker if they want.
  let calendarId = "primary";
  try {
    const cals = await listCalendars(tokens.access_token);
    const primary = cals.find((c) => c.primary) ?? cals[0];
    if (primary) calendarId = primary.id;
  } catch (e) {
    console.error("listCalendars failed", e);
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const admin = createAdminClient();
  await admin
    .from("trainer_google_oauth")
    .upsert(
      {
        trainer_id: user.id,
        calendar_id: calendarId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
      },
      { onConflict: "trainer_id" },
    );

  return NextResponse.redirect(
    new URL("/book-v2/trainer?google_connected=1", request.url),
  );
}
