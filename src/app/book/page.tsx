import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Session",
  description:
    "Book pitching or hitting sessions with Diamond Nine Athletics. Buy a package, use credits to schedule without paying again.",
};

/**
 * Every BOOK NOW on the site lands here. Signed-in athletes go straight
 * to the calendar; everyone else signs in (or creates an account from the
 * sign-in page) and comes straight back to it.
 */
export default async function BookV2() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(
    user ? "/book/schedule" : `/book/login?next=${encodeURIComponent("/book/schedule")}`,
  );
}
