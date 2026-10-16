/**
 * Return the signed-in athlete's Diamond pitching subscription state.
 * Lets the dashboard render the right CTA (CANCEL vs. RESUME) and show
 * the paid-through date when they've already scheduled a cancellation.
 *
 * GET /api/stripe/subscription-status
 *   → { active: boolean, cancelAtPeriodEnd: boolean,
 *       currentPeriodEnd: "YYYY-MM-DD" | null }
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { DIAMOND_PITCHING_PRICE_ID } from "@/lib/stripe/subscription";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const customers = await stripe.customers.list({
    email: user.email,
    limit: 10,
  });
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
      return NextResponse.json({
        active: true,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodEnd: new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000)
          .toISOString()
          .slice(0, 10),
      });
    }
  }
  return NextResponse.json({
    active: false,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
  });
}
