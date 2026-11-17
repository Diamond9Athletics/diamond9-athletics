import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { FREE_CANCEL_HOURS, MIN_BOOKING_LEAD_HOURS } from "@/lib/booking/policy";
import { BOOKING_WINDOW_DAYS, MAX_REPEAT_WEEKS } from "@/lib/booking/repeat";
import { CATEGORY_CAPACITY } from "@/lib/booking/slots";
import { smsConfigured } from "@/lib/sms";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers for parents and players: booking, cancelling, plans, memberships, and what to expect at Diamond Nine Athletics in Austin, TX.",
};

type Item = { q: string; a: ReactNode };

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="text-[#b07adf] hover:underline">
    {children}
  </Link>
);

function sections(): { title: string; items: Item[] }[] {
  return [
    {
      title: "BOOKING",
      items: [
        {
          q: "How do I book a session?",
          a: (
            <>
              Create an account, then buy a plan or a single session from{" "}
              <A href="/pitching-plans">Pitching Plans</A> or <A href="/hitting-plans">Hitting Plans</A>.
              After that, pick a day and time on the <A href="/book">booking page</A>. You&rsquo;ll get
              a confirmation email with a calendar invite.
            </>
          ),
        },
        {
          q: "How far ahead do I need to book?",
          a: `At least ${MIN_BOOKING_LEAD_HOURS} hours before the session starts, and up to ${BOOKING_WINDOW_DAYS} days out.`,
        },
        {
          q: "Can I book the same time every week?",
          a: `Yes. When you book, you can repeat the same day and time for up to ${MAX_REPEAT_WEEKS} weeks in a row. Each week counts as its own session.`,
        },
        {
          q: "Can I book for more than one player?",
          a: (
            <>
              Yes. Add brothers and sisters to your account from your{" "}
              <A href="/book/dashboard">dashboard</A>, then choose who each session is for when you
              book. Sessions you buy can be used by anyone on the account.
            </>
          ),
        },
        {
          q: "Will my player train alone or with others?",
          a: `Hitting sessions are one-on-one. Pitching sessions can have up to ${CATEGORY_CAPACITY.pitching} athletes throwing side by side, and a player’s first pitching session is always one-on-one.`,
        },
        {
          q: "Who should the account be under?",
          a: "The player. Parents, enter your player’s name when you sign up, and use the email and phone number you want reminders sent to.",
        },
      ],
    },
    {
      title: "CANCELLING & RESCHEDULING",
      items: [
        {
          q: "How do I cancel or reschedule?",
          a: (
            <>
              From your <A href="/book/dashboard">dashboard</A>. It&rsquo;s free up to{" "}
              {FREE_CANCEL_HOURS} hours before the session starts.
            </>
          ),
        },
        {
          q: `What if I cancel with less than ${FREE_CANCEL_HOURS} hours’ notice?`,
          a: (
            <>
              It counts as a used session: a plan session isn&rsquo;t given back, and for Diamond
              members it counts toward the month. We can make exceptions, so{" "}
              <A href="/contact">reach out</A> if something comes up.
            </>
          ),
        },
      ],
    },
    {
      title: "PLANS & PAYMENT",
      items: [
        {
          q: "How long are sessions?",
          a: "Sessions in our plans are 60 minutes.",
        },
        {
          q: "When do plan sessions expire?",
          a: "31 days after your first scheduled session from that plan, so plan to use them within the month.",
        },
        {
          q: "How does the Diamond pitching membership work?",
          a: (
            <>
              It&rsquo;s $350 a month for unlimited pitching sessions, plus a personal throwing plan,
              plyo and weighted-ball work, and full D9 app access. A membership covers one athlete;
              everyone else on the account can still buy sessions. Cancel anytime from your
              dashboard and you keep access through the end of the month you paid for.{" "}
              <A href="/pitching-plans">See the plans</A>.
            </>
          ),
        },
        {
          q: "How do I pay?",
          a: "By card, online at checkout. Payments are handled by Stripe, so we never see or store your card number.",
        },
      ],
    },
    {
      title: "BEFORE YOUR FIRST SESSION",
      items: [
        {
          q: "Is there a waiver?",
          a: (
            <>
              Yes, the <A href="/waiver">Participant Agreement</A>. The site asks for it before your
              first booking, and a parent or guardian accepts it for players under 18.
            </>
          ),
        },
        {
          q: "Will I get a reminder?",
          a: smsConfigured()
            ? "Yes. You’ll get an email the day before each session, and a text too if you turn on text reminders in My Profile."
            : "Yes. You’ll get an email the day before each session.",
        },
      ],
    },
    {
      title: "CONTACT & THE APP",
      items: [
        {
          q: "How do I reach you?",
          a: (
            <>
              Use the <A href="/contact">contact form</A>, email info@diamond9athletics.com, or message
              us on Instagram at @diamond9atx.
            </>
          ),
        },
        {
          q: "What is the D9 app?",
          a: (
            <>
              Our training app for athletes and coaches. See the <A href="/app">D9 App</A> page, or{" "}
              <A href="/support">App Support</A> if you need help with it.
            </>
          ),
        },
      ],
    },
  ];
}

export default function Faq() {
  return (
    <main className="pt-24 bg-[#040200]">
      <PageHero
        badge="◆ QUESTIONS"
        title="FREQUENTLY"
        accent="ASKED"
        subtitle="Booking, plans, and what to expect."
      />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 space-y-10">
        {sections().map((section) => (
          <div key={section.title}>
            <p className="section-label mb-4">{section.title}</p>
            <div className="space-y-3">
              {section.items.map((item) => (
                <details key={item.q} className="faq card-modern rounded-2xl group">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 sm:px-6 py-4 text-white text-sm sm:text-base font-semibold">
                    {item.q}
                    <svg
                      className="w-4 h-4 text-[#b07adf] shrink-0 transition-transform duration-200 group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 -mt-1 text-zinc-400 text-sm leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}

        <div className="card-modern-amber rounded-2xl p-6 sm:p-8 text-center">
          <p className="section-label mb-2">STILL HAVE A QUESTION?</p>
          <p className="text-zinc-400 text-sm mb-5">We&rsquo;re happy to help.</p>
          <Link href="/contact" className="btn-gold px-8 py-3 rounded-full text-xs tracking-widest font-black inline-block">
            CONTACT US
          </Link>
        </div>
      </section>

      {/* Safari still shows its own triangle on <summary> without this. */}
      <style>{`.faq summary::-webkit-details-marker { display: none; }`}</style>
    </main>
  );
}
