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
    name: "DIAMOND",
    title: "Diamond Pitching Membership",
    tag: "MEMBERSHIP",
    price: 350,
    sessions: "unlimited",
    sub: "Monthly membership · cancel anytime",
    features: [
      "Unlimited Sessions Per Month",
      "Personal Throwing Plan",
      "Plyo Ball Program",
      "Weighted Ball Training",
      "Mobility & Arm Care",
      "Rapsodo Tracking",
      "Unlimited Video Review",
      "Full D9 App Access",
    ],
    featured: true,
    jersey: "◆",
    href: "/book/subscribe",
    cta: "SUBSCRIBE",
  },
  {
    slug: "pitching-gold",
    category: "pitching",
    name: "GOLD",
    title: "Gold Pitching Plan",
    tag: "GREAT VALUE",
    price: 285,
    sessions: 3,
    sub: "3 sessions",
    features: ["3 Sessions", "Weighted Ball Training", "Rapsodo Tracking", "Arm Care"],
    jersey: "3",
    href: "/book/buy/pitching-gold",
    cta: "SELECT PLAN",
  },
  {
    slug: "pitching-single",
    category: "pitching",
    name: "SINGLE",
    title: "Single Pitching Session",
    tag: "ONE TIME",
    price: 125,
    sessions: 1,
    sub: "60 min session",
    features: ["60 Min Bullpen", "Rapsodo Tracking", "Throwing Drills", "Arm Care"],
    jersey: "1",
    href: "/book/buy/pitching-single",
    cta: "SELECT PLAN",
  },
  {
    slug: "hitting-diamond",
    category: "hitting",
    name: "DIAMOND",
    title: "Diamond Hitting Plan",
    tag: "MOST POPULAR",
    price: 300,
    sessions: 4,
    sub: "4 sessions",
    features: [
      "4 Sessions",
      "2 Media / Recruiting Videos",
      "At-Home Tee Plan",
      "Swing Path & Barrel Control",
      "Lower-Half Sequencing",
      "Video Analysis",
      "Bat Speed Development",
    ],
    featured: true,
    jersey: "4",
    href: "/book/buy/hitting-diamond",
    cta: "SELECT PLAN",
  },
  {
    slug: "hitting-gold",
    category: "hitting",
    name: "GOLD",
    title: "Gold Hitting Plan",
    tag: "GREAT VALUE",
    price: 275,
    sessions: 3,
    sub: "3 sessions",
    features: [
      "3 Sessions",
      "1 Media / Recruiting Video",
      "Swing Assessment",
      "Video Breakdown",
      "Bat Speed & Rotational Power",
      "Mobility Training",
    ],
    jersey: "3",
    href: "/book/buy/hitting-gold",
    cta: "SELECT PLAN",
  },
  {
    slug: "hitting-single",
    category: "hitting",
    name: "SINGLE",
    title: "Single Hitting Session",
    tag: "ONE TIME",
    price: 100,
    sessions: 1,
    sub: "60 min session",
    features: [
      "60 Min Cage Session",
      "Full Swing Assessment",
      "Corrective Drill Series",
      "Timing & Velocity Work",
      "Take-Home Drill Plan",
    ],
    jersey: "1",
    href: "/book/buy/hitting-single",
    cta: "SELECT PLAN",
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
