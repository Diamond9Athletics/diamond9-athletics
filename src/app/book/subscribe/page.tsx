import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscribeRedirector } from "./SubscribeRedirector";

/**
 * Gate for the Diamond membership. If not signed in, bounce to signup
 * (which will send them back here on completion). If signed in, hand off
 * to a client component that hits /api/stripe/subscribe and redirects
 * to Stripe Checkout.
 */
export default async function SubscribePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/book/signup?next=/book/subscribe");
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-16 text-center">
        <span className="badge-amber mb-5 inline-flex">◆ DIAMOND MEMBERSHIP</span>
        <h1 className="font-display text-5xl sm:text-6xl text-white leading-none mb-4">
          ONE MOMENT
        </h1>
        <div className="divider-glow max-w-[80px] mx-auto mb-6" />
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          Sending you to secure checkout with Stripe…
        </p>
        <SubscribeRedirector />
      </section>
    </main>
  );
}
