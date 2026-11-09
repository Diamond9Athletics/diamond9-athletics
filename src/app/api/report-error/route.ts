/**
 * A page crashed in someone's browser (app/error.tsx sends it here): pass it
 * on to the admins. Anyone can call this, so it only takes same-site posts,
 * trims everything, and sends at most 3 of these alerts every 6 hours.
 */
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { alertOwner } from "@/lib/alerts";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let sameSite = false;
  try {
    sameSite = Boolean(origin && host && new URL(origin).host === host);
  } catch {
    sameSite = false;
  }
  if (!sameSite) return NextResponse.json({ ok: true });

  const body = await request.json().catch(() => null);
  const message = String(body?.message ?? "").trim().slice(0, 300);
  if (!message) return NextResponse.json({ ok: true });
  const page = String(body?.path ?? "").split("?")[0].slice(0, 200);
  const stack = String(body?.stack ?? "").slice(0, 800);

  // Three slots per 6-hour window; the same crash always lands in the same one.
  const slot = parseInt(createHash("sha256").update(message).digest("hex").slice(0, 8), 16) % 3;
  await alertOwner({
    where: `Browser, ${page || "unknown page"}`,
    what: "A page crashed in someone's browser",
    impact: "They saw a “Something went wrong” screen. The error text came from their browser.",
    error: message,
    details: { page, stack },
    fingerprint: `browser-crash-${slot}`,
  });
  return NextResponse.json({ ok: true });
}
