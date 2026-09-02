/**
 * Live-check whether a user has an active Stripe subscription for a
 * given price id. Source-of-truth lookup — no cache, no DB row needed.
 *
 * Returns true if any subscription for the price is in a state that
 * currently entitles the athlete to service: "active" or "trialing".
 * "past_due", "unpaid", "canceled", and "incomplete" all return false.
 */
import { stripe } from "@/lib/stripe";

const ENTITLED_STATUSES: ReadonlySet<string> = new Set(["active", "trialing"]);

// Diamond pitching membership price id.
export const DIAMOND_PITCHING_PRICE_ID = "price_1U6yWTJfv99kFBEX1QHJyWKU";

export async function hasActiveSubscription(
  email: string,
  priceId: string,
): Promise<boolean> {
  if (!email) return false;

  // Stripe indexes customers by email; a single email can have multiple
  // customer rows if Wes ever manually created invoices. Check them all.
  const customers = await stripe.customers.list({ email, limit: 10 });
  if (customers.data.length === 0) return false;

  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 20,
    });
    for (const sub of subs.data) {
      if (!ENTITLED_STATUSES.has(sub.status)) continue;
      const hasPrice = sub.items.data.some(
        (item) => item.price.id === priceId,
      );
      if (hasPrice) return true;
    }
  }
  return false;
}
