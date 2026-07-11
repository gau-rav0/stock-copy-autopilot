import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProfileDetail } from "@/lib/investor-data";
import VerificationBadge from "@/components/VerificationBadge";
import FollowButton from "@/components/FollowButton";
import PerformanceChart from "@/components/PerformanceChart";
import ReplayTimeline from "@/components/ReplayTimeline";
import TrustNotice from "@/components/TrustNotice";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import BeginnerModePanel from "@/components/BeginnerModePanel";
import { calculateTrustScore, trustScoreTone } from "@/lib/trust-score";

const METRICS = [
  ["CAGR", "cagr", "%", "gain"],
  ["XIRR", "xirr", "%", "gain"],
  ["Alpha", "alpha", "%", "gain"],
  ["Max drawdown", "maxDrawdown", "%", "loss"],
  ["Volatility", "volatility", "%", "muted"],
  ["Win rate", "winRate", "%", "muted"],
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = await getProfileDetail(id);

  if (!detail) {
    return {
      title: "Investor not found",
    };
  }

  return {
    title: `${detail.profile.displayName} evidence profile`,
    description: `Inspect ${detail.profile.displayName}'s verification tier, holdings, benchmark comparison, portfolio replay, and risk context.`,
  };
}

export default async function InvestorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getProfileDetail(id);
  if (!detail) notFound();

  const { profile, holdings, transactions, growth, alerts } = detail;
  const trust = calculateTrustScore(profile, holdings);
  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <section className="mobile-safe mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink-hairline pb-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-brass/30 bg-brass/10 font-mono text-sm text-brass">
            {initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-wrap-safe font-display text-2xl text-paper">{profile.displayName}</h1>
              <VerificationBadge tier={profile.verificationTier} isDemo={profile.isDemo} />
            </div>
            <p className="text-wrap-safe mt-1 text-sm text-paper-muted">{profile.bio}</p>
            <p className="mt-1 font-mono text-xs text-paper-muted">
              {profile.followerCount.toLocaleString("en-IN")} followers
            </p>
          </div>
        </div>
        <FollowButton
          investorId={profile.id}
          investorName={profile.displayName}
          subscriptionFeeInr={profile.subscriptionFeeInr}
        />
      </div>

      <div className="mt-6">
        <TrustNotice
          compact
          items={[
            "Fictional demo data.",
            "Portfolio-update notifications only.",
            "Not investment advice.",
            "No copy trading.",
            "No order execution.",
          ]}
        />
      </div>

      <div className="mt-6">
        <BeginnerModePanel context="investor" />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[280px_1fr]">
        <TrustScoreBadge trust={trust} />
        <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 shadow-[0_0_50px_rgba(0,157,85,.04)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">
                Evidence breakdown
              </p>
              <h2 className="mt-1 font-display text-xl text-paper">Why this score changed</h2>
            </div>
            <p className={`mono-num font-mono text-2xl ${trustScoreTone(trust.score)}`}>
              {trust.score}/100
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {trust.components.map((component) => (
              <div key={component.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-paper">{component.label}</span>
                  <span className="mono-num font-mono text-paper-muted">{component.score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-brass shadow-[0_0_18px_rgba(97,222,142,.28)]"
                    style={{ width: `${component.score}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-paper-muted">{component.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Verified means", profile.verificationTier === "demo" ? "Demo-seeded record, not a verified live creator." : "Evidence reviewed from the stated source tier."],
          ["Verification date", profile.verificationTier === "demo" ? "Demo seed" : "June 2026"],
          ["Source type", profile.verificationTier === "broker" ? "Read-only broker evidence" : profile.verificationTier === "cas" ? "CAS statement evidence" : "Demo dataset"],
          ["Last updated", alerts[0]?.transactionDate ?? transactions[0]?.transactionDate ?? "Pending"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 shadow-[0_0_50px_rgba(0,157,85,.04)] backdrop-blur">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper-muted">{label}</p>
            <p className="text-wrap-safe mt-2 text-sm font-medium text-paper">{value}</p>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="mt-8 rounded-lg border border-brass/30 bg-brass/10 p-5 shadow-[0_0_70px_rgba(0,157,85,.08)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-paper">Conviction alerts</h2>
              <p className="mt-1 text-sm text-paper-muted">
                Only major allocation changes, new stocks, full exits, or top-conviction shifts.
              </p>
            </div>
            <span className="rounded-full border border-brass/40 px-3 py-1 font-mono text-xs text-brass">
              {alerts.length} demo alerts
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="rounded-lg border border-ink-hairline bg-ink-elevated/80 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3 text-xs text-paper-muted">
                  <span className="font-mono">{alert.transactionDate}</span>
                  <span className="font-mono">{alert.ticker}</span>
                </div>
                <p className="mt-2 text-sm text-paper">{alert.alertText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance metrics */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-6">
        {METRICS.map(([label, key, suffix, tone]) => {
          const value = profile[key as keyof typeof profile] as number;
          const color = tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-paper";
          return (
            <div key={key} className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 shadow-[0_0_50px_rgba(0,157,85,.04)] backdrop-blur">
              <p className="text-xs text-paper-muted">{label}</p>
              <p className={`mono-num mt-1 font-mono text-lg ${color}`}>
                {value > 0 && tone === "gain" ? "+" : ""}
                {value}
                {suffix}
              </p>
            </div>
          );
        })}
      </div>

      {/* Growth chart */}
      <div className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">
              Performance evidence
            </p>
            <h2 className="mt-2 font-display text-xl text-paper">Portfolio growth vs. Nifty 50</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-paper-muted">
            Indexed demo performance, shown beside benchmark movement so the track record is easy to compare.
          </p>
        </div>
        <div className="mt-4 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 shadow-[0_0_80px_rgba(0,157,85,.06)] backdrop-blur-xl sm:p-6">
          {growth.length > 0 ? (
            <PerformanceChart data={growth} />
          ) : (
            <p className="py-16 text-center text-sm text-paper-muted">
              Growth history isn't published for this investor yet.
            </p>
          )}
        </div>
      </div>

      {/* Holdings + Replay */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-paper">Current holdings</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-hairline">
            {holdings.length > 0 ? (
              <table className="min-w-[560px] w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-hairline bg-ink-elevated/80 text-left text-xs text-paper-muted">
                    <th className="px-4 py-3 font-normal">Ticker</th>
                    <th className="px-4 py-3 font-normal">Allocation</th>
                    <th className="px-4 py-3 font-normal">Since</th>
                    <th className="px-4 py-3 font-normal text-right">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.ticker} className="border-b border-ink-hairline last:border-0">
                      <td className="px-4 py-3 font-mono text-paper">{h.ticker}</td>
                      <td className="px-4 py-3 font-mono text-paper-muted">{h.allocationPct}%</td>
                      <td className="px-4 py-3 text-paper-muted">{h.holdingSince}</td>
                      <td
                        className={`px-4 py-3 text-right font-mono ${
                          h.unrealizedReturnPct >= 0 ? "text-gain" : "text-loss"
                        }`}
                      >
                        {h.unrealizedReturnPct >= 0 ? "+" : ""}
                        {h.unrealizedReturnPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="bg-ink-elevated/80 px-4 py-10 text-center text-sm text-paper-muted">
                Holdings aren't published for this investor yet.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-paper">Portfolio replay</h2>
          <div className="mt-4 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6 shadow-[0_0_60px_rgba(0,157,85,.05)] backdrop-blur">
            {transactions.length > 0 ? (
              <ReplayTimeline transactions={transactions} />
            ) : (
              <p className="text-center text-sm text-paper-muted">
                No transaction history published yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Audit trail</p>
          <p className="mt-2 text-sm leading-6 text-paper-muted">
            Every published holding and replay event is tied to an evidence tier. Demo records are
            explicitly labeled until a CAS or read-only source review is complete.
          </p>
        </div>
        <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Change log</p>
          <p className="mt-2 text-sm leading-6 text-paper-muted">
            Conviction alerts show major additions, reductions, exits, and top-holding changes so
            users can see behavior over time.
          </p>
        </div>
        <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Risk explanation</p>
          <p className="mt-2 text-sm leading-6 text-paper-muted">
            Drawdown, volatility, concentration, and benchmark comparison are shown beside returns
            because performance without risk context is incomplete.
          </p>
        </div>
      </div>
    </section>
  );
}
