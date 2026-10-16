/**
 * Reverse a scheduled cancellation. If the user previously hit CANCEL
 * and their membership is winding down at period end, this flips it
 * back to auto-renew. Only works while the sub is still active (hasn't
 * hit the end-of-period yet).
 *
 * POST /api/stripe/resume-subscription  →  { ok }
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
      if (!sub.cancel_at_period_end) {
        return NextResponse.json({ ok: true, alreadyActive: true });
      }
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: false,
      });
      return NextResponse.json({ ok: true, alreadyActive: false });
    }
  }

  return NextResponse.json(
    { error: "No Diamond membership found on this account." },
    { status: 404 },
  );
}
