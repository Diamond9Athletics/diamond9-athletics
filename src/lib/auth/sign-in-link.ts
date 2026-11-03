/**
 * One-click links that sign someone in from any browser or device.
 *
 * Supabase's default reset link only works in the browser that asked
 * for it (PKCE), and its admin links put tokens in the URL hash, which
 * our PKCE browser client rejects. Instead we send people through our
 * own /book/auth/confirm route: it verifies the token on the server and
 * sets the session cookie, so the link works on another device and
 * inside the Gmail/Outlook apps too.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { shell } from "@/lib/email";

/** Returns null when there's no account for that email. */
export async function signInLink(
  admin: SupabaseClient,
  email: string,
  origin: string,
  next: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return null;
  const q = new URLSearchParams({ token_hash: tokenHash, type: "recovery", next });
  return `${origin}/book/auth/confirm?${q}`;
}

/** The password-reset email — used by "Forgot password?" and the admin panel. */
export function passwordResetEmail(link: string): { subject: string; html: string } {
  const href = link.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return {
    subject: "Reset your Diamond Nine Athletics password",
    html: shell({
      title: "Password reset",
      body: `
        <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#fff;">Reset your password</h1>
        <p style="margin:0 0 14px 0;color:#a1a1aa;font-size:14px;">Tap the button to choose a new password. It works on any phone or computer and expires in 1 hour.</p>
        <p style="margin:0 0 12px 0;">
          <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#9954d2,#7a40b0);color:#000;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:800;letter-spacing:0.1em;font-size:12px;">SET A NEW PASSWORD</a>
        </p>
        <p style="margin:0;color:#71717a;font-size:12px;">If you didn't ask for this, ignore this email — your password stays the same.</p>
      `,
    }),
  };
}
