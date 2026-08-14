import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Bell, UserCircle2, ArrowRight, TrendingUp } from "lucide-react";
import BrokerConnectionPanel from "@/components/BrokerConnectionPanel";
import NotificationPreferences from "@/components/NotificationPreferences";
import PortfolioImportPanel from "@/components/PortfolioImportPanel";

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Your followed investors and their latest conviction alerts.",
};

type FollowedInvestor = {
  profile_id: string;
  profiles: {
    slug: string;
    display_name: string;
    bio: string | null;
    verification_tier: string;
    verified: boolean;
    cagr: number;
    follower_count: number;
  };
};

type ConvictionAlert = {
  ticker: string;
  action: string;
  alert_text: string | null;
  transaction_date: string;
  profiles: { display_name: string; slug: string } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) return redirect(`/auth?next=${encodeURIComponent("/dashboard")}`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect(`/auth?next=${encodeURIComponent("/dashboard")}`);

  // Fetch followed investors with their profile details
  const { data: follows } = await supabase
    .from("followers")
    .select(
      "profile_id, profiles!inner(slug, display_name, bio, verification_tier, verified, cagr, follower_count)"
    )
    .eq("follower_user_id", user.id)
    .order("created_at", { ascending: false });

  const followed = (follows ?? []) as unknown as FollowedInvestor[];
  const followedProfileIds = followed.map((f) => f.profile_id);

  // Fetch latest conviction alerts from followed investors
  const { data: alerts } = followedProfileIds.length
    ? await supabase
        .from("transactions")
        .select(
          "ticker, action, alert_text, transaction_date, portfolios!inner(profile_id, profiles!inner(display_name, slug))"
        )
        .in("portfolios.profile_id", followedProfileIds)
        .eq("is_conviction_alert", true)
        .order("transaction_date", { ascending: false })
        .limit(20)
    : { data: [] };

  const recentAlerts = (alerts ?? []) as unknown as ConvictionAlert[];

  const ACTION_COLOR: Record<string, string> = {
    buy: "text-gain",
    add: "text-gain",
    reduce: "text-loss",
    exit: "text-loss",
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="border-b border-ink-hairline pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">My account</p>
        <h1 className="mt-3 font-display text-3xl text-paper sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-paper-muted">
          {user.email} · {followed.length} investor{followed.length !== 1 ? "s" : ""} followed
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* Left: followed investors */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl text-paper">
              <UserCircle2 size={20} className="text-brass" />
              Following
            </h2>
            <Link href="/explore" className="text-sm text-brass hover:underline">
              Find more
            </Link>
          </div>

          {followed.length === 0 ? (
            <div className="mt-6 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-8 text-center backdrop-blur">
              <p className="text-paper-muted">You're not following anyone yet.</p>
              <Link
                href="/explore"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brass px-5 py-2 text-sm font-semibold text-white hover:bg-brass-bright"
              >
                Browse investors <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {followed.map((f) => {
                const p = f.profiles;
                const initials = p.display_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2);
                return (
                  <Link
                    key={f.profile_id}
                    href={`/investor/${p.slug}`}
                    className="flex items-center gap-4 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 backdrop-blur transition hover:border-brass/35 hover:shadow-[0_0_40px_rgba(0,157,85,.07)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brass/30 bg-brass/10 font-mono text-xs text-brass">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-paper">{p.display_name}</p>
                      <p className="truncate text-xs text-paper-muted">{p.bio}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-gain">
                        {p.cagr >= 0 ? "+" : ""}
                        {p.cagr}%
                      </p>
                      <p className="text-xs text-paper-muted">CAGR</p>
                    </div>
                    <ArrowRight size={16} className="shrink-0 text-paper-muted" />
                  </Link>
                );
              })}
            </div>
          )}

          {followed.length === 0 && (
            <div className="mt-8 rounded-lg border border-brass/20 bg-brass/[.04] p-5">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-brass" />
                <p className="text-sm font-medium text-paper">Get started</p>
              </div>
              <p className="mt-2 text-sm text-paper-muted">
                Follow investors with verified track records to receive read-only conviction alerts
                whenever they make a significant portfolio move.
              </p>
            </div>
          )}
        </div>

        {/* Right: conviction alert feed */}
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl text-paper">
            <Bell size={20} className="text-brass" />
            Conviction alerts
          </h2>
          <p className="mt-1 text-sm text-paper-muted">
            Latest moves from investors you follow.
          </p>

          {recentAlerts.length === 0 ? (
            <div className="mt-6 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6 text-center backdrop-blur">
              <p className="text-sm text-paper-muted">
                No alerts yet. Follow investors to see their conviction moves here.
              </p>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {recentAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 backdrop-blur"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-paper-muted">
                      {alert.transaction_date}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${
                        ["buy", "add"].includes(alert.action)
                          ? "border-gain/30 text-gain"
                          : "border-loss/30 text-loss"
                      }`}
                    >
                      {alert.action}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-sm text-paper">{alert.ticker}</p>
                  {alert.alert_text && (
                    <p className="mt-1 text-xs leading-5 text-paper-muted line-clamp-2">
                      {alert.alert_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account section */}
      <div className="mt-16 border-t border-ink-hairline pt-8">
        <h2 className="font-display text-lg text-paper">Account</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <NotificationPreferences />
          <BrokerConnectionPanel purpose="follower" />
          <PortfolioImportPanel />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 px-4 py-3 text-sm text-paper-muted backdrop-blur">
            {user.email}
          </div>
          <Link
            href="/explore"
            className="rounded-lg border border-ink-hairline px-4 py-3 text-sm text-paper-muted transition hover:border-paper-muted hover:text-paper backdrop-blur"
          >
            Browse investors
          </Link>
          <Link
            href="/roast"
            className="rounded-lg border border-ink-hairline px-4 py-3 text-sm text-paper-muted transition hover:border-paper-muted hover:text-paper backdrop-blur"
          >
            Roast my portfolio
          </Link>
        </div>
      </div>
    </section>
  );
}
