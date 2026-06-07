/**
 * Kicks off Google OAuth.  Trainers hit this endpoint, we redirect
 * them to Google with a signed state, Google bounces back to /callback.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildAuthUrl } from "@/lib/google/oauth";

export const dynamic = "force-dynamic";

function redirectUriFromRequest(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000";
  return `${proto}://${host}/api/google/callback`;
}

function errorRedirect(request: NextRequest, msg: string) {
  return NextResponse.redirect(
    new URL(
      `/book/trainer?google_error=${encodeURIComponent(msg)}`,
      request.url,
    ),
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.redirect(new URL("/book/login", request.url));
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_trainer")
      .eq("id", user.id)
      .single();
    if (profileError) {
      return errorRedirect(request, `profile: ${profileError.message}`);
    }
    if (!profile?.is_trainer) {
      return errorRedirect(request, "not_a_trainer");
    }

    if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
      return errorRedirect(request, "GOOGLE_OAUTH_CLIENT_ID missing");
    }
    if (!process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
      return errorRedirect(request, "GOOGLE_OAUTH_CLIENT_SECRET missing");
    }

    const url = buildAuthUrl({
      redirectUri: redirectUriFromRequest(request),
      state: user.id,
    });
    return NextResponse.redirect(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return errorRedirect(request, msg);
  }
}
