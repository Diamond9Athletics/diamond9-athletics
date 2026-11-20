import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PlanCard, planLinkClass, SESSIONS_EXPIRE } from "@/components/PlanCard";
import { plansFor } from "@/lib/plans";
import { OpenTimesPreview } from "@/components/OpenTimesPreview";

export const metadata: Metadata = {
  title: "Pitching Plans",
  description: "Elite pitching training plans with Rapsodo tracking — velocity, command, and arm care programs in Austin, TX.",
};

export default function PitchingPlans() {
  return (
    <main className="pt-16 bg-[#0d0c11]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <PageHero
        badge="TRAINING PROGRAMS"
        title="Pitching"
        accent="plans"
        subtitle="Every session Rapsodo tracked. Every throw has a purpose."
      />

      {/* ── Plans Grid ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-12 sm:pt-16 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {plansFor("pitching").map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              action={
                <Link href={plan.href} className={planLinkClass(plan.featured)}>
                  {plan.cta}
                </Link>
              }
            />
          ))}
        </div>
        <p className="text-zinc-500 text-sm text-center mt-6">
          {SESSIONS_EXPIRE} The Diamond membership renews monthly until you cancel.
        </p>
      </section>

      {/* ── Open times this week ─────────────────────────────── */}
      <OpenTimesPreview category="pitching" />

    </main>
  );
}
