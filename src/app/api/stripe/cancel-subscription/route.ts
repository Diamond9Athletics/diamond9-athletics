/**
 * Cancel the signed-in athlete's active Diamond pitching subscription
 * at the end of the current billing period. They keep access through
 * the paid-through date, then nothing renews. Idempotent — if the sub
 * is already set to cancel at period end, we just return the current
 * cancel date.
 *
 * POST /api/stripe/cancel-subscription  →  { ok, cancelsOn (YYYY-MM-DD) }
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { DIAMOND_PITCHING_PRICE_ID } from "@/lib/stripe/subscription";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Pull every Stripe customer tied to this email (we don't persist
  // stripe_customer_id yet) and scan their subscriptions for the
  // Diamond price. First active one wins.
  const customers = await stripe.customers.list({
    email: user.email,
    limit: 10,
  });
  if (customers.data.length === 0) {
    return NextResponse.json(
      { error: "No Stripe account found for this email." },
      { status: 404 },
    );
  }

  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 20,
    });
    for (const sub of subs.data) {
      if (sub.status !== "active" && sub.status !== "trialing") continue;
      const hasDiamond = sub.items.data.some(
        (i) => i.price.id === DIAMOND_PITCHING_PRICE_ID,
      );
      if (!hasDiamond) continue;

      // Already set to cancel? Just report the date.
      if (sub.cancel_at_period_end) {
        return NextResponse.json({
          ok: true,
          alreadyScheduled: true,
          cancelsOn: new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000)
            .toISOString()
            .slice(0, 10),
        });
      }

      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: true,
      });
      // Setting cancel_at_period_end doesn't move the period end — the
      // already-read value is the same date we'll keep access until.
      return NextResponse.json({
        ok: true,
        alreadyScheduled: false,
        cancelsOn: new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000)
          .toISOString()
          .slice(0, 10),
      });
    }
  }

  return NextResponse.json(
    { error: "No active Diamond membership found on this account." },
    { status: 404 },
  );
}
