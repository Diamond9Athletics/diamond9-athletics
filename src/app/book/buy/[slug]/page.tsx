import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireWaiver } from "@/lib/legal/waiver";
import { BuyRedirector } from "./BuyRedirector";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout",
};

/**
 * Deep link to buy one package — the SELECT PLAN buttons on the plan
 * pages land here. Signed-out visitors sign in (or create an account)
 * and come straight back; then we hand off to Stripe Checkout for that
 * exact package, same as BUY PACKAGE on /book/packages.
 */
export default async function BuyPackage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Packages are public, so a stale or retired link is caught before we
  // make anyone sign in.
  const { data: pkg } = await supabase
    .from("packages")
    .select("slug, name")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!pkg) redirect("/book/packages");

  const here = `/book/buy/${pkg.slug}`;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/book/login?next=${encodeURIComponent(here)}`);
  await requireWaiver(supabase, user, here);

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-16 text-center">
        <span className="badge-amber mb-5 inline-flex">◆ {pkg.name.toUpperCase()}</span>
        <h1 className="font-display text-5xl sm:text-6xl text-white leading-none mb-4">
          ONE MOMENT
        </h1>
        <div className="divider-glow max-w-[80px] mx-auto mb-6" />
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          Sending you to secure checkout with Stripe…
        </p>
        <BuyRedirector slug={pkg.slug} />
      </section>
    </main>
  );
}
