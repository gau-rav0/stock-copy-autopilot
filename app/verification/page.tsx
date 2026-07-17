import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Verification Methodology — How FVI verifies investor track records",
  description:
    "Understand how Follow Verified Investors verifies investor track records using CDSL CAS statements and broker evidence. What the trust score means, and what FVI does not do.",
  keywords: [
    "investor verification India",
    "CAS statement verification",
    "how to verify investor track record India",
    "CDSL portfolio verification",
    "investment trust score",
  ],
};

export default function VerificationPage() {
  return (
    <section className="mobile-safe mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Methodology</p>
      <h1 className="mt-3 font-display text-3xl text-paper sm:text-4xl">What &ldquo;verified&rdquo; means on FVI</h1>
      <p className="mt-4 max-w-2xl text-paper-muted">
        Verification is an evidence label, not an endorsement. It explains where a published portfolio record came from, how recently it was reviewed, and what level of scrutiny was applied.
      </p>

      {/* Verification tiers */}
      <div className="mt-10">
        <h2 className="font-display text-xl text-paper mb-5">Verification tiers</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              tier: "Demo",
              color: "border-ink-hairline",
              description: "Fictional data seeded to demonstrate the product. Not a real investor record. Clearly labelled on every card.",
              what: ["Shows how the platform works", "Fictional holdings and transactions", "No real person behind the data"],
            },
            {
              tier: "CAS Verified",
              color: "border-brass/40",
              description: "A CDSL or NSDL Consolidated Account Statement was reviewed by FVI. Holdings are matched against the official demat record.",
              what: ["Submitted CDSL/NSDL document reviewed", "Published holdings matched to the statement", "Reviewed for consistency; not an authenticity guarantee"],
            },
            {
              tier: "Broker Linked",
              color: "border-brass/40",
              description: "Read-only broker API access is reviewed after legal and broker ToS checks. Holdings are pulled directly from broker records.",
              what: ["Read-only broker access", "Subject to broker ToS and legal review", "Higher technical assurance"],
            },
          ].map(({ tier, color, description, what }) => (
            <div key={tier} className={`rounded-lg border ${color} bg-ink-elevated/75 p-5`}>
              <p className="font-display text-lg text-paper">{tier}</p>
              <p className="mt-2 text-sm leading-6 text-paper-muted">{description}</p>
              <ul className="mt-4 space-y-1.5">
                {what.map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-paper-muted">
                    <CheckCircle2 size={12} className="mt-0.5 text-brass shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* How CAS verification works */}
      <div className="mt-10 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={18} className="text-brass" />
          <h2 className="font-display text-xl text-paper">How CAS verification works</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { step: "01", title: "Creator downloads their CAS", body: "The creator downloads their Consolidated Account Statement from CDSL's myeasi portal or NSDL CAS portal using their PAN." },
            { step: "02", title: "Statement is submitted to FVI", body: "The PDF is shared with FVI via the /connect application process. Personal financial details beyond holdings are redacted." },
            { step: "03", title: "Holdings are matched", body: "FVI reviews the statement and matches the holdings to what will be published on the creator's profile. Any discrepancy is flagged." },
            { step: "04", title: "Profile goes live with CAS badge", body: "Once verified, the profile is published with a CAS badge and the verification date. Updates are re-verified periodically." },
          ].map(({ step, title, body }) => (
            <div key={step} className="rounded-lg border border-white/[.06] bg-white/[.035] p-4">
              <p className="font-mono text-xs text-brass">{step}</p>
              <p className="font-medium text-paper mt-1">{title}</p>
              <p className="mt-1 text-sm text-paper-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence artifacts */}
      <div className="mt-8 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Evidence artifacts on every profile</p>
        <div className="mt-4 grid gap-3 text-sm text-paper-muted sm:grid-cols-2">
          {[
            "Verification tier and date",
            "Source type and last reviewed timestamp",
            "Current holdings with allocation weights",
            "Holdings change log and conviction alerts",
            "Benchmark comparison against Nifty 50",
            "Risk context: drawdown, volatility, concentration, and win rate",
            "Trust score (0–100) calculated from evidence depth",
            "Full transaction history including exits",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-lg border border-white/[.06] bg-white/[.035] p-3">
              <CheckCircle2 size={13} className="mt-0.5 text-brass shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* What FVI does NOT do */}
      <div className="mt-8 rounded-lg border border-loss/25 bg-loss/10 p-5">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle size={18} className="text-loss" />
          <p className="font-display text-lg text-paper">What FVI does NOT do</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Provide investment advice of any kind",
            "Execute trades or orders on your behalf",
            "Enable copy trading or automatic mirroring",
            "Guarantee any investment returns",
            "Act as a SEBI-registered investment adviser",
            "Recommend specific stocks to buy or sell",
          ].map(item => (
            <div key={item} className="flex items-start gap-2 text-sm text-paper-muted">
              <span className="text-loss shrink-0 mt-0.5">✗</span>
              {item}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-paper-muted">
          Paid creator/follow features require SEBI and legal review before launch. The current product posture remains: education-only, no investment advice, no execution, no copy trading.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/learn" className="inline-flex items-center gap-2 text-sm text-brass hover:underline">
          Beginner mode — learn the terms <ArrowRight size={14} />
        </Link>
        <Link href="/explore" className="inline-flex items-center gap-2 text-sm text-brass hover:underline">
          Explore verified investors <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
