"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import InvestorCard from "@/components/InvestorCard";
import TrustNotice from "@/components/TrustNotice";
import BeginnerModePanel from "@/components/BeginnerModePanel";
import { InvestingStyle, Profile } from "@/lib/types";
import { BellRing, LineChart, ShieldCheck, Search } from "lucide-react";
import { calculateTrustScore } from "@/lib/trust-score";

const FILTERS: { key: InvestingStyle | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "value", label: "Value" },
  { key: "growth", label: "Growth" },
  { key: "dividend", label: "Dividend" },
  { key: "momentum", label: "Momentum" },
  { key: "smallcap", label: "Small-cap" },
];

type SortKey = "default" | "cagr" | "trust" | "alpha" | "drawdown";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "trust", label: "Trust Score" },
  { key: "cagr", label: "CAGR" },
  { key: "alpha", label: "Alpha" },
  { key: "drawdown", label: "Lowest DD" },
];

const FLOW_STEPS = [
  { Icon: ShieldCheck, title: "Inspect", body: "Open holdings, drawdowns, and history." },
  { Icon: BellRing, title: "Follow", body: "Get read-only allocation-change alerts." },
  { Icon: LineChart, title: "Compare", body: "Use evidence before making your own call." },
];

export default function ExploreClient({ profiles }: { profiles: Profile[] }) {
  // Use useSearchParams() instead of window.location.search to avoid hydration mismatch
  const searchParams = useSearchParams();
  const fromRoast = searchParams.get("from") === "roast";
  const focusTrust = searchParams.get("focus") === "trust";

  const [filter, setFilter] = useState<InvestingStyle | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>(fromRoast || focusTrust ? "trust" : "default");
  const [query, setQuery] = useState("");
  const hasLiveProfiles = profiles.some((profile) => !profile.isDemo);

  const withScores = useMemo(
    () =>
      profiles.map((p) => ({
        profile: p,
        trustScore: calculateTrustScore(p, p.topHoldings ?? []).score,
      })),
    [profiles]
  );

  const ranked = useMemo(() => {
    return [...withScores].sort((a, b) => {
      const aT = a.trustScore, bT = b.trustScore;
      const aScore = aT + a.profile.cagr * 0.4 + a.profile.alpha * 0.6 - Math.abs(a.profile.maxDrawdown) * 0.18;
      const bScore = bT + b.profile.cagr * 0.4 + b.profile.alpha * 0.6 - Math.abs(b.profile.maxDrawdown) * 0.18;
      return bScore - aScore;
    });
  }, [withScores]);

  const featured = ranked.slice(0, 3).map((r) => r.profile);

  const sorted = useMemo(() => {
    const arr = [...withScores];
    switch (sortKey) {
      case "trust": return arr.sort((a, b) => b.trustScore - a.trustScore);
      case "cagr": return arr.sort((a, b) => b.profile.cagr - a.profile.cagr);
      case "alpha": return arr.sort((a, b) => b.profile.alpha - a.profile.alpha);
      case "drawdown": return arr.sort((a, b) => Math.abs(a.profile.maxDrawdown) - Math.abs(b.profile.maxDrawdown));
      default: return fromRoast ? ranked : arr;
    }
  }, [withScores, sortKey, fromRoast, ranked]);

  const shown = useMemo(() => {
    let list = sorted.map((r) => r.profile);
    if (filter !== "all") list = list.filter((p) => p.investingStyle === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.displayName.toLowerCase().includes(q) || p.bio?.toLowerCase().includes(q)
      );
    }
    if (fromRoast) list = list.filter((p) => !featured.some((f) => f.id === p.id));
    return list;
  }, [sorted, filter, query, fromRoast, featured]);

  return (
    <section className="mobile-safe mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 border-b border-ink-hairline pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            {fromRoast ? "Examples after your roast" : hasLiveProfiles ? "Creator marketplace" : "Product preview"}
          </p>
          <h1 className="text-wrap-safe mt-4 max-w-3xl font-display text-4xl leading-tight text-paper sm:text-5xl">
            {hasLiveProfiles ? "Follow investors with receipts, not screenshots." : "See what evidence-first profiles will look like."}
          </h1>
          <p className="mt-4 max-w-2xl text-paper-muted">
            {hasLiveProfiles
              ? "Compare track records by drawdown, holdings, replay history, and conviction changes. Follow only means read-only notifications."
              : "Every record below is fictional and exists only to demonstrate holdings, drawdowns, replay history, and evidence labels. No demo profile can be followed or purchased."}
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

      {!hasLiveProfiles && (
        <div className="mt-6 rounded-lg border border-amber-300/30 bg-amber-300/[.07] p-5 text-sm leading-6 text-amber-50">
          <strong>There are no public live creator profiles yet.</strong> We are onboarding the founding cohort now.
          These fictional records are interface examples, not users, verified investors, or traction.
        </div>
      )}

      <div className="mt-6">
        <BeginnerModePanel context="explore" />
      </div>

      {fromRoast && (
        <div className="mt-6 rounded-lg border border-brass/30 bg-brass/10 p-5 shadow-[0_0_70px_rgba(0,157,85,.08)] backdrop-blur-xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
            {focusTrust ? "Trust Score matches" : "From your portfolio roast"}
          </p>
          <h2 className="mt-2 font-display text-xl text-paper">
            Compare the example evidence layouts.
          </h2>
          <p className="mt-2 text-sm text-paper-muted">
            Example rankings demonstrate the interface only. They are not recommendations and do not
            describe real investors or achieved returns.
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

      {/* Search + filters + sort */}
      <div className="mt-8 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or style…"
            className="w-full rounded-lg border border-ink-hairline bg-ink-elevated/75 py-2.5 pl-9 pr-4 text-sm text-paper placeholder:text-paper-muted focus:border-brass/40 focus:outline-none"
          />
        </div>

        {/* Style filters */}
        <div className="flex flex-wrap gap-2">
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

        {/* Sort row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-paper-muted">Sort by:</span>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSortKey(s.key)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                sortKey === s.key
                  ? "border-brass/60 bg-brass/10 text-brass"
                  : "border-ink-hairline text-paper-muted hover:border-paper-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">
            {fromRoast ? "More creators" : "Directory"}
          </p>
          <h2 className="mt-2 font-display text-2xl text-paper">
            {query ? `Results for "${query}"` : hasLiveProfiles ? "Browse investors" : "Browse fictional examples"}
          </h2>
        </div>
        <p className="text-right text-xs text-paper-muted">
          {shown.length} result{shown.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <InvestorCard
            key={p.id}
            profile={p}
            recommended={fromRoast && featured.some((item) => item.id === p.id)}
          />
        ))}
      </div>

      {shown.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-paper-muted">No investors match this search.</p>
          <button
            onClick={() => { setQuery(""); setFilter("all"); }}
            className="mt-3 text-sm text-brass hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
