/**
 * Reverse a scheduled cancellation. If the user previously hit CANCEL
 * and a membership is winding down at period end, this flips it back to
 * auto-renew. Only works while the sub is still active (hasn't hit the
 * end-of-period yet).
 *
 * POST /api/stripe/resume-subscription  { subscriptionId? }  →  { ok }
 * Without a subscriptionId it resumes the account's first membership.
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
      { error: "No Diamond membership found on this account." },
      { status: 404 },
    );
  }
  if (!membership.cancelAtPeriodEnd) {
    return NextResponse.json({ ok: true, alreadyActive: true });
  }
  await stripe.subscriptions.update(membership.subscriptionId, {
    cancel_at_period_end: false,
  });
  return NextResponse.json({ ok: true, alreadyActive: false });
}
