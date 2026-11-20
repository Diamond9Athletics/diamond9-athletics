import type { ReactNode } from "react";
import { planValue, type Plan } from "@/lib/plans";

/**
 * One plan, the same everywhere it's sold. `action` is the button: a link
 * to checkout on the public plan pages, or the buy button on Choose a Plan.
 */
export function PlanCard({ plan, action }: { plan: Plan; action: ReactNode }) {
  const value = plan.value ?? planValue(plan);
  return (
    <div
      className={`relative rounded-2xl flex flex-col card-lift ${plan.featured ? "plan-featured card-modern-amber" : "card-modern"}`}
    >
      <div className="p-6 sm:p-7 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-display text-[1.75rem] leading-tight text-white">{plan.name}</h3>
          <span
            className={`mt-1 shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
              plan.featured
                ? "text-[#d6bff5] border-[#a97ce2]/40 bg-[#a97ce2]/10"
                : "text-zinc-400 border-white/10 bg-white/[0.03]"
            }`}
          >
            {plan.tag}
          </span>
        </div>
        <p className="text-zinc-500 text-sm mb-6">{plan.sub}</p>
        <p className="font-display text-5xl text-white mb-5">
          ${plan.price}
          {plan.sessions === "unlimited" && <span className="text-lg text-zinc-500 font-normal ml-1.5">/ month</span>}
        </p>

        {/* What it works out to */}
        <div className="mb-6 pb-5 border-b border-white/[0.07]">
          <p className="text-zinc-200 text-sm font-medium">{value.main}</p>
          {value.note && <p className="text-[#b48ae6] text-xs mt-1">{value.note}</p>}
        </div>

        <ul className="space-y-3 flex-1 mb-7">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-zinc-300 text-sm leading-snug">
              <svg className="w-4 h-4 mt-px text-[#a97ce2] shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5l3.5 3.5 7.5-8" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        {action}
      </div>
    </div>
  );
}

/** The plan card's button as a plain link. */
export function planLinkClass(featured?: boolean) {
  return `text-center py-3 rounded-full text-sm block ${featured ? "btn-gold" : "btn-outline"}`;
}

export const SESSIONS_EXPIRE = "Sessions expire 31 days after your first scheduled session.";
