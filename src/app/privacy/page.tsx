import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Diamond Nine Athletics",
  description: "Privacy policy for the Diamond Nine Athletics mobile app.",
};

const EMAIL = "diamondnineathletics@gmail.com";
const LAST_UPDATED = "May 13, 2026";

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
              This Privacy Policy describes how Diamond Nine Athletics (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) collects, uses, and protects information when you use the Diamond Nine
              Athletics mobile application (the &ldquo;App&rdquo;).
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">INFORMATION WE COLLECT</h2>
            <p className="mb-3">We collect the following types of information when you use the App:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><span className="text-white">Account information</span> — name, email address, and password when you create an account.</li>
              <li><span className="text-white">Training data</span> — sessions you log, metrics you record, notes, and any media you upload.</li>
              <li><span className="text-white">Device information</span> — device type, operating system, and basic diagnostic data to help us troubleshoot.</li>
              <li><span className="text-white">Usage data</span> — pages or features accessed within the App, used to improve the experience.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">HOW WE USE YOUR INFORMATION</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To create and manage your account.</li>
              <li>To deliver the core features of the App, including saving and displaying your training data.</li>
              <li>To respond to support requests and communicate with you about the App.</li>
              <li>To diagnose issues, improve performance, and develop new features.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">SHARING YOUR INFORMATION</h2>
            <p>
              We do not sell your personal information. We may share limited information with service
              providers who help us operate the App (for example, hosting and analytics providers),
              and only to the extent necessary for them to perform their services. We may also disclose
              information if required by law.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">PAYMENTS</h2>
            <p>
              All subscription payments for the App are processed through Apple&rsquo;s App Store.
              We do not collect or store your credit card or other payment information. Apple
              handles all billing and payment processing under Apple&rsquo;s own privacy practices.
              Apple may share limited transaction information with us (such as a receipt token or
              transaction identifier) so that we can validate your purchase and activate your
              subscription within the App.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">DATA RETENTION</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide
              the App. You may request deletion of your account and associated data at any time by
              contacting us at the email below.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">YOUR CHOICES</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You can review and update your account information from within the App.</li>
              <li>You can request a copy of your data, or that we delete it, by emailing us.</li>
              <li>You can opt out of non-essential communications at any time.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">CHILDREN&rsquo;S PRIVACY</h2>
            <p>
              The App is intended for athletes age 13 and older. If you believe a child under 13 has
              provided personal information to us, please contact us so we can remove it.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">SECURITY</h2>
            <p>
              We use reasonable technical and organizational measures to protect your information.
              No method of transmission or storage is completely secure, but we work to safeguard
              your data against unauthorized access.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">CHANGES TO THIS POLICY</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make significant changes,
              we will notify you within the App or via email. The &ldquo;Last Updated&rdquo; date at
              the top of this page reflects the most recent revision.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">CONTACT US</h2>
            <p>
              If you have questions about this Privacy Policy or your data, contact us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-[#b07adf] hover:underline">{EMAIL}</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
