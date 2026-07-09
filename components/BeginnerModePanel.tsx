"use client";

import { BookOpen, ChevronDown, Lightbulb } from "lucide-react";
import { useState } from "react";

type BeginnerContext = "home" | "explore" | "investor" | "roast";

const TERMS: Record<BeginnerContext, Array<{ term: string; meaning: string }>> = {
  home: [
    { term: "Verified investor", meaning: "A profile with portfolio evidence attached in the demo." },
    { term: "Read-only follow", meaning: "You receive updates, but no trades are copied or placed." },
    { term: "Track record", meaning: "Historical portfolio behavior, including both wins and drawdowns." },
  ],
  explore: [
    { term: "Trust Score", meaning: "A demo score combining verification, returns, risk, consistency, and transparency." },
    { term: "Max drawdown", meaning: "The largest fall from a previous portfolio high." },
    { term: "Alpha", meaning: "Return above a benchmark, shown here only for comparison." },
  ],
  investor: [
    { term: "CAGR", meaning: "Approximate annual growth rate over a period." },
    { term: "Volatility", meaning: "How sharply portfolio value tends to move." },
    { term: "Allocation", meaning: "The percentage of the portfolio assigned to one stock." },
  ],
  roast: [
    { term: "Concentration", meaning: "How much of your portfolio depends on one stock or sector." },
    { term: "Risk score", meaning: "A simple demo signal for how fragile the portfolio looks." },
    { term: "Benchmark", meaning: "A comparison index such as Nifty 50." },
  ],
};

const CONTEXT_COPY: Record<BeginnerContext, string> = {
  home: "Start with the evidence, then decide what deserves attention.",
  explore: "Use this mode to read investor cards without finance jargon getting in the way.",
  investor: "This profile is easier to inspect when the core metrics are translated first.",
  roast: "The roast is funny, but the useful part is understanding what the numbers mean.",
};

export default function BeginnerModePanel({ context }: { context: BeginnerContext }) {
  const [open, setOpen] = useState(false);
  const terms = TERMS[context];

  return (
    <section className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 shadow-[0_0_60px_rgba(0,157,85,.05)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brass/10 text-brass">
            <BookOpen size={17} />
          </span>
          <span>
            <span className="block font-mono text-xs uppercase tracking-[0.16em] text-brass">
              Beginner mode
            </span>
            <span className="mt-1 block text-sm text-paper-muted">{CONTEXT_COPY[context]}</span>
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-paper-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {terms.map((item) => (
            <div key={item.term} className="rounded-lg border border-ink-hairline bg-white/[.035] p-3">
              <div className="flex items-center gap-2 text-paper">
                <Lightbulb size={14} className="text-brass-bright" />
                <p className="text-sm font-medium">{item.term}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-paper-muted">{item.meaning}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
