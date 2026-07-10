import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms for Follow Verified Investors, including education-only use, no advice, no copy trading, and no order execution.",
};

export default function TermsPage() {
  return (
    <section className="mobile-safe mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Terms</p>
      <h1 className="mt-3 font-display text-3xl text-paper">Education and evidence, not advice</h1>
      <div className="mt-6 space-y-5 text-sm leading-7 text-paper-muted">
        <p>
          Follow Verified Investors helps users inspect investor profiles, portfolio evidence,
          benchmark comparisons, and read-only allocation updates. The product does not provide
          investment advice, personalized recommendations, portfolio management, trade execution,
          or copy trading.
        </p>
        <p>
          A follow means you may receive read-only notifications about published portfolio changes.
          You remain fully responsible for your own research, suitability decisions, tax treatment,
          and order placement outside this app.
        </p>
        <p>
          Demo profiles are fictional seeded records. Paid creator/follower features and India/NSE
          positioning require legal review, including SEBI implications, before launch.
        </p>
        <p>
          See the{" "}
          <Link href="/verification" className="text-brass hover:underline">
            verification methodology
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-brass hover:underline">
            privacy policy
          </Link>{" "}
          for evidence labels and data deletion.
        </p>
      </div>
    </section>
  );
}
