/**
 * Save a new password from a reset link (lib/auth/sign-in-link resetLink).
 *
 * POST { tokenHash, password }
 *
 * The link's one-time token is checked here, when the person saves their
 * new password — so opening or previewing the link never uses it up. On
 * success they're signed in (session cookie) with the new password set.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MIN_LENGTH = 8;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) ?? {};
  const tokenHash = typeof body.tokenHash === "string" ? body.tokenHash : "";
  const password = typeof body.password === "string" ? body.password : "";

  // Check the password before spending the token on it.
  if (password.length < MIN_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error: tokenErr } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
  if (tokenErr) {
    return NextResponse.json(
      { error: "This reset link has expired or was already used.", expired: true },
      { status: 400 },
    );
  }

  // The token is spent and they're signed in now, so if the password itself
  // is turned down they can fix it and try again without a new link.
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.json({ error: error.message, signedIn: true }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
