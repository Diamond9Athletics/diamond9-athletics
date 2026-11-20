/**
 * The plans as shown on the Pitching Plans, Hitting Plans and Choose a
 * Plan pages, so all three look and read the same.
 *
 * Programming, plyo, mobility, media/recruiting videos and full app access
 * are Diamond perks: keep them off Gold and Single unless Wes says so.
 * Checkout charges what's in the database's packages table, so a price
 * change goes there too.
 */

export type PlanCategory = "pitching" | "hitting";

export type Plan = {
  /** The package's slug in the database; the membership has none. */
  slug: string | null;
  category: PlanCategory;
  name: string;
  /** Full name, as on receipts: "Gold Pitching Plan". */
  title: string;
  tag: string;
  /** Dollars. */
  price: number;
  /** A number of sessions, or a monthly membership. */
  sessions: number | "unlimited";
  sub: string;
  features: string[];
  featured?: boolean;
  jersey: string;
  href: string;
  cta: string;
  /** Overrides the per-session line, e.g. for a full program. */
  value?: { main: string; note?: string };
};

export const PLANS: Plan[] = [
  {
    slug: null,
    category: "pitching",
    name: "Diamond",
    title: "Diamond Pitching Membership",
    tag: "Membership",
    price: 350,
    sessions: "unlimited",
    sub: "Monthly membership · cancel anytime",
    features: [
      "Unlimited sessions per month",
      "Personal throwing plan",
      "Plyo ball program",
      "Weighted ball training",
      "Mobility & arm care",
      "Rapsodo tracking",
      "Unlimited video review",
      "Full D9 App access",
    ],
    featured: true,
    jersey: "◆",
    href: "/book/subscribe",
    cta: "Subscribe",
  },
  {
    slug: "pitching-gold",
    category: "pitching",
    name: "Gold",
    title: "Gold Pitching Plan",
    tag: "Great value",
    price: 285,
    sessions: 3,
    sub: "3 sessions",
    features: ["3 sessions", "Weighted ball training", "Rapsodo tracking", "Arm care"],
    jersey: "3",
    href: "/book/buy/pitching-gold",
    cta: "Select plan",
  },
  {
    slug: "pitching-single",
    category: "pitching",
    name: "Single",
    title: "Single Pitching Session",
    tag: "One time",
    price: 125,
    sessions: 1,
    sub: "60 min session",
    features: ["60 min bullpen", "Rapsodo tracking", "Throwing drills", "Arm care"],
    jersey: "1",
    href: "/book/buy/pitching-single",
    cta: "Select plan",
  },
  {
    slug: "hitting-diamond",
    category: "hitting",
    name: "Diamond",
    title: "Diamond Hitting Plan",
    tag: "Most popular",
    price: 300,
    sessions: 4,
    sub: "4 sessions",
    features: [
      "4 sessions",
      "2 media / recruiting videos",
      "At-home tee plan",
      "Swing path & barrel control",
      "Lower-half sequencing",
      "Video analysis",
      "Bat speed development",
    ],
    featured: true,
    jersey: "4",
    href: "/book/buy/hitting-diamond",
    cta: "Select plan",
  },
  {
    slug: "hitting-gold",
    category: "hitting",
    name: "Gold",
    title: "Gold Hitting Plan",
    tag: "Great value",
    price: 275,
    sessions: 3,
    sub: "3 sessions",
    features: ["3 sessions", "Swing assessment", "Video breakdown", "Bat speed & rotational power"],
    jersey: "3",
    href: "/book/buy/hitting-gold",
    cta: "Select plan",
  },
  {
    slug: "hitting-single",
    category: "hitting",
    name: "Single",
    title: "Single Hitting Session",
    tag: "One time",
    price: 100,
    sessions: 1,
    sub: "60 min session",
    features: [
      "60 min cage session",
      "Full swing assessment",
      "Corrective drill series",
      "Timing & velocity work",
      "Take-home drill plan",
    ],
    jersey: "1",
    href: "/book/buy/hitting-single",
    cta: "Select plan",
  },
];

export const plansFor = (category: PlanCategory) => PLANS.filter((p) => p.category === category);

const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

/** What a plan works out to per session, and what it saves over singles. */
export function planValue(
  plan: Pick<Plan, "category" | "price" | "sessions">,
  singlePrice = PLANS.find((p) => p.category === plan.category && p.sessions === 1)?.price,
): { main: string; note?: string } {
  if (plan.sessions === "unlimited") {
    return { main: "Unlimited sessions", note: "Train as often as the schedule allows" };
  }
  const per = plan.price / plan.sessions;
  if (plan.sessions === 1 || !singlePrice) return { main: `${money(per)} per session` };
  const saved = singlePrice * plan.sessions - plan.price;
  return {
    main: `${money(per)} per session`,
    note: saved > 0 ? `Save ${money(saved)} vs. ${plan.sessions} singles` : undefined,
  };
}

/**
 * The plan someone is on their way to buying, read from the page they'll
 * land on after signing in: /book/buy/<slug>, /book/subscribe, or the
 * agreement page with one of those as its own ?next=.
 */
export function planFromPath(path: string | null | undefined): Plan | null {
  if (!path) return null;
  const [pathname, query = ""] = path.split("?");
  if (pathname === "/book/waiver") {
    const inner = new URLSearchParams(query).get("next");
    return inner && inner !== path ? planFromPath(inner) : null;
  }
  const buy = pathname.match(/^\/book\/buy\/([a-z0-9-]+)$/);
  if (buy) return PLANS.find((p) => p.slug === buy[1]) ?? null;
  if (pathname === "/book/subscribe") return PLANS.find((p) => p.sessions === "unlimited") ?? null;
  return null;
}

/** "$285", or "$350/month" for the membership. */
export function planPriceLabel(plan: Pick<Plan, "price" | "sessions">) {
  return plan.sessions === "unlimited" ? `$${plan.price}/month` : `$${plan.price}`;
}
