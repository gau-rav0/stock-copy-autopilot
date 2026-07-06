import { notFound } from "next/navigation";
import { getProfileDetail } from "@/lib/investor-data";
import VerificationBadge from "@/components/VerificationBadge";
import FollowButton from "@/components/FollowButton";
import PerformanceChart from "@/components/PerformanceChart";
import ReplayTimeline from "@/components/ReplayTimeline";
import TrustNotice from "@/components/TrustNotice";

const METRICS = [
  ["CAGR", "cagr", "%", "gain"],
  ["XIRR", "xirr", "%", "gain"],
  ["Alpha", "alpha", "%", "gain"],
  ["Max drawdown", "maxDrawdown", "%", "loss"],
  ["Volatility", "volatility", "%", "muted"],
  ["Win rate", "winRate", "%", "muted"],
] as const;

export default async function InvestorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getProfileDetail(id);
  if (!detail) notFound();

  const { profile, holdings, transactions, growth, alerts } = detail;
  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-ink-hairline pb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brass/30 bg-brass/10 font-mono text-sm text-brass">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl text-paper">{profile.displayName}</h1>
              <VerificationBadge tier={profile.verificationTier} isDemo={profile.isDemo} />
            </div>
            <p className="mt-1 text-sm text-paper-muted">{profile.bio}</p>
            <p className="mt-1 font-mono text-xs text-paper-muted">
              {profile.followerCount.toLocaleString("en-IN")} followers
            </p>
          </div>
        </div>
        <FollowButton investorName={profile.displayName} />
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
          <div className="mt-4 overflow-hidden rounded-lg border border-ink-hairline">
            {holdings.length > 0 ? (
              <table className="w-full text-sm">
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
    </section>
  );
}
