#!/usr/bin/env node
/**
 * Bump the live Stripe price on specific packages.
 *
 * Stripe prices are immutable — you can't edit an existing price's
 * amount. This creates a NEW price on the same product, points the
 * Supabase row at it, and archives the old price so no old checkout
 * link keeps working at the old amount.
 *
 * Dry-run by default. Pass --confirm to actually make changes.
 *
 * Usage:
 *   node scripts/update-package-prices.mjs
 *   node scripts/update-package-prices.mjs --confirm
 */
import { config as loadEnv } from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const CONFIRM = process.argv.includes("--confirm");

// slug → new price in cents. Only pitching gold + single are changing.
const CHANGES = {
  "pitching-gold": 28500,
  "pitching-single": 12500,
};

// Slugs to mark inactive (retired products we now hide in the UI).
const DEACTIVATE_SLUGS = ["pitching-diamond", "pitching-half", "hitting-half"];

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("✗ STRIPE_SECRET_KEY not set (check .env.local)");
  process.exit(1);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("✗ Supabase env vars missing (check .env.local)");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
);

const slugs = [...Object.keys(CHANGES), ...DEACTIVATE_SLUGS];
const { data: packages, error } = await supabase
  .from("packages")
  .select("id, slug, name, price_cents, stripe_price_id, active")
  .in("slug", slugs);
if (error) {
  console.error("✗ Failed to load packages:", error.message);
  process.exit(1);
}

console.log(
  CONFIRM
    ? "🚨 LIVE MODE — changes will be applied.\n"
    : "🔎 Dry run. Add --confirm to apply.\n",
);

for (const pkg of packages) {
  const newCents = CHANGES[pkg.slug];
  const deactivate = DEACTIVATE_SLUGS.includes(pkg.slug);

  if (newCents) {
    if (pkg.price_cents === newCents) {
      console.log(`⤿ ${pkg.slug.padEnd(28)} already at $${(newCents / 100).toFixed(2)} — skipping`);
      continue;
    }

    console.log(
      `→ ${pkg.slug.padEnd(28)} $${(pkg.price_cents / 100).toFixed(2)} → $${(newCents / 100).toFixed(2)}`,
    );

    if (!CONFIRM) continue;

    // Get the product id from the old price so the new price hangs on
    // the same product.
    let oldPrice = null;
    let productId = null;
    if (pkg.stripe_price_id) {
      oldPrice = await stripe.prices.retrieve(pkg.stripe_price_id);
      productId =
        typeof oldPrice.product === "string" ? oldPrice.product : oldPrice.product.id;
    } else {
      console.error(`   ✗ ${pkg.slug} has no stripe_price_id — cannot find product. Skipping.`);
      continue;
    }

    // Create the replacement price. One-time (no `recurring`).
    const newPrice = await stripe.prices.create({
      product: productId,
      unit_amount: newCents,
      currency: "usd",
      nickname: `${pkg.slug} — $${(newCents / 100).toFixed(2)}`,
    });
    console.log(`   ✔ created new price ${newPrice.id}`);

    // Point the DB row at the new price + amount.
    const { error: upErr } = await supabase
      .from("packages")
      .update({
        price_cents: newCents,
        stripe_price_id: newPrice.id,
      })
      .eq("id", pkg.id);
    if (upErr) {
      console.error(`   ✗ DB update failed: ${upErr.message}`);
      continue;
    }
    console.log(`   ✔ updated packages row`);

    // Archive the old price so lingering links stop working.
    if (oldPrice && oldPrice.active) {
      await stripe.prices.update(oldPrice.id, { active: false });
      console.log(`   ✔ archived old price ${oldPrice.id}`);
    }
  }

  if (deactivate) {
    if (!pkg.active) {
      console.log(`⤿ ${pkg.slug.padEnd(28)} already inactive — skipping`);
      continue;
    }
    console.log(`→ ${pkg.slug.padEnd(28)} deactivate (was active)`);
    if (!CONFIRM) continue;
    const { error: upErr } = await supabase
      .from("packages")
      .update({ active: false })
      .eq("id", pkg.id);
    if (upErr) {
      console.error(`   ✗ DB update failed: ${upErr.message}`);
      continue;
    }
    console.log(`   ✔ marked packages row inactive`);
  }
}

console.log("\nDone.");
