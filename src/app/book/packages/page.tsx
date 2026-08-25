import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BuyButton } from "./BuyButton";

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
  const visible = packages.filter((p) => !HIDDEN_SLUGS.has(p.slug));
  const pitching = visible.filter((p) => p.service?.category === "pitching");
  const hitting = visible.filter((p) => p.service?.category === "hitting");

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

        <h2 className="font-display text-3xl sm:text-4xl text-white mb-5 tracking-wide">
          PITCHING <span className="gradient-text">PLANS</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <DiamondSubscribeCard />
          {pitching.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>

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

function DiamondSubscribeCard() {
  return (
    <div className="relative rounded-2xl overflow-hidden card-modern-amber p-6 flex flex-col">
      <span className="badge-amber mb-3 inline-flex">MEMBERSHIP</span>
      <h3 className="font-display text-2xl sm:text-3xl text-white leading-tight mb-1">
        DIAMOND
      </h3>
      <p className="text-zinc-500 text-xs mb-4">unlimited sessions · monthly</p>
      <p className="gradient-text font-display text-5xl mb-5">
        $350<span className="text-2xl text-zinc-500 font-normal ml-1">/mo</span>
      </p>
      <p className="text-zinc-500 text-[11px] mb-5 leading-relaxed">
        Come in whenever the schedule is open. Cancel anytime — no long-term commitment.
      </p>
      <Link
        href="/book/subscribe"
        className="btn-gold w-full text-center py-3 rounded-full text-xs tracking-widest font-black mt-auto block"
      >
        SUBSCRIBE
      </Link>
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
