import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadOwnerNumbers, type Members, type Revenue } from "@/lib/owner-numbers";
import { BusiestTimes, StackedColumns, type Column } from "./charts";
import { hourLabel, hours, money } from "./format";

export const dynamic = "force-dynamic";
export const metadata = { title: "The numbers" };

const PURPLE = "var(--viz-series-1)";
const ORANGE = "var(--viz-series-2)";

const longDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export default async function NumbersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/book/login");
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
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

  const n = await loadOwnerNumbers(createAdminClient());
  const revenue = "error" in n.revenue ? null : (n.revenue as Revenue);
  const members = "error" in n.members ? null : (n.members as Members);
  const thisWeek = n.sessions.find((w) => w.when === "this");
  const nextWeek = n.sessions.find((w) => w.when === "next");
  const weekTotal = (w?: { pitching: number; hitting: number }) => (w ? w.pitching + w.hitting : 0);
  const pastWeeks = n.sessions.filter((w) => w.when === "past");
  const bestWeek = pastWeeks.reduce((best, w) => (weekTotal(w) > weekTotal(best) ? w : best), pastWeeks[0]);
  const dayOfMonth = Number(n.today.slice(8, 10));

  const revenueColumns: Column[] = (revenue?.months ?? []).map((m, i, all) => {
    const best = all.reduce((b, x) => (x.memberships + x.packages > b.memberships + b.packages ? x : b), all[0]);
    return {
      key: m.key,
      label: m.label,
      title: m.partial ? `${m.label} so far` : m.label,
      values: { memberships: m.memberships, packages: m.packages },
      partial: m.partial,
      showTotal: m.partial || m.key === best.key || i === all.length - 2,
    };
  });
  const refunds = (revenue?.months ?? []).reduce((total, m) => total + m.refunds, 0);
  const lastMonthName = revenue?.months[revenue.months.length - 2]?.label ?? "Last month";

  const sessionColumns: Column[] = n.sessions.map((w) => ({
    key: w.weekStart,
    label: w.label,
    title: w.when === "this" ? `This week (Mon ${w.label})` : w.when === "next" ? `Next week (Mon ${w.label})` : `Week of ${w.label}`,
    values: { pitching: w.pitching, hitting: w.hitting },
    partial: w.when !== "past",
    showTotal: w.when !== "past" || w.weekStart === bestWeek?.weekStart,
  }));

  const firstPast = pastWeeks[0];
  const lastPast = pastWeeks[pastWeeks.length - 1];

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="viz-root max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <p className="section-label mb-3">ADMIN</p>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            THE <span className="gradient-text">NUMBERS</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
          <p className="text-zinc-500 text-xs mt-4">
            As of {longDate(n.today)} · Central time ·{" "}
            <Link href="/book/admin" className="text-[#b07adf] hover:underline">
              Back to the Control Room
            </Link>
          </p>
        </div>

        {/* The headline numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Tile
            label="Money in this month"
            value={revenue ? money(revenue.thisMonthToDate) : "—"}
            sub={
              revenue
                ? `${lastMonthName} had ${money(revenue.lastMonthToDate)} by the ${ordinal(dayOfMonth)}`
                : "Stripe didn’t answer. Reload to try again."
            }
          />
          <Tile
            label="Diamond members"
            value={members ? String(members.active) : "—"}
            sub={
              members
                ? `${money(members.monthlyIncome)} a month · ${members.cancelling.length} cancelling`
                : "Stripe didn’t answer. Reload to try again."
            }
          />
          <Tile
            label="Sessions this week"
            value={String(weekTotal(thisWeek))}
            sub={`${weekTotal(nextWeek)} booked for next week so far`}
          />
          <Tile
            label="Paid for, not used"
            value={`${n.unused.sessions} session${n.unused.sessions === 1 ? "" : "s"}`}
            sub={`About ${money(n.unused.valueCents)} across ${n.unused.accounts} account${n.unused.accounts === 1 ? "" : "s"}`}
          />
        </div>

        {/* Money */}
        <Card title="Money in, last 6 months" note="From Stripe, before Stripe’s fees. Hover a month for the split.">
          {revenue ? (
            <>
              <StackedColumns
                label="Money in by month: memberships and packages"
                unit="money"
                series={[
                  { key: "memberships", label: "Diamond memberships", color: PURPLE },
                  { key: "packages", label: "Packages and sessions", color: ORANGE },
                ]}
                columns={revenueColumns}
                partialNote="This month so far"
              />
              <p className="text-zinc-500 text-xs mt-4">
                Refunds over these 6 months: <span className="text-zinc-300">{money(refunds)}</span>
                {refunds > 0 ? " (taken out in the table below)" : ""}.
              </p>
              <TableView summary="Show the numbers">
                <thead>
                  <tr>
                    <Th>Month</Th>
                    <Th right>Memberships</Th>
                    <Th right>Packages</Th>
                    <Th right>Refunds</Th>
                    <Th right>After refunds</Th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.months.map((m) => (
                    <tr key={m.key}>
                      <Td>{m.partial ? `${m.label} (so far)` : m.label}</Td>
                      <Td right>{money(m.memberships)}</Td>
                      <Td right>{money(m.packages)}</Td>
                      <Td right>{m.refunds ? `−${money(m.refunds)}` : "—"}</Td>
                      <Td right strong>{money(m.memberships + m.packages - m.refunds)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableView>
            </>
          ) : (
            <Problem what="the money numbers" />
          )}
        </Card>

        {/* Sessions */}
        <Card
          title="Sessions per week"
          note="Booked sessions, Monday to Sunday. This week and next week show what's booked so far."
        >
          <StackedColumns
            label="Sessions per week: pitching and hitting"
            unit="count"
            series={[
              { key: "pitching", label: "Pitching", color: PURPLE },
              { key: "hitting", label: "Hitting", color: ORANGE },
            ]}
            columns={sessionColumns}
            partialNote="Booked so far"
          />
          <TableView summary="Show the numbers">
            <thead>
              <tr>
                <Th>Week of</Th>
                <Th right>Pitching</Th>
                <Th right>Hitting</Th>
                <Th right>Total</Th>
              </tr>
            </thead>
            <tbody>
              {n.sessions.map((w) => (
                <tr key={w.weekStart}>
                  <Td>
                    {w.label}
                    {w.when === "this" ? " (this week)" : w.when === "next" ? " (next week)" : ""}
                  </Td>
                  <Td right>{w.pitching}</Td>
                  <Td right>{w.hitting}</Td>
                  <Td right strong>{w.pitching + w.hitting}</Td>
                </tr>
              ))}
            </tbody>
          </TableView>
        </Card>

        {/* Hours */}
        <Card
          title="How full your hours are"
          note="Booked hours out of each coach’s open hours (weekly hours minus time off). Two pitchers in the same hour count as one booked hour."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {n.fill.map((coach) => (
              <div key={coach.name}>
                <p className="text-white text-sm font-semibold mb-3">{coach.name}</p>
                <div className="space-y-3">
                  {coach.weeks.map((w) => (
                    <Meter key={w.label} label={w.label} booked={w.bookedHours} open={w.openHours} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 mt-7 pt-6">
            <p className="text-white text-sm font-semibold mb-1">Busiest times</p>
            <p className="text-zinc-500 text-xs mb-4">
              When sessions started over the last {n.busiest.weeks} weeks
              {firstPast && lastPast ? ` (${firstPast.label} to the week of ${lastPast.label})` : ""}, all coaches.
            </p>
            <BusiestTimes {...n.busiest} />
            <TableView summary="Show the numbers">
              <thead>
                <tr>
                  <Th>Start</Th>
                  {n.busiest.days.map((d) => (
                    <Th key={d} right>
                      {d}
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {n.busiest.hours.map((h, i) => (
                  <tr key={h}>
                    <Td>{hourLabel(h)}</Td>
                    {n.busiest.days.map((d, day) => (
                      <Td key={d} right>
                        {n.busiest.counts[day][i] || "·"}
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </TableView>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Members */}
          <Card title="Diamond members" note="Live from Stripe." flush>
            {members ? (
              <>
                <dl className="grid grid-cols-3 gap-3 mb-5">
                  <Fact label="Active" value={String(members.active)} />
                  <Fact label="New this month" value={String(members.startedThisMonth)} />
                  <Fact label="Ended this month" value={String(members.endedThisMonth)} />
                </dl>
                <p className="text-zinc-400 text-[10px] tracking-widest font-bold mb-2">CANCELLING</p>
                {members.cancelling.length === 0 ? (
                  <p className="text-zinc-500 text-sm mb-4">Nobody has cancelled.</p>
                ) : (
                  <ul className="mb-4 space-y-1.5">
                    {members.cancelling.map((c) => (
                      <li key={`${c.name}-${c.endsOn}`} className="flex justify-between gap-3 text-sm">
                        <span className="text-white truncate">{c.name}</span>
                        <span className="text-zinc-500 shrink-0">{c.endsOn ? `ends ${longDate(c.endsOn)}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <details className="group">
                  <summary className="cursor-pointer text-[#b07adf] text-xs font-bold tracking-wider list-none">
                    ALL {members.active} MEMBERS <span className="group-open:hidden">▾</span>
                    <span className="hidden group-open:inline">▴</span>
                  </summary>
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {members.names.map((name, i) => (
                      <li key={`${name}-${i}`} className="text-zinc-300 text-sm truncate">
                        {name}
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <Problem what="the membership numbers" />
            )}
          </Card>

          {/* Unused sessions */}
          <Card title="Sessions paid for, not used yet" note="Package credits still on accounts." flush>
            <dl className="grid grid-cols-3 gap-3 mb-5">
              <Fact label="Pitching" value={String(n.unused.pitching)} />
              <Fact label="Hitting" value={String(n.unused.hitting)} />
              <Fact label="31 days not started" value={String(n.unused.notStarted)} />
            </dl>
            <p className="text-zinc-400 text-[10px] tracking-widest font-bold mb-2">EXPIRING IN THE NEXT 7 DAYS</p>
            {n.unused.expiringSoon.length === 0 ? (
              <p className="text-zinc-500 text-sm">None.</p>
            ) : (
              <ul className="space-y-1.5">
                {n.unused.expiringSoon.map((e) => (
                  <li key={`${e.name}-${e.expiresOn}`} className="flex justify-between gap-3 text-sm">
                    <span className="text-white truncate">{e.name}</span>
                    <span className="text-zinc-500 shrink-0">
                      {e.sessions} session{e.sessions === 1 ? "" : "s"} · {longDate(e.expiresOn)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-zinc-600 text-xs mt-4">
              {n.signupsThisMonth} new sign-up{n.signupsThisMonth === 1 ? "" : "s"} this month.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-modern rounded-2xl p-4 sm:p-5">
      <p className="text-zinc-500 text-xs mb-2">{label}</p>
      <p className="text-white text-2xl sm:text-3xl font-semibold leading-tight mb-1">{value}</p>
      <p className="text-zinc-500 text-[11px] leading-snug">{sub}</p>
    </div>
  );
}

function Card({
  title,
  note,
  children,
  flush = false,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <div className={`card-modern rounded-2xl p-5 sm:p-7 ${flush ? "" : "mb-6"}`}>
      <h2 className="text-white text-base font-semibold">{title}</h2>
      {note && <p className="text-zinc-500 text-xs mt-1 mb-5">{note}</p>}
      {!note && <div className="mb-5" />}
      {children}
    </div>
  );
}

function Meter({ label, booked, open }: { label: string; booked: number; open: number }) {
  const pct = open > 0 ? Math.min(100, Math.round((booked / open) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500 text-right">
          {open > 0 ? (
            <>
              <span className="text-white font-semibold">{hours(booked)}</span> of {hours(open)} open hours · {pct}%
            </>
          ) : (
            "No open hours"
          )}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "var(--viz-track)" }}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${label}: ${pct}% of open hours booked`}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--viz-series-1)" }} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500 text-[11px] leading-tight mb-1">{label}</dt>
      <dd className="text-white text-xl font-semibold">{value}</dd>
    </div>
  );
}

function TableView({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-[#b07adf] text-xs font-bold tracking-wider">{summary.toUpperCase()}</summary>
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm tabular-nums">{children}</table>
      </div>
    </details>
  );
}

function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`text-zinc-500 text-[11px] font-semibold py-1.5 px-2 border-b border-zinc-800 ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({ children, right = false, strong = false }: { children: React.ReactNode; right?: boolean; strong?: boolean }) {
  return (
    <td
      className={`py-1.5 px-2 border-b border-zinc-800/60 whitespace-nowrap ${right ? "text-right" : "text-left"} ${
        strong ? "text-white font-semibold" : "text-zinc-300"
      }`}
    >
      {children}
    </td>
  );
}

function Problem({ what }: { what: string }) {
  return (
    <p className="text-zinc-400 text-sm">
      Stripe didn&rsquo;t answer, so {what} couldn&rsquo;t load. Reload the page to try again.
    </p>
  );
}
