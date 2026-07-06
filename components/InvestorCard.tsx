import Link from "next/link";
import { Profile } from "@/lib/types";
import { getTopHoldings } from "@/lib/demo-data";
import VerificationBadge from "./VerificationBadge";
import FollowButton from "./FollowButton";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const STYLE_LABEL: Record<string, string> = {
  value: "Value",
  growth: "Growth",
  dividend: "Dividend",
  momentum: "Momentum",
  smallcap: "Small-cap",
  longterm: "Long-term",
};

export default function InvestorCard({
  profile,
  recommended = false,
  rank,
}: {
  profile: Profile;
  recommended?: boolean;
  rank?: number;
}) {
  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const topHoldings = profile.topHoldings ?? getTopHoldings(profile.id);

  return (
    <article
      className={`group rounded-lg border p-5 transition ${
        recommended
          ? "border-brass/45 bg-[radial-gradient(circle_at_20%_0%,rgba(97,222,142,.18),transparent_18rem),linear-gradient(180deg,rgba(255,255,255,.06),rgba(18,20,20,.82))] shadow-[0_0_70px_rgba(0,157,85,.08)]"
          : "border-ink-hairline bg-ink-elevated/85 hover:border-brass/40 hover:shadow-[0_0_50px_rgba(0,157,85,.08)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/30 bg-brass/10 font-mono text-xs text-brass">
              {initials}
            </div>
            <div>
              <p className="font-display text-base text-paper">{profile.displayName}</p>
              <p className="text-xs text-paper-muted">{STYLE_LABEL[profile.investingStyle]}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {recommended && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-2.5 py-1 text-xs text-brass">
              <CheckCircle2 size={12} />
              Match {rank}
            </span>
          )}
          <VerificationBadge tier={profile.verificationTier} isDemo={profile.isDemo} />
        </div>
      </div>

      <p className="mt-4 text-sm text-paper-muted">{profile.bio}</p>

      <div className="mt-4 flex min-h-7 flex-wrap gap-2">
        {topHoldings.map((holding) => (
          <span
            key={holding.ticker}
            className="rounded-full border border-ink-hairline px-2 py-1 font-mono text-[11px] text-paper-muted"
          >
            {holding.ticker} {holding.allocationPct}%
          </span>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-ink-hairline pt-4 font-mono text-sm">
        <div>
          <p className="text-paper-muted text-xs">CAGR</p>
          <p className="mono-num text-gain">+{profile.cagr}%</p>
        </div>
        <div>
          <p className="text-paper-muted text-xs">Max DD</p>
          <p className="mono-num text-loss">{profile.maxDrawdown}%</p>
        </div>
        <div>
          <p className="text-paper-muted text-xs">Followers</p>
          <p className="mono-num text-paper">{profile.followerCount.toLocaleString("en-IN")}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink-hairline pt-4">
        <FollowButton investorName={profile.displayName} compact />
        <Link
          href={`/investor/${profile.id}`}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-ink-hairline px-4 text-sm text-paper-muted transition hover:border-paper-muted hover:text-paper"
        >
          Inspect record
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
