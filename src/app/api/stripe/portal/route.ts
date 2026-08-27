/**
 * Open a Stripe Customer Portal session for the signed-in user.
 *
 * Looks up the Stripe customer by the signed-in user's email (since we
 * don't yet store a stripe_customer_id on profiles) and returns a URL
 * that lets them manage or cancel their subscription, update their
 * card, and view invoices — Stripe handles the entire UI.
 *
 * The portal must be configured in the Stripe dashboard first:
 * Dashboard → Settings → Billing → Customer portal → Activate.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Find their Stripe customer. Checkout in subscription mode always
  // creates a Customer keyed off the email we passed, so we can look it
  // back up by that same email.
  const found = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = found.data[0];
  if (!customer) {
    return NextResponse.json(
      { error: "No Stripe subscription found for this account." },
      { status: 404 },
    );
  }

  const origin =
    request.headers.get("origin") ?? request.nextUrl.origin ?? "http://localhost:3000";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/book/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = (e as Error).message ?? "Could not open the portal.";
    // The typical failure here is "No configuration provided" — Wes
    // hasn't activated the portal in the Stripe dashboard yet.
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
