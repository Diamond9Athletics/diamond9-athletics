import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Diamond Nine Athletics collects, uses, and protects your information on our website and in the D9 mobile app.",
};

const EMAIL = "privacy@diamond9athletics.com";
const LAST_UPDATED = "November 16, 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-white mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return <p className="text-white text-xs font-bold tracking-widest mt-5 mb-2">{children}</p>;
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li>
      <span className="text-white">{label}</span> — {children}
    </li>
  );
}

export default function Privacy() {
  return (
    <main className="pt-24 bg-[#040200]">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.06)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ LEGAL</span>
          <h1 className="font-display text-5xl sm:text-7xl leading-none">
            <span className="text-white">PRIVACY</span>
            <span className="block gradient-text">POLICY</span>
          </h1>
          <div className="divider-glow max-w-[100px] mx-auto mt-5" />
          <p className="text-zinc-500 text-xs tracking-wider mt-5">LAST UPDATED · {LAST_UPDATED.toUpperCase()}</p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="card-modern rounded-2xl p-7 sm:p-10 space-y-8 text-zinc-300 text-sm leading-relaxed">
          <div>
            <p>
              This Privacy Policy explains how Diamond Nine Athletics LLC (&ldquo;Diamond Nine,&rdquo;
              &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and protects
              information when you use our website, diamond9athletics.com, including online booking
              (the &ldquo;Website&rdquo;), and the Diamond Nine Athletics mobile app (the
              &ldquo;App&rdquo;).
            </p>
          </div>

          <Section title="INFORMATION WE COLLECT">
            <Sub>ON THE WEBSITE</Sub>
            <ul className="list-disc pl-5 space-y-2">
              <Item label="Account information">
                the player&rsquo;s name, an email address, a mobile phone number, and a password.
                Passwords are stored in a scrambled form that we can&rsquo;t read.
              </Item>
              <Item label="Family members">
                the names of brothers and sisters you add to your account.
              </Item>
              <Item label="Bookings and purchases">
                the sessions you book, reschedule, or cancel, who your coach is, and the plans and
                memberships you buy, including how many sessions you have left.
              </Item>
              <Item label="Participant Agreement">
                when it was accepted and by whom (the athlete, or a parent or guardian and the name
                they typed), along with the IP address and browser used.
              </Item>
              <Item label="Text reminder choice">
                whether you opted in to text reminders, for which number, when, and the IP address
                used.
              </Item>
              <Item label="Messages to us">
                what you send through our contact form: your name, email, phone number if you give
                it, the plan you&rsquo;re interested in, and your message.
              </Item>
              <Item label="Technical information">
                our hosting provider records basic technical data, such as IP address and browser
                type, to run and secure the Website. Our analytics count page visits without using
                cookies. If a page breaks, we receive an automatic error report about the page and
                the error.
              </Item>
            </ul>
            <p className="mt-3">
              Card details go straight to our payment processor, Stripe. We never see or store your
              card number. See <span className="text-white">Payments</span> below.
            </p>

            <Sub>IN THE APP</Sub>
            <ul className="list-disc pl-5 space-y-2">
              <Item label="Account information">
                name, email address, and password when you create an account.
              </Item>
              <Item label="Training data">
                sessions you log, metrics you record, notes, and any media you upload.
              </Item>
              <Item label="Device information">
                device type, operating system, and basic diagnostic data to help us troubleshoot.
              </Item>
              <Item label="Usage data">
                pages or features accessed within the App, used to improve the experience.
              </Item>
            </ul>
          </Section>

          <Section title="HOW WE USE YOUR INFORMATION">
            <ul className="list-disc pl-5 space-y-2">
              <li>To create and manage your account and the athletes on it.</li>
              <li>
                To book, confirm, change, and remind you about sessions, and to keep track of your
                plans, sessions left, and memberships.
              </li>
              <li>So your coach can reach you about your sessions by phone, text, or email.</li>
              <li>
                To send emails about your account and sessions, such as confirmations, reminders,
                receipts, and password resets, and occasional check-in emails, for example when you
                have sessions to book, sessions about to expire, or it&rsquo;s been a while, or to ask
                for a review. You can turn check-in emails off at any time.
              </li>
              <li>To send text reminders, only if you opt in.</li>
              <li>To keep a record of your Participant Agreement.</li>
              <li>To deliver the App&rsquo;s features, including saving and displaying your training data.</li>
              <li>To answer questions and support requests.</li>
              <li>To keep the Website and App secure, fix problems, and improve them.</li>
            </ul>
          </Section>

          <Section title="SHARING YOUR INFORMATION">
            <p className="mb-3">
              We do not sell your personal information, and we don&rsquo;t share it with advertisers.
              We share it only as needed to run our services:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <Item label="Our coaches and staff">
                Diamond Nine coaches can see the name, contact information, bookings, and
                Participant Agreement status of the athletes they train.
              </Item>
              <Item label="Service providers">
                companies that work on our behalf and may use your information only to provide their
                services to us: Supabase (accounts and data storage), Vercel (website hosting and
                analytics), Stripe (payments), Resend (email delivery), and Twilio (text messages).
              </Item>
              <Item label="Google Calendar">
                if your coach connects their Google Calendar, your booked sessions, including your
                name, email, and phone number, appear on that calendar.
              </Item>
              <Item label="Embedded videos">
                some pages show videos hosted on Google Drive. If you play one, Google may collect
                information under its own privacy policy.
              </Item>
              <Item label="Legal reasons">
                if the law requires it, or to protect the rights, safety, or property of our athletes,
                staff, or others.
              </Item>
            </ul>
          </Section>

          <Section title="PHONE NUMBERS & TEXT MESSAGES">
            <p className="mb-3">
              When you create an account on the Website, we ask for a mobile phone number so your
              coach can reach you about your training sessions, for example if a session has to move.
            </p>
            <p className="mb-3">
              If you opt in to text reminders, we use that number to text you reminders about
              sessions you&rsquo;ve booked, about one message per session. Message and data rates may
              apply. Reply STOP to any message to stop them, or HELP for help. You can also turn text
              reminders off at any time in My Profile. Opting in isn&rsquo;t required to book.
            </p>
            <p>
              No mobile information will be shared with third parties or affiliates for marketing or
              promotional purposes. Text-message opt-in data and consent are not shared with any
              third party, other than the messaging provider that delivers our texts on our behalf.
            </p>
          </Section>

          <Section title="PAYMENTS">
            <p>
              Payments on the Website are processed by Stripe. Your card details go directly to
              Stripe, and we never see or store your full card number. We keep a record of what you
              bought, when, and for how much, along with Stripe&rsquo;s reference numbers for the
              payment. Stripe&rsquo;s handling of your information is covered by Stripe&rsquo;s own
              privacy policy. The App itself is free and does not collect payment information.
            </p>
          </Section>

          <Section title="COOKIES">
            <ul className="list-disc pl-5 space-y-2">
              <li>Sign-in cookies keep you signed in to your account. Booking doesn&rsquo;t work without them.</li>
              <li>Your browser remembers whether you picked the light or dark theme.</li>
              <li>Our analytics count visits without cookies.</li>
              <li>
                We don&rsquo;t use advertising or tracking cookies. Embedded Google Drive videos may set
                Google&rsquo;s own cookies if you play them.
              </li>
            </ul>
          </Section>

          <Section title="DATA RETENTION">
            <p>
              We keep your information while your account is open and as needed to provide our
              services. You can ask us to delete your account at any time by emailing us. We&rsquo;ll
              delete it along with the information tied to it, except records we&rsquo;re required to
              keep for legal, tax, or accounting reasons. Stripe keeps its own payment records under
              its own policy.
            </p>
          </Section>

          <Section title="YOUR CHOICES">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Update your name, phone number, and text reminder setting in{" "}
                <Link href="/book/profile" className="text-[#b07adf] hover:underline">My Profile</Link>,
                and manage the athletes on your account from your dashboard.
              </li>
              <li>Stop text reminders at any time: reply STOP, or turn them off in My Profile.</li>
              <li>
                Turn off check-in emails with the link at the bottom of any check-in email. Emails about
                sessions you&rsquo;ve booked, like confirmations and reminders, are part of the service.
              </li>
              <li>In the App, review and update your account information from within the App.</li>
              <li>Ask for a copy of your information, a correction, or deletion by emailing us.</li>
            </ul>
          </Section>

          <Section title="CHILDREN’S PRIVACY">
            <p>
              Parents and guardians usually set up Website accounts for their players, and a parent or
              guardian must accept the Participant Agreement for any player under 18. The App is
              intended for athletes age 13 and older. We don&rsquo;t knowingly collect personal
              information directly from children under 13. If you believe a child under 13 has given
              us personal information without a parent or guardian, contact us and we&rsquo;ll delete
              it.
            </p>
          </Section>

          <Section title="THIRD-PARTY DATA & TRADEMARKS">
            <p className="mb-3">
              The App is an independent training tool developed by Diamond Nine Athletics LLC and
              is <span className="text-white">not affiliated with, endorsed by, or partnered with</span>{" "}
              Trackman A/S or Rapsodo Inc. When you import a Trackman® or Rapsodo® data export
              into the App, that file is processed only to display analytics back to you; we do not
              send it to those companies or receive anything from them on your behalf.
            </p>
            <p>
              All product and company names, including <span className="text-white">Trackman®</span>{" "}
              and <span className="text-white">Rapsodo®</span>, are trademarks&trade; or registered&reg;
              trademarks of their respective holders. Use of them does not imply any affiliation
              with or endorsement by them.
            </p>
          </Section>

          <Section title="SECURITY">
            <p>
              We use reasonable technical and organizational measures to protect your information,
              including encrypted connections to the Website and limiting who can see account data.
              No method of transmission or storage is completely secure, but we work to safeguard
              your data against unauthorized access.
            </p>
          </Section>

          <Section title="CHANGES TO THIS POLICY">
            <p>
              We may update this Privacy Policy from time to time. If we make significant changes,
              we&rsquo;ll let you know by email or on the Website or App. The &ldquo;Last Updated&rdquo;
              date at the top of this page shows the most recent revision.
            </p>
          </Section>

          <Section title="CONTACT US">
            <p>
              If you have questions about this Privacy Policy or your data, contact us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-[#b07adf] hover:underline">{EMAIL}</a>.
            </p>
          </Section>
        </div>
      </section>
    </main>
  );
}
