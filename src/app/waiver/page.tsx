import type { Metadata } from "next";
import { ParticipantAgreement } from "@/components/ParticipantAgreement";

export const metadata: Metadata = {
  title: "Participant Agreement",
  description:
    "Diamond Nine Athletics participant agreement: assumption of risk, release of liability, and equipment responsibility.",
};

const EMAIL = "support@diamond9athletics.com";

export default function WaiverPublicPage() {
  return (
    <main className="pt-24 bg-[#040200]">
      <section className="relative pt-16 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.06)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ LEGAL</span>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto">
            Every athlete (or a parent or guardian, for athletes under 18) accepts this
            agreement online before their first session.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="card-modern rounded-2xl p-7 sm:p-10">
          <ParticipantAgreement />
        </div>
        <p className="text-center text-zinc-500 text-xs mt-6">
          Questions about this agreement? Email{" "}
          <a href={`mailto:${EMAIL}`} className="text-[#b07adf] hover:underline">
            {EMAIL}
          </a>
          .
        </p>
      </section>
    </main>
  );
}
