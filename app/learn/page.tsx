import type { Metadata } from "next";
import BeginnerModePanel from "@/components/BeginnerModePanel";
import TrustNotice from "@/components/TrustNotice";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, TrendingDown, AlertTriangle, BarChart3, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Beginner Mode — Learn how to read investor track records",
  description:
    "Understand CAGR, XIRR, max drawdown, CAS verification, and how to read a real investor track record in India. Educational guide — no investment advice.",
  keywords: [
    "how to read CAGR India",
    "what is XIRR stock portfolio",
    "CAS statement verification investor",
    "how to check investor track record India",
    "portfolio drawdown explained",
    "NSE investor verification",
    "investment education India",
  ],
};

const LESSONS = [
  {
    Icon: ShieldCheck,
    title: "Trust comes from evidence",
    body: "Screenshots can hide losses. A useful investor profile should show verification status, holdings, drawdowns, and portfolio history.",
  },
  {
    Icon: TrendingDown,
    title: "Risk matters with return",
    body: "A high CAGR is less impressive if it came with deep drawdowns, extreme volatility, or one-stock concentration.",
  },
  {
    Icon: BookOpen,
    title: "Follow does not mean copy",
    body: "Following means read-only updates. You still study the record and make independent decisions.",
  },
];

const TERMS = [
  ["CAGR", "Compound Annual Growth Rate — a smoothed annual growth rate. Useful for comparing investors over the same period."],
  ["XIRR", "Extended Internal Rate of Return — accounts for cash flows at different dates. More accurate than CAGR for SIP-style investing."],
  ["Alpha", "Return above a benchmark (e.g., Nifty 50). Positive alpha means the investor beat the index."],
  ["Max drawdown", "The largest fall from a previous peak. A -40% drawdown means the portfolio once fell 40% before recovering."],
  ["Volatility", "How sharply a portfolio moves. High volatility = bigger swings up and down."],
  ["Allocation", "The share of money placed in a stock, sector, or strategy. E.g., 15% in HDFCBANK."],
  ["CAS statement", "Consolidated Account Statement issued by CDSL/NSDL — shows all demat holdings linked to your PAN. Cannot be faked."],
  ["Conviction alert", "A read-only notification when an investor meaningfully changes their allocation in a holding."],
];

const RED_FLAGS = [
  "Only shows winning trades — no exits, no losses.",
  "Screenshots without dates or entry prices.",
  "CAGR claims without benchmark comparison.",
  "No drawdown information shown.",
  "Cannot verify if they actually hold what they claim.",
  "Deleted posts after losses.",
];

const HOW_TO_READ = [
  {
    step: "01",
    title: "Check the verification tier",
    body: "CAS-verified means CDSL/NSDL statement was reviewed. Broker-linked means read-only broker access. Demo means fictional example data.",
  },
  {
    step: "02",
    title: "Compare CAGR vs. Nifty 50",
    body: "An investor with 15% CAGR sounds good — until you see Nifty 50 returned 14% in the same period. Alpha of just 1% is not worth the extra risk.",
  },
  {
    step: "03",
    title: "Check the max drawdown",
    body: "A 40% drawdown means the portfolio halved at some point. Could you have held on? Be honest with yourself before following anyone with deep drawdowns.",
  },
  {
    step: "04",
    title: "Look at what they sold",
    body: "Full transaction history shows exits, not just buys. An investor who only shows winners but hides exits is not being transparent.",
  },
];

export default function LearnPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Educational mode</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-paper sm:text-5xl">
        Understand the record before trusting the investor.
      </h1>
      <p className="mt-4 max-w-2xl text-paper-muted">
        Beginner Mode explains the investing terms and evidence signals used across FVI. Educational only — no investment advice.
      </p>

      <div className="mt-8">
        <TrustNotice compact />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {LESSONS.map(({ Icon, title, body }) => (
          <article key={title} className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brass/10 text-brass">
              <Icon size={18} />
            </div>
            <h2 className="mt-4 font-display text-lg text-paper">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-paper-muted">{body}</p>
          </article>
        ))}
      </div>

      {/* How to read a track record */}
      <div className="mt-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brass/10 text-brass"><BarChart3 size={16} /></div>
          <h2 className="font-display text-2xl text-paper">How to read a track record</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {HOW_TO_READ.map(({ step, title, body }) => (
            <div key={step} className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
              <p className="font-mono text-xs text-brass">{step}</p>
              <h3 className="mt-2 font-display text-lg text-paper">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-paper-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Red flags */}
      <div className="mt-12 rounded-lg border border-loss/25 bg-loss/[.06] p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={18} className="text-loss" />
          <h2 className="font-display text-xl text-paper">Red flags to watch for</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {RED_FLAGS.map((flag) => (
            <div key={flag} className="flex items-start gap-2 text-sm text-paper-muted">
              <span className="mt-0.5 text-loss shrink-0">✗</span>
              {flag}
            </div>
          ))}
        </div>
      </div>

      {/* CAS verification explained */}
      <div className="mt-12 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6 backdrop-blur">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={18} className="text-brass" />
          <h2 className="font-display text-xl text-paper">What is a CAS statement?</h2>
        </div>
        <p className="text-sm leading-6 text-paper-muted">
          A Consolidated Account Statement (CAS) is issued by CDSL or NSDL and lists every demat holding linked to your PAN number. It is an official document — it cannot be cherry-picked, edited, or faked. When an investor on FVI is CAS-verified, it means their actual CDSL/NSDL statement was reviewed and matched against the holdings shown on their profile.
        </p>
        <p className="mt-3 text-sm leading-6 text-paper-muted">
          This is fundamentally different from a screenshot. A screenshot can hide exits, show only good trades, or be taken at a convenient time. A CAS statement shows everything.
        </p>
        <Link href="/verification" className="mt-4 inline-flex items-center gap-2 text-sm text-brass hover:underline">
          Full verification methodology <ArrowRight size={14} />
        </Link>
      </div>

      {/* Glossary */}
      <div className="mt-12 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">Quick glossary</p>
            <h2 className="mt-2 font-display text-2xl text-paper">Terms used on FVI</h2>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-brass hover:underline">
            Explore with context <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {TERMS.map(([term, meaning]) => (
            <div key={term} className="rounded-lg border border-ink-hairline bg-white/[.035] p-4">
              <p className="font-medium text-paper">{term}</p>
              <p className="mt-1 text-sm text-paper-muted">{meaning}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <BeginnerModePanel context="explore" />
      </div>
    </section>
  );
}
