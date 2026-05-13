import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Diamond Nine Athletics",
  description: "Terms of service for the Diamond Nine Athletics mobile app.",
};

const EMAIL = "diamondnineathletics@gmail.com";
const LAST_UPDATED = "May 13, 2026";
const PRICE = "$9.99 USD";
const PERIOD = "month";

export default function Terms() {
  return (
    <main className="pt-24 bg-[#040200]">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(153,84,210,0.06)_0%,transparent_100%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="badge-amber mb-5 inline-flex">◆ LEGAL</span>
          <h1 className="font-display text-5xl sm:text-7xl leading-none">
            <span className="text-white">TERMS OF</span>
            <span className="block gradient-text">SERVICE</span>
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
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the Diamond Nine Athletics
              mobile application (the &ldquo;App&rdquo;) provided by Diamond Nine Athletics
              (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By downloading or using the App,
              you agree to these Terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">USE OF THE APP</h2>
            <p>
              You agree to use the App only for lawful purposes and in accordance with these Terms.
              You are responsible for any activity that occurs under your account and for keeping
              your login credentials secure.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">ACCOUNTS</h2>
            <p>
              To access certain features, you may need to create an account. You agree to provide
              accurate information and to keep it up to date. We reserve the right to suspend or
              terminate accounts that violate these Terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">SUBSCRIPTION &amp; BILLING</h2>
            <p className="mb-3">
              The App offers an auto-renewable subscription at <span className="text-white">{PRICE} per {PERIOD}</span>.
              All purchases and renewals are processed through Apple&rsquo;s App Store and are governed
              by your Apple ID account.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Payment will be charged to your Apple ID account at confirmation of purchase.</li>
              <li>
                Your subscription automatically renews for the same period unless auto-renew is turned
                off at least 24 hours before the end of the current period.
              </li>
              <li>
                Your account will be charged for renewal within 24 hours prior to the end of the
                current period at the cost of the chosen subscription.
              </li>
              <li>
                You can manage your subscription and turn off auto-renewal at any time by going to
                your Apple ID account settings after purchase.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">CANCELLATION</h2>
            <p>
              You can cancel your subscription at any time through your Apple ID account settings.
              Cancellation takes effect at the end of the current billing period — you will continue
              to have access to subscription features until that date. Uninstalling the App does not
              cancel your subscription.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">REFUNDS</h2>
            <p>
              Refunds for subscriptions purchased through the App Store are handled by Apple, not by
              Diamond Nine Athletics. To request a refund, please visit{" "}
              <a href="https://reportaproblem.apple.com" target="_blank" rel="noopener noreferrer" className="text-[#b07adf] hover:underline">
                reportaproblem.apple.com
              </a>
              . Apple&rsquo;s refund decisions are made at Apple&rsquo;s sole discretion.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">PRICE CHANGES</h2>
            <p>
              We may change subscription prices from time to time. If we increase the price of your
              subscription, we will notify you in advance through the App or by email. Any price
              change will take effect at the start of the next subscription period following the
              notice. If you do not agree to the new price, you may cancel your subscription before
              it renews.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">CONTENT &amp; INTELLECTUAL PROPERTY</h2>
            <p>
              All content provided through the App, including text, graphics, training plans, and
              videos, is owned by Diamond Nine Athletics or its licensors and is protected by
              intellectual property laws. You may not copy, distribute, or create derivative works
              without our written permission.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">DISCLAIMER</h2>
            <p>
              The App is provided on an &ldquo;as is&rdquo; basis. Training content is for general
              informational purposes and is not a substitute for medical advice. Consult a qualified
              healthcare or training professional before beginning any new program. You assume all
              risk associated with physical training.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">LIMITATION OF LIABILITY</h2>
            <p>
              To the maximum extent permitted by law, Diamond Nine Athletics shall not be liable for
              any indirect, incidental, special, or consequential damages arising out of or related
              to your use of the App.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">CHANGES TO THESE TERMS</h2>
            <p>
              We may update these Terms from time to time. If we make significant changes, we will
              notify you within the App or via email. Your continued use of the App after the changes
              take effect constitutes acceptance of the updated Terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-white mb-3">CONTACT</h2>
            <p>
              If you have questions about these Terms, contact us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-[#b07adf] hover:underline">{EMAIL}</a>.
              See also our{" "}
              <Link href="/privacy" className="text-[#b07adf] hover:underline">Privacy Policy</Link>.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
