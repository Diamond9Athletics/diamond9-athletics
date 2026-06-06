import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trainer Dashboard" };

const TZ = "America/Chicago";

type BookingRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  service: { name: string } | { name: string }[] | null;
  athlete: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  } | Array<{
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  }> | null;
};

export default async function TrainerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/book-v2/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("first_name, is_trainer")
    .eq("id", user.id)
    .single();

  if (!me?.is_trainer) {
    return (
      <main className="pt-24 bg-[#040200] min-h-screen">
        <section className="max-w-md mx-auto px-6 py-24 text-center text-zinc-400">
          This page is for trainers.{" "}
          <Link href="/book-v2/dashboard" className="text-[#b07adf]">Go to your dashboard</Link>.
        </section>
      </main>
    );
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, ends_at, status, service:services(name), athlete:profiles!bookings_user_id_fkey(first_name, last_name, email, phone)",
    )
    .eq("trainer_id", user.id)
    .eq("status", "confirmed")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", in30Days.toISOString())
    .order("starts_at");

  const rows = (bookings ?? []) as unknown as BookingRow[];
  const grouped = groupByDayInCT(rows);

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="section-label mb-3">TRAINER VIEW</p>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            YOUR
            <span className="block gradient-text">SCHEDULE</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
          <p className="text-zinc-500 text-xs mt-4">
            Next 31 days — all times Central
          </p>
        </div>

        {grouped.length === 0 ? (
          <div className="card-modern rounded-2xl p-8 text-center text-zinc-400 text-sm">
            No bookings on the calendar.
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ dayLabel, bookings }) => (
              <div key={dayLabel}>
                <p className="text-[#b07adf] text-[11px] tracking-widest font-bold mb-2 pl-1">
                  {dayLabel.toUpperCase()}
                </p>
                <ul className="card-modern rounded-2xl divide-y divide-white/5">
                  {bookings.map((b) => {
                    const svc = Array.isArray(b.service) ? b.service[0] : b.service;
                    const ath = Array.isArray(b.athlete) ? b.athlete[0] : b.athlete;
                    return (
                      <li key={b.id} className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white text-base font-bold leading-tight">
                            {fmtTime(b.starts_at)}
                            <span className="text-zinc-600 text-xs font-normal">
                              {" "}— {fmtTime(b.ends_at)}
                            </span>
                          </p>
                          <p className="text-zinc-300 text-sm mt-1 truncate">
                            {ath?.first_name} {ath?.last_name}
                            <span className="text-zinc-600"> · {svc?.name}</span>
                          </p>
                          <div className="text-zinc-500 text-xs mt-1 space-x-2">
                            <a href={`mailto:${ath?.email ?? ""}`} className="hover:text-[#b07adf]">
                              {ath?.email}
                            </a>
                            {ath?.phone && (
                              <a href={`tel:${ath.phone}`} className="hover:text-[#b07adf]">
                                · {ath.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/book-v2/dashboard"
            className="text-zinc-500 hover:text-[#b07adf] text-xs tracking-wider"
          >
            ← BACK TO MY DASHBOARD
          </Link>
        </div>
      </section>
    </main>
  );
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function groupByDayInCT(rows: BookingRow[]) {
  const map = new Map<string, { dayLabel: string; bookings: BookingRow[] }>();
  for (const r of rows) {
    const k = dayKey(r.starts_at);
    if (!map.has(k)) {
      map.set(k, { dayLabel: dayLabel(r.starts_at), bookings: [] });
    }
    map.get(k)!.bookings.push(r);
  }
  // Map iteration order = insertion order; bookings are already
  // sorted by starts_at ASC from the query.
  return [...map.values()];
}
