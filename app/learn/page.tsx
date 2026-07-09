import BeginnerModePanel from "@/components/BeginnerModePanel";
import TrustNotice from "@/components/TrustNotice";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, TrendingDown } from "lucide-react";

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
    body: "In this demo, following means read-only updates. The user still studies the record and makes independent decisions.",
  },
];

const TERMS = [
  ["CAGR", "A smoothed annual growth rate."],
  ["XIRR", "A return calculation that accounts for cash flows at different dates."],
  ["Alpha", "Return above a comparison benchmark."],
  ["Max drawdown", "The largest fall from a previous high."],
  ["Volatility", "How sharply a portfolio moves up and down."],
  ["Allocation", "The share of money placed in a stock, sector, or strategy."],
];

export default function LearnPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Educational mode</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-paper sm:text-5xl">
        Understand the record before trusting the investor.
      </h1>
      <p className="mt-4 max-w-2xl text-paper-muted">
        Beginner Mode explains the investing terms used across the app. It is educational only and
        does not recommend what to buy or sell.
      </p>

      <div className="mt-8">
        <TrustNotice compact />
      </div>

      <div className="mt-8">
        <BeginnerModePanel context="explore" />
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

      <div className="mt-12 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">
              Quick glossary
            </p>
            <h2 className="mt-2 font-display text-2xl text-paper">Terms used in the demo</h2>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-brass hover:underline">
            Explore with context
            <ArrowRight size={15} />
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
    </section>
  );
}
