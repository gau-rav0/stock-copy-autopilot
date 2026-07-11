import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminCreatorsClient from "./AdminCreatorsClient";

export default async function AdminCreatorsPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/api/auth/login"); // or another login route

  // Check admin role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    // If not admin, redirect to home
    return redirect("/");
  }

  // Fetch pending applications
  const { data: applications } = await supabase
    .from("creator_applications")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-display text-3xl text-paper sm:text-4xl">
        Admin Dashboard: Creator Approvals
      </h1>
      <AdminCreatorsClient initialApplications={applications || []} />
    </div>
  );
}
