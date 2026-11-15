import type { SupabaseClient } from "@supabase/supabase-js";

/** Coaches and admins. */
export async function isStaff(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("is_trainer, is_admin")
    .eq("id", userId)
    .single();
  return Boolean(data?.is_trainer || data?.is_admin);
}
