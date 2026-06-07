import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const { slug } = await request.json();

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Missing package slug" }, { status: 400 });
  }

  // Verify the user is logged in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Look up the package and Stripe price.
  const admin = createAdminClient();
  const { data: pkg, error } = await admin
    .from("packages")
    .select("id, name, stripe_price_id, kind, credits, expiry_days, service_id")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  if (!pkg.stripe_price_id) {
    return NextResponse.json(
      { error: "Package is not yet wired to Stripe. Re-run the setup script." },
      { status: 500 },
    );
  }

  // Record a pending purchase up front so we have a row to update on
  // webhook receipt — survives even if the user closes the tab.
  const { data: purchase, error: purchaseError } = await admin
    .from("purchases")
    .insert({
      user_id: user.id,
      package_id: pkg.id,
      amount_cents: 0, // updated by webhook
      status: "pending",
    })
    .select("id")
    .single();

  if (purchaseError) {
    return NextResponse.json(
      { error: `Could not create purchase: ${purchaseError.message}` },
      { status: 500 },
    );
  }

  const origin =
    request.headers.get("origin") ?? request.nextUrl.origin ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
    success_url: `${origin}/book/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/book/packages`,
    customer_email: user.email,
    client_reference_id: purchase.id,
    metadata: {
      purchase_id: purchase.id,
      package_id: pkg.id,
      user_id: user.id,
      package_kind: pkg.kind,
      package_credits: String(pkg.credits),
      package_expiry_days: String(pkg.expiry_days),
      service_id: pkg.service_id,
    },
  });

  // Save the Stripe session id on the purchase row.
  await admin
    .from("purchases")
    .update({ stripe_checkout_id: session.id })
    .eq("id", purchase.id);

  return NextResponse.json({ url: session.url });
}
