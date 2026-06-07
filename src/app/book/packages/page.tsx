import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BuyButton } from "./BuyButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Buy a Package",
};

type PackageRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  credits: number;
  kind: "credits" | "enrollment";
  service: { category: "pitching" | "hitting"; duration_min: number } | null;
};

const TAGS: Record<string, string> = {
  diamond: "MOST POPULAR",
  gold: "GREAT VALUE",
  single: "ONE TIME",
  half: "QUICK HIT",
  "college-summer": "FULL PROGRAM",
  "summer-training": "FULL PROGRAM",
};

export default async function Packages() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/book/login");

  const { data, error } = await supabase
    .from("packages")
    .select("id, slug, name, price_cents, credits, kind, service:services(category, duration_min)")
    .eq("active", true)
    .order("price_cents", { ascending: false });

  if (error) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen text-zinc-300 text-center">
        <p className="p-10">Failed to load packages: {error.message}</p>
      </main>
    );
  }

  const packages = (data ?? []) as unknown as PackageRow[];
  const pitching = packages.filter((p) => p.service?.category === "pitching");
  const hitting = packages.filter((p) => p.service?.category === "hitting");

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <p className="section-label mb-3">CHOOSE A PACKAGE</p>
          <h1 className="font-display text-5xl sm:text-7xl text-white leading-none">
            BUY A
            <span className="block gradient-text">PACKAGE</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>

        <Group title="Pitching" packages={pitching} />
        <div className="h-10" />
        <Group title="Hitting" packages={hitting} />
      </section>
    </main>
  );
}

function Group({ title, packages }: { title: string; packages: PackageRow[] }) {
  return (
    <div>
      <h2 className="font-display text-3xl sm:text-4xl text-white mb-5 tracking-wide">
        {title.toUpperCase()} <span className="gradient-text">PLANS</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((p) => (
          <PackageCard key={p.id} pkg={p} />
        ))}
      </div>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: PackageRow }) {
  const dollars = (pkg.price_cents / 100).toFixed(0);
  const tagKey = pkg.slug.split("-").slice(1).join("-"); // strip "pitching-" / "hitting-"
  const tag = TAGS[tagKey] ?? "";
  const sub =
    pkg.kind === "enrollment"
      ? "Full program · All-inclusive"
      : pkg.credits > 1
        ? `${pkg.credits} sessions`
        : `${pkg.service?.duration_min ?? 60} min session`;
  const featured = tagKey === "diamond" || tagKey.includes("summer");

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${
        featured ? "card-modern-amber" : "card-modern"
      } p-6`}
    >
      {tag && (
        <span className="badge-amber mb-3 inline-flex">{tag}</span>
      )}
      <h3 className="font-display text-2xl sm:text-3xl text-white leading-tight mb-1">
        {pkg.name.toUpperCase()}
      </h3>
      <p className="text-zinc-500 text-xs mb-4">{sub}</p>
      <p className="gradient-text font-display text-5xl mb-5">${dollars}</p>
      {pkg.kind === "credits" && (
        <p className="text-zinc-600 text-[11px] mb-5 leading-relaxed">
          Credits expire 31 days after the first scheduled session.
        </p>
      )}
      <BuyButton slug={pkg.slug} kind={pkg.kind} />
    </div>
  );
}
