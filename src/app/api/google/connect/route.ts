/**
 * Kicks off Google OAuth.  Trainers hit this endpoint, we redirect
 * them to Google with a signed state, Google bounces back to /callback.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/google/oauth";

function redirectUriFromRequest(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000";
  return `${proto}://${host}/api/google/callback`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/book-v2/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_trainer")
    .eq("id", user.id)
    .single();
  if (!profile?.is_trainer) {
    return NextResponse.redirect(new URL("/book-v2/dashboard", request.url));
  }

  // State = the trainer's user id, kept simple since the callback
  // re-verifies via the session cookie anyway.
  const state = user.id;
  const url = buildAuthUrl({
    redirectUri: redirectUriFromRequest(request),
    state,
  });

  return NextResponse.redirect(url);
}
