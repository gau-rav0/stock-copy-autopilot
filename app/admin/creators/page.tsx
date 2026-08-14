import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminCreatorsClient from "./AdminCreatorsClient";
import Link from "next/link";

export default async function AdminCreatorsPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(`/auth?next=${encodeURIComponent("/admin/creators")}`);

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
    .eq("status", "Pending")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl text-paper sm:text-4xl">
          Admin Dashboard: Creator Approvals
        </h1>
        <Link href="/admin/metrics" className="text-sm text-brass hover:underline">
          View real product metrics
        </Link>
      </div>
      <AdminCreatorsClient initialApplications={applications || []} />
    </div>
  );
}
