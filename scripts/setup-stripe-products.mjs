#!/usr/bin/env node
/**
 * One-off setup: create a Stripe product + price for each package in
 * Supabase, then save the Stripe price ID back to the packages row.
 *
 * Idempotent: re-runs only create missing products.  Existing rows
 * with stripe_price_id set are left alone unless --force is passed.
 *
 * Usage:  node scripts/setup-stripe-products.mjs
 */
import { config as loadEnv } from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const force = process.argv.includes("--force");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
);

const { data: packages, error } = await supabase
  .from("packages")
  .select("*")
  .eq("active", true)
  .order("slug");

if (error) {
  console.error("✗ failed to load packages:", error.message);
  process.exit(1);
}

console.log(`Loaded ${packages.length} packages from Supabase.\n`);

let created = 0;
let skipped = 0;

for (const pkg of packages) {
  if (pkg.stripe_price_id && !force) {
    console.log(`⤿ ${pkg.slug.padEnd(28)} already linked (${pkg.stripe_price_id})`);
    skipped++;
    continue;
  }

  // Create product
  const product = await stripe.products.create({
    name: pkg.name,
    metadata: {
      package_slug: pkg.slug,
      package_kind: pkg.kind,
      credits: String(pkg.credits),
    },
  });

  // Create price (one-time, USD)
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: pkg.price_cents,
  });

  // Save price ID back to packages
  const { error: updateError } = await supabase
    .from("packages")
    .update({ stripe_price_id: price.id })
    .eq("id", pkg.id);

  if (updateError) {
    console.error(`  ✗ failed to save price id for ${pkg.slug}:`, updateError.message);
    continue;
  }

  console.log(`✓ ${pkg.slug.padEnd(28)} → ${price.id}  ($${(pkg.price_cents / 100).toFixed(2)})`);
  created++;
}

console.log(`\nDone. ${created} created, ${skipped} skipped.`);
