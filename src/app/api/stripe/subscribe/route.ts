import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import {
  DIAMOND_PITCHING_PRICE_ID,
  diamondMemberships,
} from "@/lib/stripe/subscription";
import { bookingAthlete, keyOf } from "@/lib/booking/athletes";

/**
 * POST /api/stripe/subscribe  { athleteKey? }
 * Creates a Stripe Checkout Session in subscription mode for the signed-in
 * user and returns the redirect URL. A membership covers one athlete:
 * the account holder ("primary", the default) or a brother or sister on
 * the account, named in the subscription's metadata.athlete_id.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) ?? {};
  const athlete = await bookingAthlete(createAdminClient(), user.id, body.athleteKey);
  if (!athlete) {
    return NextResponse.json(
      { error: "We couldn't find that athlete on your account." },
      { status: 404 },
    );
  }
  const athleteKey = keyOf(athlete.id);
  if (user.email) {
    const memberships = await diamondMemberships(user.email).catch(() => []);
    if (memberships.some((m) => m.athleteKey === athleteKey)) {
      return NextResponse.json(
        {
          error: `${athlete.firstName ?? "This athlete"} already has a Diamond membership — manage it from your dashboard.`,
        },
        { status: 409 },
      );
    }
  }

  const origin =
    request.headers.get("origin") ??
    request.nextUrl.origin ??
    "https://diamond9athletics.com";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: DIAMOND_PITCHING_PRICE_ID, quantity: 1 }],
    success_url: `${origin}/book/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pitching-plans`,
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      athlete_id: athleteKey,
      plan: "pitching-diamond-membership",
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        athlete_id: athleteKey,
        plan: "pitching-diamond-membership",
      },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
