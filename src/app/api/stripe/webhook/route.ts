import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Stripe webhooks must read the raw body to verify the signature.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not set" },
      { status: 500 },
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const admin = createAdminClient();
  const md = session.metadata ?? {};

  const purchaseId = md.purchase_id;
  const userId = md.user_id;
  const packageId = md.package_id;
  const packageKind = md.package_kind;
  const packageCredits = Number(md.package_credits ?? 0);
  const packageExpiryDays = Number(md.package_expiry_days ?? 31);
  const serviceId = md.service_id;

  if (!purchaseId || !userId || !packageId) {
    console.error("Missing metadata on Stripe session", session.id);
    return;
  }

  // Mark the purchase paid.
  const { error: purchaseError } = await admin
    .from("purchases")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      amount_cents: session.amount_total ?? 0,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
    })
    .eq("id", purchaseId);

  if (purchaseError) {
    console.error("Failed to mark purchase paid:", purchaseError);
    return;
  }

  // For credit packages, create a bucket.  For enrollments, skip.
  if (packageKind === "credits" && packageCredits > 0 && serviceId) {
    // Idempotency: if a bucket already exists for this purchase
    // (Stripe can re-deliver the same event), do nothing.
    const { data: existing } = await admin
      .from("credit_buckets")
      .select("id")
      .eq("purchase_id", purchaseId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return;
    }

    const { error: bucketError } = await admin.from("credit_buckets").insert({
      user_id: userId,
      purchase_id: purchaseId,
      service_id: serviceId,
      credits_total: packageCredits,
      credits_remaining: packageCredits,
      expiry_days: packageExpiryDays,
    });

    if (bucketError) {
      console.error("Failed to create credit bucket:", bucketError);
    }
  }
}
