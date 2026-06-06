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

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .single();

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
          <Card title="MY CREDITS" value="0" sub="Coming soon — buy a package to add credits" />
          <Card title="UPCOMING SESSIONS" value="0" sub="Coming soon — book a session" />
        </div>

        <div className="card-modern rounded-2xl p-6 sm:p-8 text-zinc-300 text-sm leading-relaxed space-y-3">
          <p className="text-[#b07adf] text-xs tracking-widest font-bold">UNDER CONSTRUCTION</p>
          <p>
            Account is live. Booking and Stripe purchase flows are next.
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

function Card({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card-modern rounded-2xl p-6 sm:p-7">
      <p className="text-zinc-500 text-[10px] tracking-widest mb-2 font-bold">{title}</p>
      <p className="font-display text-5xl gradient-text mb-1">{value}</p>
      <p className="text-zinc-500 text-xs">{sub}</p>
    </div>
  );
}
