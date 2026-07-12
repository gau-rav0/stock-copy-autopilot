import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreatorDashboardClient from "./CreatorDashboardClient";

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  if (!supabase) return redirect("/");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth");

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

  // Fetch their portfolio ID to get history
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("profile_id", profile.id)
    .limit(1)
    .single();

  // Fetch recent alerts
  const { data: recentAlerts } = portfolio
    ? await supabase
        .from("transactions")
        .select("*")
        .eq("portfolio_id", portfolio.id)
        .eq("is_conviction_alert", true)
        .order("transaction_date", { ascending: false })
        .limit(10)
    : { data: [] };

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
      
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-surface/50 p-6 sm:p-8">
          <h2 className="mb-6 font-display text-2xl text-paper">Broadcast Conviction Alert</h2>
          <CreatorDashboardClient />
        </div>

        <div className="rounded-xl border border-white/10 bg-surface/50 p-6 sm:p-8">
          <h2 className="mb-6 font-display text-2xl text-paper">Past Alerts</h2>
          {recentAlerts && recentAlerts.length > 0 ? (
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-paper">{alert.ticker}</span>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${
                        ["buy", "add"].includes(alert.action) ? "border-gain/30 text-gain" : "border-loss/30 text-loss"
                      }`}>
                      {alert.action}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-paper-muted">
                    <span>Before: {alert.allocation_before}%</span>
                    <span>After: {alert.allocation_after}%</span>
                  </div>
                  {alert.alert_text && (
                    <p className="mt-3 text-xs leading-5 text-paper-muted">{alert.alert_text}</p>
                  )}
                  <div className="mt-3 text-right font-mono text-[10px] text-paper-muted">
                    {alert.transaction_date}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-paper-muted">No alerts broadcasted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
