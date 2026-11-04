import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SubscribeRedirector } from "./SubscribeRedirector";
import { requireWaiver } from "@/lib/legal/waiver";
import { diamondMemberships } from "@/lib/stripe/subscription";
import { fullName, loadFamily } from "@/lib/booking/athletes";

/**
 * Gate for the Diamond membership. If not signed in, bounce to signup
 * (which will send them back here on completion). A membership covers
 * one athlete, so a family account first picks who it's for (?for=).
 * Then a client component hits /api/stripe/subscribe and redirects to
 * Stripe Checkout.
 */
export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/book/signup?next=/book/subscribe");
  }
  const { for: forKey } = await searchParams;
  await requireWaiver(
    supabase,
    user,
    forKey ? `/book/subscribe?for=${encodeURIComponent(forKey)}` : "/book/subscribe",
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();
  const family = await loadFamily(supabase, user.id, {
    first_name: profile?.first_name ?? null,
    last_name: profile?.last_name ?? null,
    email: user.email,
  });
  let members = new Set<string>();
  if (user.email) {
    try {
      members = new Set((await diamondMemberships(user.email)).map((m) => m.athleteKey));
    } catch (e) {
      console.warn("Subscribe membership check failed:", (e as Error).message);
    }
  }

  // One athlete: straight to checkout for them. A family picks first.
  const chosen = family.length === 1 ? family[0] : family.find((a) => a.key === forKey);

  if (chosen && !members.has(chosen.key)) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-16 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ DIAMOND MEMBERSHIP</span>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none mb-4">
            ONE MOMENT
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mb-6" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            {family.length > 1 ? `Setting up ${chosen.firstName}'s membership. ` : ""}
            Sending you to secure checkout with Stripe…
          </p>
          <SubscribeRedirector athleteKey={chosen.key} />
        </section>
      </main>
    );
  }

  if (family.length === 1) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-16 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ DIAMOND MEMBERSHIP</span>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none mb-4">
            YOU&rsquo;RE IN
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mb-6" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            You already have a Diamond membership. Manage it from your account page.
          </p>
          <Link
            href="/book/dashboard"
            className="btn-gold inline-block px-8 py-3 rounded-full text-xs tracking-widest font-black"
          >
            MY ACCOUNT
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="text-center">
          <span className="badge-amber mb-5 inline-flex">◆ DIAMOND MEMBERSHIP</span>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none mb-4">
            WHO&rsquo;S IT FOR?
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mb-6" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            A Diamond membership covers one athlete. Everyone else on your account can still
            book with credits.
          </p>
        </div>
        <div className="card-modern rounded-2xl p-6 space-y-3">
          {family.map((a) => {
            const name = fullName(a) || a.firstName;
            return members.has(a.key) ? (
              <div
                key={a.key}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-zinc-900/30 border border-zinc-800/60"
              >
                <span className="text-zinc-500 text-sm font-bold">{name}</span>
                <span className="text-[#b07adf] text-[10px] tracking-widest font-bold">◆ MEMBER</span>
              </div>
            ) : (
              <Link
                key={a.key}
                href={`/book/subscribe?for=${encodeURIComponent(a.key)}`}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-[#9954d2]/50 transition"
              >
                <span className="text-white text-sm font-bold">{name}</span>
                <span className="text-zinc-500 text-xs">→</span>
              </Link>
            );
          })}
        </div>
        <p className="text-zinc-500 text-xs text-center mt-6">
          Someone missing? Add them on{" "}
          <Link href="/book/dashboard" className="text-[#b07adf] hover:underline">
            your account page
          </Link>{" "}
          first.
        </p>
      </section>
    </main>
  );
}
