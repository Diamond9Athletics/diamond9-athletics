/**
 * Browser-side Supabase client.
 * Uses the publishable (anon) key — safe to expose in client JS.
 * Honors row-level security rules in the database.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
