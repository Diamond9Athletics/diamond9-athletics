/**
 * Server-side signup with bot defenses.
 *
 * Replaces direct supabase.auth.signUp from the client so we can:
 *  1. Auto-confirm the athlete (no email-link step, no Supabase rate limit)
 *  2. Run bot checks before creating the account (honeypot, name shape,
 *     form timing, per-IP rate limit)
 *
 * We create the user via admin API with email_confirm=true, then sign
 * them in with the regular client so they walk out with a fresh session
 * cookie.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// ---- Bot heuristics ----------------------------------------------------

/**
 * Bots pick random-looking names like "oNQViQUyKqYbPfblEPdvh".
 * Real names — even unusual surnames like MacDonald, McKay, DeAngelo,
 * O'Brien, Jean-Luc — have at most 2-3 uppercase letters. Bot names
 * routinely have 8+ scattered through the string.
 */
function looksLikeRandomName(s: string): boolean {
  const clean = s.trim();
  if (clean.length < 2 || clean.length > 25) return true;
  // Allow Unicode letters, apostrophes, hyphens, periods, spaces.
  if (!/^\p{L}[\p{L} .'\-]*$/u.test(clean)) return true;
  // Total uppercase count > 3 = bot territory.
  const upperCount = (clean.match(/[A-Z]/g) ?? []).length;
  if (upperCount > 3) return true;
  // Also reject "no vowels" — bots often generate consonant clusters.
  if (!/[aeiouyAEIOUY]/.test(clean)) return true;
  return false;
}

/** Dot-abuse Gmail addresses. */
function looksLikeBotEmail(email: string): boolean {
  const local = email.split("@")[0] ?? "";
  if (local.split(".").length - 1 >= 3) return true;
  return false;
}

// ---- Per-IP rate limit (in-memory) ------------------------------------

const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_MAX = 3; // 3 signups per IP per hour
const attempts = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter(
    (t) => t > now - RATE_WINDOW_MS,
  );
  if (recent.length >= RATE_MAX) return false;
  recent.push(now);
  attempts.set(ip, recent);
  // Best-effort cleanup so the map doesn't grow forever.
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) {
      if (v.every((t) => t < now - RATE_WINDOW_MS)) attempts.delete(k);
    }
  }
  return true;
}

// ---- Route ------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    honey?: string;
    startedAt?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const firstName = (body.firstName ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const honey = body.honey ?? "";
  const startedAt = Number(body.startedAt ?? 0);

  // 1) Honeypot — humans never see the "middle_name" input.
  if (honey.length > 0) {
    return NextResponse.json({ error: "Signup rejected." }, { status: 400 });
  }

  // 2) Form-fill timing — real people take at least a couple seconds.
  const fillMs = Date.now() - startedAt;
  if (!startedAt || fillMs < 2000) {
    return NextResponse.json({ error: "Signup rejected." }, { status: 400 });
  }

  // 3) Basic input validation.
  if (!firstName || !lastName || !email || password.length < 8) {
    return NextResponse.json(
      { error: "All fields required. Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  // 4) Bot-shape checks.
  if (
    looksLikeRandomName(firstName) ||
    looksLikeRandomName(lastName) ||
    looksLikeBotEmail(email)
  ) {
    return NextResponse.json(
      { error: "That name or email didn't pass our check. If you're a real person, please email support@diamond9athletics.com." },
      { status: 400 },
    );
  }

  // 5) Per-IP rate limit.
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many signups from this location. Try again later." },
      { status: 429 },
    );
  }

  // 6) Create the auth user, auto-confirmed.
  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (created.error) {
    // Existing user -> friendly hint.
    const msg = created.error.message ?? "Could not create account.";
    const status =
      /already/i.test(msg) || /exists/i.test(msg) ? 409 : 500;
    return NextResponse.json(
      {
        error:
          status === 409
            ? "An account with that email already exists. Try signing in instead."
            : msg,
      },
      { status },
    );
  }

  // 7) Sign them in so they walk out with a session cookie.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Account was created but sign-in failed — user can log in manually.
    return NextResponse.json({
      ok: true,
      needsSignIn: true,
    });
  }

  return NextResponse.json({ ok: true });
}
