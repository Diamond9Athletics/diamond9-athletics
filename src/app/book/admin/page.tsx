import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AthleteRow } from "./AthleteRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

const TZ = "America/Chicago";

type AthleteRowData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  is_admin: boolean;
  is_trainer: boolean;
  created_at: string;
  credits: number;
  upcoming: number;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/book/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-24 text-center text-zinc-400">
          Admin only.{" "}
          <Link href="/book/dashboard" className="text-[#b07adf]">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const admin = createAdminClient();

  // Month bounds for revenue.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nowIso = now.toISOString();

  const [
    { data: profiles },
    { data: creditRows },
    { data: bookingRows },
    { data: purchaseRows },
    { count: totalUsers },
    { count: totalBookings },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, first_name, last_name, email, phone, is_admin, is_trainer, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("credit_buckets")
      .select("user_id, credits_remaining"),
    admin
      .from("bookings")
      .select("user_id, starts_at, status")
      .eq("status", "confirmed")
      .gte("starts_at", nowIso),
    admin
      .from("purchases")
      .select("id, amount_cents, status, paid_at, package:packages(name), user:profiles!purchases_user_id_fkey(first_name, last_name, email)")
      .eq("status", "paid")
      .gte("paid_at", monthStart.toISOString())
      .lt("paid_at", monthEnd.toISOString())
      .order("paid_at", { ascending: false }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("starts_at", nowIso),
  ]);

  const creditsByUser = new Map<string, number>();
  for (const r of creditRows ?? []) {
    creditsByUser.set(
      r.user_id,
      (creditsByUser.get(r.user_id) ?? 0) + (r.credits_remaining ?? 0),
    );
  }

  const upcomingByUser = new Map<string, number>();
  for (const r of bookingRows ?? []) {
    upcomingByUser.set(r.user_id, (upcomingByUser.get(r.user_id) ?? 0) + 1);
  }

  const athletes: AthleteRowData[] = (profiles ?? []).map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email,
    phone: p.phone,
    is_admin: p.is_admin,
    is_trainer: p.is_trainer,
    created_at: p.created_at,
    credits: creditsByUser.get(p.id) ?? 0,
    upcoming: upcomingByUser.get(p.id) ?? 0,
  }));

  const monthCents = (purchaseRows ?? []).reduce(
    (sum, r) => sum + (r.amount_cents ?? 0),
    0,
  );
  const monthDollars = (monthCents / 100).toFixed(2);
  const monthLabel = monthStart.toLocaleString("en-US", {
    timeZone: TZ,
    month: "long",
    year: "numeric",
  });

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="section-label mb-3">ADMIN</p>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            THE
            <span className="block gradient-text">CONTROL ROOM</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
        </div>

        {/* Snapshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat label="ATHLETES" value={String(totalUsers ?? 0)} sub="signed up" />
          <Stat label="UPCOMING" value={String(totalBookings ?? 0)} sub="confirmed sessions" />
          <Stat
            label={monthLabel.toUpperCase()}
            value={`$${monthDollars}`}
            sub="paid revenue"
          />
          <Stat
            label="PURCHASES"
            value={String(purchaseRows?.length ?? 0)}
            sub="this month"
          />
        </div>

        {/* Recent purchases */}
        <div className="card-modern rounded-2xl p-6 mb-8">
          <p className="text-zinc-500 text-[10px] tracking-widest mb-4 font-bold">
            RECENT PURCHASES · {monthLabel.toUpperCase()}
          </p>
          {!purchaseRows || purchaseRows.length === 0 ? (
            <p className="text-zinc-500 text-sm">No purchases this month.</p>
          ) : (
            <ul className="space-y-2">
              {purchaseRows.slice(0, 20).map((p) => {
                const pkg = Array.isArray(p.package) ? p.package[0] : p.package;
                const u = Array.isArray(p.user) ? p.user[0] : p.user;
                const when = p.paid_at
                  ? new Date(p.paid_at).toLocaleString("en-US", {
                      timeZone: TZ,
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-white truncate">{pkg?.name ?? "Package"}</p>
                      <p className="text-zinc-500 text-xs truncate">
                        {u?.first_name} {u?.last_name} · {u?.email}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[#b07adf] font-bold">
                        ${((p.amount_cents ?? 0) / 100).toFixed(2)}
                      </p>
                      <p className="text-zinc-600 text-xs">{when}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Athlete list */}
        <div className="card-modern rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-500 text-[10px] tracking-widest font-bold">
              ATHLETES ({athletes.length})
            </p>
            <p className="text-zinc-600 text-[10px] tracking-wider">
              Most recent first
            </p>
          </div>
          <div className="space-y-2">
            {athletes.map((a) => (
              <AthleteRow key={a.id} athlete={a} />
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/book/dashboard"
            className="text-zinc-500 hover:text-[#b07adf] text-xs tracking-wider"
          >
            ← BACK TO DASHBOARD
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card-modern rounded-2xl p-4 sm:p-5">
      <p className="text-zinc-500 text-[9px] tracking-widest mb-2 font-bold">{label}</p>
      <p className="font-display text-3xl gradient-text mb-1">{value}</p>
      <p className="text-zinc-600 text-[11px]">{sub}</p>
    </div>
  );
}
