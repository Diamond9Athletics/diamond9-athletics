import { planPriceLabel, type Plan } from "@/lib/plans";

/** "You're getting: Gold Pitching Plan · $285" — on the way to checkout. */
export function PlanContext({ plan }: { plan: Plan }) {
  return (
    <div className="card-modern-amber rounded-2xl px-5 py-4 mb-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="section-label mb-1">YOU&rsquo;RE GETTING</p>
        <p className="text-white font-bold leading-snug">{plan.title}</p>
      </div>
      <p className="gradient-text font-display text-3xl shrink-0">{planPriceLabel(plan)}</p>
    </div>
  );
}
