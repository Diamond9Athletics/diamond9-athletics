import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/book/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone")
    .eq("id", user.id)
    .single();

  return (
    <main className="pt-24 bg-[#040200] min-h-screen">
      <section className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="section-label mb-3">ACCOUNT</p>
          <h1 className="font-display text-5xl sm:text-6xl text-white leading-none">
            MY
            <span className="block gradient-text">PROFILE</span>
          </h1>
          <div className="divider-glow max-w-[80px] mx-auto mt-5" />
        </div>

        <ProfileForm
          initial={{
            first_name: profile?.first_name ?? "",
            last_name: profile?.last_name ?? "",
            phone: profile?.phone ?? "",
            email: profile?.email ?? user.email ?? "",
          }}
        />
      </section>
    </main>
  );
}
