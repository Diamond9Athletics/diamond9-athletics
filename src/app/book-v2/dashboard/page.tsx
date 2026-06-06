import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/book-v2/login");
  }

  const [{ data: profile }, { data: buckets }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single(),
    supabase
      .from("credit_buckets")
      .select(
        "credits_remaining, expires_at, service:services(name, category)",
      )
      .eq("user_id", user.id)
      .gt("credits_remaining", 0),
  ]);

  const totalCredits =
    buckets?.reduce((sum, b) => sum + (b.credits_remaining ?? 0), 0) ?? 0;

  const displayName =
    profile?.first_name || user.email?.split("@")[0] || "Athlete";

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="section-label mb-3">YOUR DASHBOARD</p>
          <h1 className="font-display text-5xl sm:text-7xl text-white leading-none">
            WELCOME<span className="text-[#b07adf]">,</span>
            <span className="block gradient-text">{displayName.toUpperCase()}</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <div className="card-modern rounded-2xl p-6 sm:p-7">
            <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">MY CREDITS</p>
            <p className="font-display text-5xl gradient-text mb-1">{totalCredits}</p>
            <p className="text-zinc-500 text-xs">
              {totalCredits > 0
                ? "Ready to book"
                : "No active credits — buy a package to get started"}
            </p>
            {buckets && buckets.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {buckets.map((b, i) => {
                  // service comes back as either an object or a one-element array
                  const svc = Array.isArray(b.service) ? b.service[0] : b.service;
                  return (
                    <p key={i} className="text-zinc-400 text-xs">
                      <span className="text-white">{b.credits_remaining}</span>{" "}
                      {svc?.name ?? "credit"}
                      {b.expires_at && (
                        <span className="text-zinc-600"> · expires {b.expires_at}</span>
                      )}
                    </p>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card-modern-amber rounded-2xl p-6 sm:p-7 flex flex-col">
            <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">BUY A PACKAGE</p>
            <p className="text-zinc-300 text-sm leading-relaxed mb-5 flex-1">
              Pick a Diamond, Gold, Single, or Half package — then use credits to book without paying again.
            </p>
            <Link
              href="/book-v2/packages"
              className="btn-gold px-6 py-3 rounded-full text-xs tracking-widest font-black text-center"
            >
              SEE PACKAGES
            </Link>
          </div>
        </div>

        <div className="card-modern rounded-2xl p-6 sm:p-8 text-zinc-300 text-sm leading-relaxed space-y-3">
          <p className="text-[#b07adf] text-xs tracking-widest font-bold">UNDER CONSTRUCTION</p>
          <p>
            Booking flow is next. Once your credits are loaded, you&rsquo;ll pick a slot from your
            trainer&rsquo;s calendar and confirm — no payment prompt.
          </p>
          <p className="text-zinc-500 text-xs">Signed in as {profile?.email ?? user.email}</p>
        </div>

        <form action="/book-v2/logout" method="post" className="mt-8 text-center">
          <button
            type="submit"
            className="btn-outline px-8 py-3 rounded-full text-xs tracking-widest font-bold"
          >
            SIGN OUT
          </button>
        </form>
      </section>
    </main>
  );
}
