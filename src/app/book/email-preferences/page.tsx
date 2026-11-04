import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { validPreferencesToken } from "@/lib/checkins";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Email Preferences",
};

/** Where the "Turn them off" link in a check-in email lands. No sign-in
 *  needed — the link carries a token for that one account. */
export default async function EmailPreferences({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; t?: string; saved?: string }>;
}) {
  const { u = "", t = "", saved } = await searchParams;
  const valid = /^[0-9a-f-]{36}$/i.test(u) && validPreferencesToken(u, t);
  let off = false;
  if (valid) {
    const { data } = await createAdminClient().auth.admin.getUserById(u);
    off = data?.user?.app_metadata?.checkins_off === true;
  }

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <span className="badge-amber mb-4 inline-flex">◆ EMAIL PREFERENCES</span>
          <h1 className="font-display text-5xl text-white leading-none">CHECK-IN EMAILS</h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
        </div>

        <div className="card-modern rounded-2xl p-6 sm:p-8 space-y-5">
          {!valid ? (
            <p className="text-zinc-300 text-sm leading-relaxed">
              This link isn&rsquo;t valid. Reply to any of our emails and we&rsquo;ll sort it out.
            </p>
          ) : (
            <>
              {saved && (
                <p className="text-emerald-300 text-xs bg-emerald-950/30 border border-emerald-900/40 rounded-lg px-3 py-2">
                  Saved.
                </p>
              )}
              <p className="text-zinc-300 text-sm leading-relaxed">
                {off
                  ? "Check-in emails are off. You won't get notes about sessions to book or expiring credits."
                  : "You're getting check-in emails: a short note from Wes when you have sessions to book, credits about to expire, or it's been a while."}
              </p>
              <form method="post" action="/api/checkins/preferences">
                <input type="hidden" name="u" value={u} />
                <input type="hidden" name="t" value={t} />
                <input type="hidden" name="off" value={off ? "0" : "1"} />
                <button
                  type="submit"
                  className={`${off ? "btn-gold" : "btn-outline"} w-full py-3.5 rounded-full text-xs tracking-widest font-black`}
                >
                  {off ? "TURN THEM BACK ON" : "TURN OFF CHECK-IN EMAILS"}
                </button>
              </form>
              <p className="text-zinc-500 text-xs">
                Booking confirmations, reminders and receipts still come either way.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          <Link href="/" className="text-[#b07adf] hover:underline">
            Back to Diamond Nine Athletics
          </Link>
        </p>
      </section>
    </main>
  );
}
