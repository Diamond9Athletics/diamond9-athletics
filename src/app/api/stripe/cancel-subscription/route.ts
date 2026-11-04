/**
 * Cancel one of the signed-in account's Diamond memberships at the end of
 * the current billing period. They keep access through the paid-through
 * date, then nothing renews. Idempotent — if the sub is already set to
 * cancel at period end, we just return the current cancel date.
 *
 * POST /api/stripe/cancel-subscription  { subscriptionId? }
 *   → { ok, alreadyScheduled, cancelsOn (YYYY-MM-DD) }
 * Without a subscriptionId it cancels the account's first membership.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { diamondMemberships } from "@/lib/stripe/subscription";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Only memberships billed to this account's email can be touched.
  const body = (await request.json().catch(() => null)) ?? {};
  const memberships = await diamondMemberships(user.email);
  const membership = body.subscriptionId
    ? memberships.find((m) => m.subscriptionId === body.subscriptionId)
    : memberships[0];
  if (!membership) {
    return NextResponse.json(
      { error: "No active Diamond membership found on this account." },
      { status: 404 },
    );
  }

  // Already set to cancel? Just report the date.
  if (membership.cancelAtPeriodEnd) {
    return NextResponse.json({
      ok: true,
      alreadyScheduled: true,
      cancelsOn: membership.currentPeriodEnd,
    });
  }

  await stripe.subscriptions.update(membership.subscriptionId, {
    cancel_at_period_end: true,
  });
  // Setting cancel_at_period_end doesn't move the period end — the
  // already-read value is the same date we'll keep access until.
  return NextResponse.json({
    ok: true,
    alreadyScheduled: false,
    cancelsOn: membership.currentPeriodEnd,
  });
}
