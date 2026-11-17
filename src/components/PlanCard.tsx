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
      className={`relative rounded-2xl overflow-hidden flex flex-col card-lift card-shine ${plan.featured ? "plan-featured card-modern-amber" : "card-modern"}`}
    >
      {plan.featured && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#9954d2] to-transparent" />
          <div className="ribbon">{plan.tag}</div>
        </>
      )}
      {/* Jersey number watermark */}
      <div className="jersey-num absolute right-2 bottom-[-10px] text-[6rem] opacity-[0.06]">{plan.jersey}</div>

      <div className={`p-6 flex flex-col flex-1 ${plan.featured ? "pt-7" : ""}`}>
        {/* The featured plan's tag is on its corner ribbon instead. */}
        <div className="mb-5 h-6">
          {!plan.featured && (
            <span className="text-xs tracking-wider font-bold px-2.5 py-1 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/30">
              {plan.tag}
            </span>
          )}
        </div>
        <h3 className="font-display text-3xl text-white mb-0.5">{plan.name}</h3>
        <p className="text-zinc-400 text-sm mb-4">{plan.sub}</p>
        <p className="gradient-text font-display text-5xl mb-4">
          ${plan.price}
          {plan.sessions === "unlimited" && (
            <span className="text-2xl text-zinc-500 font-normal ml-1">/MO</span>
          )}
        </p>

        {/* What it works out to */}
        <div className="mb-5 rounded-xl bg-[#9954d2]/8 border border-[#9954d2]/15 px-3.5 py-2.5">
          <p className="text-white text-sm font-semibold">{value.main}</p>
          {value.note && <p className="text-[#b07adf] text-xs mt-0.5">{value.note}</p>}
        </div>

        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-zinc-300 text-sm">
              <svg className="w-3.5 h-3.5 text-[#9954d2] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
  return `text-center py-3.5 rounded-full text-sm tracking-widest font-bold block ${featured ? "btn-gold" : "btn-outline"}`;
}

export const SESSIONS_EXPIRE = "Sessions expire 31 days after your first scheduled session.";
