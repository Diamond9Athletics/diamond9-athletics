/**
 * Diamond memberships, read live from Stripe — no cache, no DB row needed.
 *
 * A subscription entitles service while it's "active" or "trialing";
 * "past_due", "unpaid", "canceled", and "incomplete" don't.
 *
 * Each membership covers one athlete, named in the subscription's
 * metadata.athlete_id: PRIMARY for the account holder, or a sibling's
 * athletes row id. Memberships bought before family accounts have no
 * athlete_id and cover the account holder.
 */
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { PRIMARY } from "@/lib/booking/athletes";

const ENTITLED_STATUSES: ReadonlySet<string> = new Set(["active", "trialing"]);

// Diamond pitching membership price id.
export const DIAMOND_PITCHING_PRICE_ID = "price_1U6yWTJfv99kFBEX1QHJyWKU";

export type Membership = {
  subscriptionId: string;
  /** Who it covers: PRIMARY (the account holder) or an athletes row id. */
  athleteKey: string;
  cancelAtPeriodEnd: boolean;
  /** YYYY-MM-DD the paid period ends. */
  currentPeriodEnd: string | null;
};

function coveredAthlete(sub: Stripe.Subscription): string {
  return sub.metadata?.athlete_id || PRIMARY;
}

/** Every entitled Diamond membership billed to this email. */
export async function diamondMemberships(
  email: string,
  priceId: string = DIAMOND_PITCHING_PRICE_ID,
): Promise<Membership[]> {
  if (!email) return [];

  // Stripe indexes customers by email; a single email can have multiple
  // customer rows if Wes ever manually created invoices. Check them all.
  const customers = await stripe.customers.list({ email, limit: 10 });
  const memberships: Membership[] = [];
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 20,
    });
    for (const sub of subs.data) {
      if (!ENTITLED_STATUSES.has(sub.status)) continue;
      if (!sub.items.data.some((item) => item.price.id === priceId)) continue;
      const end = sub.items.data[0]?.current_period_end;
      memberships.push({
        subscriptionId: sub.id,
        athleteKey: coveredAthlete(sub),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        currentPeriodEnd: end ? new Date(end * 1000).toISOString().slice(0, 10) : null,
      });
    }
  }
  return memberships;
}

/**
 * One-shot batch for list views: every entitled membership for a price,
 * as lower-cased customer email → the athletes it covers. Auto-paginates.
 */
export async function activeMemberships(
  priceId: string,
): Promise<Map<string, Set<string>>> {
  const byEmail = new Map<string, Set<string>>();
  for (const status of ["active", "trialing"] as const) {
    for await (const sub of stripe.subscriptions.list({
      price: priceId,
      status,
      limit: 100,
      expand: ["data.customer"],
    })) {
      const c = sub.customer;
      if (typeof c === "string") continue;
      if ("deleted" in c && c.deleted) continue;
      const email = (c.email ?? "").trim().toLowerCase();
      if (!email) continue;
      const covered = byEmail.get(email) ?? new Set<string>();
      covered.add(coveredAthlete(sub));
      byEmail.set(email, covered);
    }
  }
  return byEmail;
}

/** Lower-cased emails with at least one entitled membership. */
export async function activeSubscriberEmails(priceId: string): Promise<Set<string>> {
  return new Set((await activeMemberships(priceId)).keys());
}
