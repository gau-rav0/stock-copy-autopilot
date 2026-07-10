import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verification methodology",
  description:
    "What verified means on Follow Verified Investors, including demo, CAS, broker evidence, audit trail, and SEBI review requirements.",
};

export default function VerificationPage() {
  return (
    <section className="mobile-safe mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Methodology</p>
      <h1 className="mt-3 font-display text-3xl text-paper">What “verified” means</h1>
      <p className="mt-4 max-w-2xl text-paper-muted">
        Verification is an evidence label, not an endorsement. It explains where a published
        portfolio record came from and how recently it was reviewed.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Demo", "Seeded fictional data used for product exploration. Not a real investor record."],
          ["CAS", "A Consolidated Account Statement or similar document is reviewed for holdings evidence."],
          ["Broker", "Read-only broker evidence is reviewed after broker ToS and legal checks."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5">
            <p className="font-display text-lg text-paper">{title}</p>
            <p className="mt-2 text-sm leading-6 text-paper-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Evidence artifacts</p>
        <div className="mt-4 grid gap-3 text-sm text-paper-muted sm:grid-cols-2">
          {[
            "Verification tier and date",
            "Source type and last updated timestamp",
            "Current holdings and allocation weights",
            "Holdings change log and conviction alerts",
            "Benchmark comparison against Nifty 50",
            "Risk context: drawdown, volatility, concentration, and win rate",
          ].map((item) => (
            <div key={item} className="rounded-lg border border-white/[.06] bg-white/[.035] p-3">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-loss/25 bg-loss/10 p-5">
        <p className="font-display text-lg text-paper">India/NSE compliance note</p>
        <p className="mt-2 text-sm leading-7 text-paper-muted">
          Paid creator/follow features require SEBI and legal review before launch. The product
          should be reviewed against investment adviser, research analyst, broker ToS, advertising,
          suitability, and data-protection obligations. The current product posture remains:
          education-only, no investment advice, no execution, no copy trading.
        </p>
      </div>
    </section>
  );
}
