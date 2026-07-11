import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreatorDashboardClient from "./CreatorDashboardClient";

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/api/auth/login"); // or another login route

  // Check if user has a verified creator profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, verified")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile || !profile.verified) {
    // If no profile or not verified, redirect them away
    return redirect("/");
  }

  // Count followers (from followers table)
  const { count: followerCount } = await supabase
    .from("followers")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profile.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-paper sm:text-4xl">
            Welcome back, {profile.display_name}
          </h1>
          <p className="mt-2 text-ink/70">
            You have <strong className="text-paper">{followerCount || 0}</strong> followers eagerly awaiting your next move.
          </p>
        </div>
      </div>
      
      <div className="rounded-xl border border-white/10 bg-surface/50 p-6 sm:p-8">
        <h2 className="mb-6 font-display text-2xl text-paper">Broadcast Conviction Alert</h2>
        <CreatorDashboardClient />
      </div>
    </div>
  );
}
