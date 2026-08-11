import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPurchaseReceipt } from "@/lib/booking/emails";
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
  } else if (
    event.type === "charge.refunded" ||
    event.type === "refund.created"
  ) {
    await handleRefund(event.data.object as Stripe.Charge | Stripe.Refund);
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
    // (Stripe can re-deliver the same event), do nothing further.
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

  // Receipt email (athlete) + heads-up to relevant trainers.
  // Idempotent-ish: the credit-bucket check above short-circuits
  // duplicate deliveries before we get here, so we only email once.
  try {
    const [{ data: athlete }, { data: pkg }] = await Promise.all([
      admin
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", userId)
        .single(),
      admin
        .from("packages")
        .select("name, service:services(category)")
        .eq("id", packageId)
        .single(),
    ]);

    if (!athlete || !pkg) return;

    const svc = Array.isArray(pkg.service) ? pkg.service[0] : pkg.service;
    const category = svc?.category as "pitching" | "hitting" | undefined;

    // Send receipt to matching trainers for the package's category.
    // For enrollment packages with an unknown category, notify all trainers.
    let trainerQuery = admin
      .from("profiles")
      .select("email, trainer_categories")
      .eq("is_trainer", true);
    if (category) {
      trainerQuery = trainerQuery.contains("trainer_categories", [category]);
    }
    const { data: trainers } = await trainerQuery;
    const trainerEmails = (trainers ?? []).map((t) => t.email).filter(Boolean);

    await sendPurchaseReceipt(
      {
        athleteFirstName: athlete.first_name,
        athleteLastName: athlete.last_name,
        athleteEmail: athlete.email,
        packageName: pkg.name,
        amountCents: session.amount_total ?? 0,
        credits: packageCredits,
        isEnrollment: packageKind === "enrollment",
        purchaseId,
      },
      trainerEmails,
    );
  } catch (e) {
    console.error("Failed to send purchase receipt:", e);
  }
}

/**
 * When a Stripe refund is issued (via the dashboard or API), zero out
 * the corresponding credit_bucket so the athlete can't keep using
 * credits they no longer paid for. Bookings against those credits are
 * left alone — Wes can cancel them manually from the admin panel if
 * the refund was for a truly bad experience.
 */
async function handleRefund(object: Stripe.Charge | Stripe.Refund) {
  const admin = createAdminClient();

  // Both event shapes give us a payment_intent to find the purchase.
  const paymentIntent =
    typeof (object as Stripe.Refund).payment_intent === "string"
      ? ((object as Stripe.Refund).payment_intent as string)
      : typeof (object as Stripe.Charge).payment_intent === "string"
        ? ((object as Stripe.Charge).payment_intent as string)
        : null;

  if (!paymentIntent) {
    console.error("Refund event without payment_intent");
    return;
  }

  const { data: purchase, error } = await admin
    .from("purchases")
    .select("id, user_id, package_id, status")
    .eq("stripe_payment_intent_id", paymentIntent)
    .maybeSingle();

  if (error || !purchase) {
    console.error("Refund: could not find purchase for PI", paymentIntent);
    return;
  }

  // Mark the purchase refunded (idempotent).
  await admin
    .from("purchases")
    .update({ status: "refunded" })
    .eq("id", purchase.id);

  // Zero out any credit bucket that came from this purchase.
  await admin
    .from("credit_buckets")
    .update({ credits_remaining: 0 })
    .eq("purchase_id", purchase.id);

  console.log(
    `Refund processed for purchase ${purchase.id} (user ${purchase.user_id})`,
  );
}
