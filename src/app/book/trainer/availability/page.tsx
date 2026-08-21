import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { BlocksEditor } from "./BlocksEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Availability" };

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/book/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_trainer, trainer_categories, first_name")
    .eq("id", user.id)
    .single();

  if (!me?.is_trainer) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-24 text-center text-zinc-400">
          This page is for trainers.
        </section>
      </main>
    );
  }

  const categories = (me.trainer_categories ?? []) as ("pitching" | "hitting")[];

  const [{ data: rules }, { data: blocks }] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("id, day_of_week, category, start_time, end_time")
      .eq("trainer_id", user.id)
      .eq("active", true)
      .order("day_of_week"),
    supabase
      .from("availability_blocks")
      .select("id, starts_at, ends_at, reason")
      .eq("trainer_id", user.id)
      // Show anything that hasn't fully ended yet — including blocks
      // whose start_time is earlier today. Filtering on starts_at hid
      // same-day blocks the moment they began.
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
  ]);

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="section-label mb-3">YOUR HOURS</p>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            AVAILABILITY
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
          <p className="text-zinc-500 text-xs mt-4">
            All times in Central. Athletes can only book when you&rsquo;re open.
          </p>
        </div>

        <div className="card-modern rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="font-display text-2xl text-white mb-1">Weekly hours</h2>
          <p className="text-zinc-500 text-xs mb-5">
            Add as many windows per day as you want. Leave a day empty to be unavailable.
          </p>
          <AvailabilityEditor
            initialRules={rules ?? []}
            categories={categories}
          />
        </div>

        <div className="card-modern rounded-2xl p-6 sm:p-8">
          <h2 className="font-display text-2xl text-white mb-1">Time off</h2>
          <p className="text-zinc-500 text-xs mb-5">
            Block specific dates or windows (vacation, tournaments, family stuff).
          </p>
          <BlocksEditor initialBlocks={blocks ?? []} />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/book/trainer"
            className="text-zinc-500 hover:text-[#b07adf] text-xs tracking-wider"
          >
            ← BACK TO SCHEDULE
          </Link>
        </div>
      </section>
    </main>
  );
}
