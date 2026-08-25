import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

const DIAMOND_PRICE_ID = "price_1U6yWTJfv99kFBEX1QHJyWKU";

/**
 * POST /api/stripe/subscribe
 * Creates a Stripe Checkout Session in subscription mode for the signed-in
 * user and returns the redirect URL.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const origin =
    request.headers.get("origin") ??
    request.nextUrl.origin ??
    "https://diamond9athletics.com";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: DIAMOND_PRICE_ID, quantity: 1 }],
    success_url: `${origin}/book/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pitching-plans`,
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      plan: "pitching-diamond-membership",
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan: "pitching-diamond-membership",
      },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
