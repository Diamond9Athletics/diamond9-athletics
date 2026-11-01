import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParticipantAgreement } from "@/components/ParticipantAgreement";
import { WAIVER_VERSION, hasAcceptedWaiver } from "@/lib/legal/waiver";
import { WaiverAcceptForm } from "./WaiverAcceptForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Participant Agreement" };

// Only allow internal paths so ?next= can't be used as an open redirect.
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/book/dashboard";
  return next;
}

export default async function WaiverPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/book/login?next=${encodeURIComponent(`/book/waiver?next=${next}`)}`);
  }
  if (hasAcceptedWaiver(user)) redirect(next);

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();
  const athleteName =
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "this athlete";

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <span className="badge-amber mb-4 inline-flex">◆ ONE QUICK STEP</span>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            BEFORE YOU
            <span className="block gradient-text">TRAIN</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
          <p className="text-zinc-400 text-sm mt-5 max-w-md mx-auto">
            Read and accept D9&rsquo;s Participant Agreement. You only need to do this once.
          </p>
        </div>

        <div className="card-modern rounded-2xl p-5 sm:p-7">
          <div
            className="max-h-[50vh] overflow-y-auto pr-3"
            tabIndex={0}
            aria-label="Participant Agreement full text"
          >
            <ParticipantAgreement />
          </div>
          <p className="text-zinc-500 text-[11px] mt-4 pt-3 border-t border-white/5">
            Scroll to read the full agreement, or{" "}
            <Link href="/waiver" target="_blank" className="text-[#b07adf] hover:underline">
              open it on its own page
            </Link>
            .
          </p>
        </div>

        <WaiverAcceptForm athleteName={athleteName} version={WAIVER_VERSION} next={next} />
      </section>
    </main>
  );
}
