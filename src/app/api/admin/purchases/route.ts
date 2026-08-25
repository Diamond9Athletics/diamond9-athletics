/**
 * Admin: list every athlete who has ever bought a package in a given
 * category (default: pitching). Reads from Supabase — reflects purchases
 * the Stripe webhook has processed. Purchases created directly in Stripe
 * (manual invoices, etc.) won't appear here.
 *
 * GET /api/admin/purchases?category=pitching
 *
 * Returns:
 *   {
 *     category,
 *     totalPurchases,
 *     uniqueAthletes,
 *     athletes: [{
 *       user_id, first_name, last_name, email, phone,
 *       purchase_count, total_cents, first_purchase, last_purchase,
 *       packages: [package names bought]
 *     }]
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? "pitching";

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("purchases")
    .select(
      `
      id,
      user_id,
      status,
      amount_cents,
      paid_at,
      created_at,
      package:packages!inner(
        name,
        service:services!inner(category)
      ),
      profile:profiles!purchases_user_id_fkey(
        first_name, last_name, email, phone
      )
      `,
    )
    .eq("status", "paid")
    .order("paid_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type PurchaseRow = {
    id: string;
    user_id: string;
    status: string;
    amount_cents: number | null;
    paid_at: string | null;
    created_at: string;
    package:
      | { name: string; service: { category: string } | { category: string }[] }
      | { name: string; service: { category: string } | { category: string }[] }[]
      | null;
    profile:
      | { first_name: string | null; last_name: string | null; email: string | null; phone: string | null }
      | { first_name: string | null; last_name: string | null; email: string | null; phone: string | null }[]
      | null;
  };

  type Aggregate = {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    purchase_count: number;
    total_cents: number;
    first_purchase: string | null;
    last_purchase: string | null;
    packages: string[];
  };

  const byUser = new Map<string, Aggregate>();
  let totalPurchases = 0;

  for (const raw of (rows ?? []) as PurchaseRow[]) {
    const pkg = Array.isArray(raw.package) ? raw.package[0] : raw.package;
    if (!pkg) continue;
    const svc = Array.isArray(pkg.service) ? pkg.service[0] : pkg.service;
    if (!svc || svc.category !== category) continue;

    totalPurchases += 1;

    const profile = Array.isArray(raw.profile) ? raw.profile[0] : raw.profile;
    const when = raw.paid_at ?? raw.created_at;

    const existing = byUser.get(raw.user_id);
    if (existing) {
      existing.purchase_count += 1;
      existing.total_cents += raw.amount_cents ?? 0;
      existing.last_purchase = when;
      if (!existing.packages.includes(pkg.name)) existing.packages.push(pkg.name);
    } else {
      byUser.set(raw.user_id, {
        user_id: raw.user_id,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        email: profile?.email ?? null,
        phone: profile?.phone ?? null,
        purchase_count: 1,
        total_cents: raw.amount_cents ?? 0,
        first_purchase: when,
        last_purchase: when,
        packages: [pkg.name],
      });
    }
  }

  const athletes = Array.from(byUser.values()).sort((a, b) => {
    // Most recent purchase first.
    const aT = a.last_purchase ? new Date(a.last_purchase).getTime() : 0;
    const bT = b.last_purchase ? new Date(b.last_purchase).getTime() : 0;
    return bT - aT;
  });

  return NextResponse.json({
    category,
    totalPurchases,
    uniqueAthletes: athletes.length,
    athletes,
  });
}
