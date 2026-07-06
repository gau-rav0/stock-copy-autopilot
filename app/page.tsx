import Link from "next/link";
import ConvictionTicker from "@/components/ConvictionTicker";
import InvestorCard from "@/components/InvestorCard";
import ReplayTimeline from "@/components/ReplayTimeline";
import TrustNotice from "@/components/TrustNotice";
import { getHomeData } from "@/lib/investor-data";

export default async function Home() {
  const { featured, replaySample } = await getHomeData();

  return (
    <>
      <section className="relative mx-auto max-w-4xl px-6 pb-14 pt-20 text-center">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-brass">
          A demo ledger for portfolio evidence
        </p>
        <h1 className="font-display text-4xl leading-[1.1] text-paper sm:text-6xl">
          Inspect investor track records.
          <br />
          Not screenshots.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-paper-muted">
          Every green screenshot on Twitter has a loss that never got posted. See the full
          portfolio, the full history, and the moment conviction changes. This demo is for
          inspection and education only; you decide independently.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/roast"
            className="rounded-lg bg-brass px-6 py-3 text-sm font-semibold text-white shadow-[0_0_44px_rgba(0,157,85,.22)] transition hover:bg-brass-bright"
          >
            Roast your portfolio
          </Link>
          <Link
            href="/explore"
            className="rounded-lg border border-ink-hairline bg-white/[.03] px-6 py-3 text-sm text-paper-muted backdrop-blur transition hover:border-paper-muted hover:text-paper"
          >
            Explore investors
          </Link>
          <Link
            href="/connect"
            className="rounded-lg border border-ink-hairline bg-white/[.03] px-6 py-3 text-sm text-paper-muted backdrop-blur transition hover:border-paper-muted hover:text-paper"
          >
            Become a creator
          </Link>
        </div>
      </section>

      <ConvictionTicker />

      <section className="mx-auto max-w-5xl px-6 pt-10">
        <TrustNotice compact />
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6 shadow-[0_0_80px_rgba(0,157,85,.06)] backdrop-blur-xl sm:grid-cols-[1fr_280px] sm:p-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
              Acquisition loop
            </p>
            <h2 className="mt-3 font-display text-2xl text-paper">
              Roast the portfolio. Then answer the real question.
            </h2>
            <p className="mt-3 text-paper-muted">
              If screenshots cannot be trusted, what evidence should users inspect? The roast gets
              attention; demo historical profiles explain the trust layer.
            </p>
          </div>
          <div className="rounded-lg border border-white/[.06] bg-white/[.06] p-5 text-paper backdrop-blur-xl">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">
              Sample roast
            </p>
            <p className="mt-3 font-display text-xl">
              Confidence of Buffett. Track record of a coin flip.
            </p>
            <Link
              href="/roast"
              className="mt-5 inline-block rounded-lg bg-brass px-4 py-2 text-sm font-semibold text-white"
            >
              Try the roast
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="grid gap-12 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-paper">
              Twitter shows you the win. Never the drawdown.
            </h2>
            <p className="mt-4 text-paper-muted">
              Fake screenshots. Cherry-picked trades. Deleted losses. No way to check if the
              person making a claim actually holds it, held it, or quietly got out.
            </p>
          </div>
          <div className="space-y-4">
            {[
              ["Verification layer", "Designed around statements and read-only evidence, not screenshots."],
              ["Full history", "Every entry and exit, not just the ones that worked."],
              ["Conviction alerts", "Read-only notifications when allocation changes."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 backdrop-blur">
                <p className="text-sm font-medium text-paper">{title}</p>
                <p className="mt-1 text-sm text-paper-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink-hairline bg-ink-elevated/35 py-24 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-2xl text-paper">How it works</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {[
              ["01", "Explore", "Filter by value, growth, dividend, momentum, and small-cap."],
              ["02", "Follow", "Pick investors whose track record and style you trust."],
              ["03", "Get alerted", "Read-only updates when portfolio conviction changes."],
            ].map(([num, title, body]) => (
              <div key={num}>
                <p className="font-mono text-xs text-brass">{num}</p>
                <p className="mt-2 font-display text-lg text-paper">{title}</p>
                <p className="mt-2 text-sm text-paper-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl text-paper">Featured investors</h2>
          <Link href="/explore" className="text-sm text-brass hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {featured.map((p) => (
            <InvestorCard key={p.id} profile={p} />
          ))}
        </div>
      </section>

      <section className="border-t border-ink-hairline bg-ink-elevated/40 py-24">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-paper">Replay every portfolio change</h2>
            <p className="mt-4 text-paper-muted">
              Scrub back through an investor's actual history. Every buy, add, reduce, and exit,
              in order, dated, with allocation before and after. This is what a real track record
              looks like.
            </p>
          </div>
          <div className="rounded-lg border border-ink-hairline bg-ink/70 p-6 shadow-[0_0_60px_rgba(0,157,85,.06)] backdrop-blur">
            <ReplayTimeline transactions={replaySample} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="font-display text-2xl text-paper">
          Know who you can actually trust. In under 30 seconds.
        </h2>
        <Link
          href="/explore"
          className="mt-8 inline-block rounded-lg bg-brass px-6 py-3 text-sm font-semibold text-white shadow-[0_0_44px_rgba(0,157,85,.22)] transition hover:bg-brass-bright"
        >
          Compare demo track records
        </Link>
      </section>

      <footer className="border-t border-ink-hairline py-8 text-center text-xs text-paper-muted">
        Users always make their own investment decisions. Ledger does not manage funds, execute
        trades, or provide investment advice.
      </footer>
    </>
  );
}
