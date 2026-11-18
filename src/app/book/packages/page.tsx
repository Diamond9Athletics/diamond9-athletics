import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BuyButton } from "./BuyButton";
import { requireWaiver } from "@/lib/legal/waiver";
import { PlanCard, planLinkClass, SESSIONS_EXPIRE } from "@/components/PlanCard";
import { PLANS, type Plan, type PlanCategory } from "@/lib/plans";

// The pitching Diamond bundle is no longer sold as a package — it's now
// a monthly membership handled by /book/subscribe. Hide any DB rows that
// look like the old Diamond pitching package or the retired Half sessions.
const HIDDEN_SLUGS = new Set([
  "pitching-diamond",
  "pitching-half",
  "hitting-half",
]);

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Choose a Plan",
};

type PackageRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  credits: number;
  kind: "credits" | "enrollment";
  service: { category: PlanCategory; duration_min: number } | null;
};

/** The card for a package that's for sale: the plan pages' wording and
 *  features, with the price and session count checkout will actually use. */
function asPlan(pkg: PackageRow): Plan {
  const known = PLANS.find((p) => p.slug === pkg.slug);
  const sessions = pkg.kind === "enrollment" ? 1 : pkg.credits;
  return {
    slug: pkg.slug,
    category: pkg.service?.category ?? "pitching",
    name: known?.name ?? pkg.name.toUpperCase(),
    title: known?.title ?? pkg.name,
    tag: known?.tag ?? (pkg.kind === "enrollment" ? "FULL PROGRAM" : "PLAN"),
    price: Math.round(pkg.price_cents) / 100,
    sessions,
    sub:
      pkg.kind === "enrollment"
        ? "Full program · all-inclusive"
        : sessions > 1
          ? `${sessions} sessions`
          : `${pkg.service?.duration_min ?? 60} min session`,
    features: known?.features ?? [],
    featured: known?.featured,
    jersey: known?.jersey ?? String(sessions),
    href: `/book/buy/${pkg.slug}`,
    cta: "BUY PLAN",
    value: pkg.kind === "enrollment" ? { main: "One price for the full program" } : undefined,
  };
}

export default async function Packages() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/book/login");
  await requireWaiver(supabase, user, "/book/packages");

  const { data, error } = await supabase
    .from("packages")
    .select("id, slug, name, price_cents, credits, kind, service:services(category, duration_min)")
    .eq("active", true)
    .order("price_cents", { ascending: false });

  if (error) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen text-zinc-300 text-center">
        <p className="p-10">Failed to load plans: {error.message}</p>
      </main>
    );
  }

  const packages = ((data ?? []) as unknown as PackageRow[]).filter((p) => !HIDDEN_SLUGS.has(p.slug));
  const membership = PLANS.find((p) => p.sessions === "unlimited");

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10 sm:py-12">
        <div className="text-center mb-10">
          <p className="section-label mb-3">BUY SESSIONS</p>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            CHOOSE A <span className="gradient-text">PLAN</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>

        {(["pitching", "hitting"] as const).map((category) => {
          const cards = packages.filter((p) => p.service?.category === category).map(asPlan);
          const showMembership = category === "pitching" && membership;
          if (!cards.length && !showMembership) return null;
          return (
            <div key={category} className="mb-12">
              <h2 className="font-display text-3xl sm:text-4xl text-white mb-5 tracking-wide">
                {category.toUpperCase()} <span className="gradient-text">PLANS</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                {showMembership && (
                  <PlanCard
                    plan={membership}
                    action={
                      <Link href={membership.href} className={planLinkClass(true)}>
                        {membership.cta}
                      </Link>
                    }
                  />
                )}
                {cards.map((plan) => (
                  <PlanCard
                    key={plan.slug}
                    plan={plan}
                    action={
                      <BuyButton
                        slug={plan.slug!}
                        kind={packages.find((p) => p.slug === plan.slug)?.kind ?? "credits"}
                        featured={plan.featured}
                      />
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}

        <p className="text-zinc-500 text-sm text-center">{SESSIONS_EXPIRE}</p>
      </section>
    </main>
  );
}
