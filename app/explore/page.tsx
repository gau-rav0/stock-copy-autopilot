"use client";

import { useEffect, useState } from "react";
import InvestorCard from "@/components/InvestorCard";
import TrustNotice from "@/components/TrustNotice";
import { profiles } from "@/lib/demo-data";
import { InvestingStyle } from "@/lib/types";
import { BellRing, LineChart, ShieldCheck } from "lucide-react";

const FILTERS: { key: InvestingStyle | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "value", label: "Value" },
  { key: "growth", label: "Growth" },
  { key: "dividend", label: "Dividend" },
  { key: "momentum", label: "Momentum" },
  { key: "smallcap", label: "Small-cap" },
];

const FLOW_STEPS = [
  { Icon: ShieldCheck, title: "Inspect", body: "Open holdings, drawdowns, and history." },
  { Icon: BellRing, title: "Follow", body: "Get read-only allocation-change alerts." },
  { Icon: LineChart, title: "Compare", body: "Use evidence before making your own call." },
];

export default function ExplorePage() {
  const [filter, setFilter] = useState<InvestingStyle | "all">("all");
  const [fromRoast, setFromRoast] = useState(false);

  useEffect(() => {
    setFromRoast(new URLSearchParams(window.location.search).get("from") === "roast");
  }, []);

  const rankedProfiles = [...profiles].sort((a, b) => {
    const aScore = a.cagr + a.alpha + a.winRate * 0.16 - Math.abs(a.maxDrawdown) * 0.22;
    const bScore = b.cagr + b.alpha + b.winRate * 0.16 - Math.abs(b.maxDrawdown) * 0.22;
    return bScore - aScore;
  });
  const source = fromRoast ? rankedProfiles : profiles;
  const featured = rankedProfiles.slice(0, 3);
  const baseShown = filter === "all" ? source : source.filter((p) => p.investingStyle === filter);
  const shown = fromRoast ? baseShown.filter((p) => !featured.some((item) => item.id === p.id)) : baseShown;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-8 border-b border-ink-hairline pb-10 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            {fromRoast ? "Matched after your roast" : "Creator marketplace"}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-paper sm:text-5xl">
            Follow investors with receipts, not screenshots.
          </h1>
          <p className="mt-4 max-w-2xl text-paper-muted">
            Compare fictional demo track records by drawdown, holdings, replay history, and conviction
            changes. Follow only means read-only notifications.
          </p>
        </div>
        <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 shadow-[0_0_70px_rgba(0,157,85,.06)] backdrop-blur-xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">What happens next</p>
          <div className="mt-4 grid gap-3">
            {FLOW_STEPS.map(({ Icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brass/10 text-brass">
                  <Icon size={17} />
                </div>
                <div>
                  <p className="text-sm font-medium text-paper">{title}</p>
                  <p className="text-xs leading-5 text-paper-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <TrustNotice compact />
      </div>

      {fromRoast && (
        <div className="mt-6 rounded-lg border border-brass/30 bg-brass/10 p-5 shadow-[0_0_70px_rgba(0,157,85,.08)] backdrop-blur-xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
            From your portfolio roast
          </p>
          <h2 className="mt-2 font-display text-xl text-paper">
            Start with the cleanest demo records.
          </h2>
          <p className="mt-2 text-sm text-paper-muted">
            Ranked by a simple blend of CAGR, alpha, win rate, and drawdown control. Open the record
            before following.
          </p>
        </div>
      )}

      {fromRoast && (
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {featured.map((p, index) => (
            <InvestorCard key={p.id} profile={p} recommended rank={index + 1} />
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              filter === f.key
                ? "border-brass bg-brass/10 text-brass"
                : "border-ink-hairline text-paper-muted hover:border-paper-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">
            {fromRoast ? "More creators" : "Directory"}
          </p>
          <h2 className="mt-2 font-display text-2xl text-paper">Browse demo investors</h2>
        </div>
        <p className="hidden max-w-xs text-right text-xs leading-5 text-paper-muted sm:block">
          Filter by style, then inspect the full record before following updates.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <InvestorCard key={p.id} profile={p} recommended={fromRoast && featured.some((item) => item.id === p.id)} />
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-12 text-center text-paper-muted">
          No investors match this style yet. Try another filter.
        </p>
      )}
    </section>
  );
}
