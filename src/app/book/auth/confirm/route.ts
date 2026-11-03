/**
 * Email-link callback.
 * Our sign-in and password-reset emails (see lib/auth/sign-in-link) send
 * people here. We verify the token on the server and set the session
 * cookie, then redirect — so the link works in any browser or device.
 */
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only allow internal paths so ?next= can't be used as an open redirect.
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/book/dashboard";
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Expired or already-used reset link: straight to asking for a fresh one.
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/book/forgot-password?expired=1", request.url));
  }
  return NextResponse.redirect(new URL("/book/login?error=confirm_failed", request.url));
}
