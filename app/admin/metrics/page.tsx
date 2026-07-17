import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createWriteClient } from "@/lib/supabase/server";

type Metric = {
  label: string;
  value: number;
  note: string;
};

async function exactCount(query: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count, error } = await query;
  return error ? 0 : count ?? 0;
}

export default async function AdminMetricsPage() {
  const authClient = await createClient();
  if (!authClient) redirect("/");

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/auth");

  const { data: userData } = await authClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (userData?.role !== "admin") redirect("/");

  const supabase = createWriteClient();
  if (!supabase) redirect("/admin/creators");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [
    users,
    liveVerifiedCreators,
    creatorApplications,
    pendingApplications,
    approvedApplications,
    parsedApplications,
    followers,
    roastLeads,
    followIntents,
    waitlist,
    alertsSent,
    applications30d,
    roastLeads30d,
    followIntents30d,
    follows30d,
  ] = await Promise.all([
    exactCount(supabase.from("users").select("id", { count: "exact", head: true })),
    exactCount(
      supabase
        .from("portfolios")
        .select("id, profiles!inner(verified)", { count: "exact", head: true })
        .eq("name", "Primary")
        .eq("is_demo", false)
        .eq("profiles.verified", true)
    ),
    exactCount(supabase.from("creator_applications").select("id", { count: "exact", head: true })),
    exactCount(supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending_review")),
    exactCount(supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "approved")),
    exactCount(supabase.from("creator_applications").select("id", { count: "exact", head: true }).in("parse_status", ["parsed_pending_review", "manual_parsed_pending_review"])),
    exactCount(supabase.from("followers").select("id", { count: "exact", head: true })),
    exactCount(supabase.from("roast_leads").select("id", { count: "exact", head: true })),
    exactCount(supabase.from("follow_intents").select("id", { count: "exact", head: true })),
    exactCount(supabase.from("waitlist_signups").select("id", { count: "exact", head: true })),
    exactCount(supabase.from("alert_delivery_attempts").select("id", { count: "exact", head: true }).eq("status", "sent")),
    exactCount(supabase.from("creator_applications").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo)),
    exactCount(supabase.from("roast_leads").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo)),
    exactCount(supabase.from("follow_intents").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo)),
    exactCount(supabase.from("followers").select("id", { count: "exact", head: true }).gte("followed_at", thirtyDaysAgo)),
  ]);

  const allTime: Metric[] = [
    { label: "Registered users", value: users, note: "Real auth-backed accounts." },
    { label: "Live verified creators", value: liveVerifiedCreators, note: "Non-demo primary portfolios only." },
    { label: "Creator applications", value: creatorApplications, note: `${pendingApplications} pending · ${approvedApplications} approved.` },
    { label: "Applications parsed", value: parsedApplications, note: "CAS or manual holdings parsed successfully." },
    { label: "Real follows", value: followers, note: "Demo follows are removed by migration." },
    { label: "Roast email leads", value: roastLeads, note: "Not total roasts; only consented email captures." },
    { label: "Early-access intents", value: followIntents, note: "Waitlist and follow-interest submissions." },
    { label: "Waitlist signups", value: waitlist, note: "Stored unique/accepted signup rows." },
    { label: "Alerts delivered", value: alertsSent, note: "Provider-confirmed sent attempts." },
  ];

  const recent: Metric[] = [
    { label: "Creator applications", value: applications30d, note: "Last 30 days." },
    { label: "Roast email leads", value: roastLeads30d, note: "Last 30 days." },
    { label: "Early-access intents", value: followIntents30d, note: "Last 30 days." },
    { label: "New follows", value: follows30d, note: "Last 30 days." },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-brass">Investor evidence room</p>
          <h1 className="mt-2 font-display text-3xl text-paper sm:text-4xl">Real product metrics</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-paper-muted">
            These numbers come from stored production rows. Demo profiles and fictional follower counts are excluded.
          </p>
        </div>
        <Link href="/admin/creators" className="text-sm text-brass hover:underline">
          Review creator applications
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-paper">All-time evidence</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allTime.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-paper">Last 30 days</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
        </div>
      </section>

      <section className="mt-10 rounded-lg border border-amber-300/30 bg-amber-300/[.06] p-5">
        <h2 className="font-display text-lg text-amber-50">Metrics still missing</h2>
        <p className="mt-2 text-sm leading-6 text-amber-100/80">
          Anonymous roast completions, profile views, alert opens, weekly active users, cohort retention, and paid conversion are not yet measured. Do not quote those numbers in a pitch until event instrumentation exists.
        </p>
      </section>
    </main>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5">
      <p className="font-mono text-3xl text-paper">{metric.value.toLocaleString("en-IN")}</p>
      <h3 className="mt-2 text-sm font-semibold text-paper">{metric.label}</h3>
      <p className="mt-1 text-xs leading-5 text-paper-muted">{metric.note}</p>
    </article>
  );
}
