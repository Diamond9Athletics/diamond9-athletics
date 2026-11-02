/**
 * Google bounces here after the trainer approves our scopes.
 * Exchange the code for tokens, save them, put their already-booked
 * upcoming sessions on the calendar, and send them back to My Schedule.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { describeTokenError, exchangeCodeForTokens } from "@/lib/google/oauth";
import { listCalendars } from "@/lib/google/calendar";
import { syncUpcomingBookings } from "@/lib/google/sync";

function errorRedirect(request: NextRequest, msg: string) {
  return NextResponse.redirect(
    new URL(`/book/trainer?google_error=${encodeURIComponent(msg)}`, request.url),
  );
}

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
    return errorRedirect(
      request,
      errorParam === "access_denied"
        ? "Google access wasn't granted. If you didn't cancel, publish the app in Google Cloud (Google Auth Platform → Audience) and try again"
        : `Google said: ${errorParam}`,
    );
  }
  if (!code) {
    return errorRedirect(request, "Google didn't send a sign-in code — try connecting again");
  }

  // Re-verify the signed-in user matches the state.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== stateParam) {
    return NextResponse.redirect(new URL("/book/login", request.url));
  }

  const redirectUri = redirectUriFromRequest(request);
  let tokens;
  try {
    tokens = await exchangeCodeForTokens({ code, redirectUri });
  } catch (e) {
    console.error("Google token exchange failed:", e);
    return errorRedirect(request, describeTokenError(e, redirectUri));
  }
  // Without a refresh token the connection would die within the hour.
  if (!tokens.refresh_token) {
    return errorRedirect(
      request,
      "Google didn't hand over a long-term key — remove Diamond Nine at myaccount.google.com/permissions, then connect again",
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
  const { error: saveError } = await admin
    .from("trainer_google_oauth")
    .upsert(
      {
        trainer_id: user.id,
        calendar_id: calendarId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        connected_at: new Date().toISOString(),
      },
      { onConflict: "trainer_id" },
    );
  if (saveError) {
    console.error("Saving Google connection failed:", saveError);
    return errorRedirect(request, `Couldn't save the connection: ${saveError.message}`);
  }

  let synced = 0;
  try {
    synced = await syncUpcomingBookings(user.id);
  } catch (e) {
    console.error("Catch-up calendar sync failed:", e);
  }

  return NextResponse.redirect(
    new URL(`/book/trainer?google_connected=1&synced=${synced}`, request.url),
  );
}
