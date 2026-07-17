import Link from "next/link";
import ConvictionTicker from "@/components/ConvictionTicker";
import InvestorCard from "@/components/InvestorCard";
import ReplayTimeline from "@/components/ReplayTimeline";
import TrustNotice from "@/components/TrustNotice";
import BeginnerModePanel from "@/components/BeginnerModePanel";
import { getHomeData } from "@/lib/investor-data";
import { createWriteClient } from "@/lib/supabase/server";

export default async function Home() {
  const { featured, replaySample } = await getHomeData();
  const comparison = featured.slice(0, 2);
  const hasLiveProfiles = featured.some((profile) => !profile.isDemo);

  // Only publish counts backed by non-demo database records.
  let profileCount: number | null = null;
  try {
    const supabase = createWriteClient();
    if (supabase) {
      const { count: pc } = await supabase
        .from("portfolios")
        .select("id, profiles!inner(verified)", { count: "exact", head: true })
        .eq("name", "Primary")
        .eq("is_demo", false)
        .eq("profiles.verified", true);
      if (pc !== null) profileCount = pc;
    }
  } catch {
    // Omit unavailable metrics rather than inventing traction.
  }

  const faqs = [
    {
      q: "How do I verify an investor's track record in India?",
      a: "Creators can submit a CDSL or NSDL CAS for review. Broker-linked verification is planned but not available yet. Every profile shows whether its evidence is reviewed, unverified, or a fictional demo.",
    },
    {
      q: "Is Follow Verified Investors free to use?",
      a: "Yes. Exploring investor profiles, viewing track records, and using the Portfolio Roast are completely free. No signup required to browse.",
    },
    {
      q: "What is the Portfolio Roast?",
      a: "An AI tool that analyses your NSE/BSE stock holdings and scores your portfolio on diversification, concentration risk, absolute return, and sector balance. It gives a blunt, honest assessment.",
    },
    {
      q: "Can verified investors on FVI give investment advice?",
      a: "No. FVI is an educational platform. Creators share read-only updates on portfolio conviction changes. No advice, copy trading, or order execution of any kind.",
    },
    {
      q: "What is a CAS statement and how does it verify an investor?",
      a: "A Consolidated Account Statement (CAS) is issued by CDSL or NSDL and summarizes demat holdings linked to an investor. FVI parses submitted statements and reviews the published record for consistency. This is stronger evidence than a screenshot, but it is not a guarantee of authenticity, performance, or future returns.",
    },
    {
      q: "What does the Trust Score mean?",
      a: "The Trust Score (0\u2013100) is calculated from verification tier, holding history length, number of transactions, drawdown data, and benchmark comparisons. Higher scores mean more evidence is available to inspect.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
        <div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-brass sm:tracking-[0.2em]">
            Follow Verified Investors
          </p>
          <h1 className="text-wrap-safe font-display text-4xl leading-[1.05] text-paper sm:text-6xl">
            Inspect investor track records. Not screenshots.
          </h1>
          <p className="mt-6 max-w-xl text-paper-muted">
            See verification status, holdings evidence, benchmark context, and conviction changes
            before following read-only updates. Educational only; you decide independently.
          </p>
          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Link
              href="/roast"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brass px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_0_44px_rgba(0,157,85,.22)] transition hover:bg-brass-bright"
            >
              Roast your portfolio
            </Link>
            <Link
              href="/explore"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink-hairline bg-white/[.03] px-6 py-3 text-center text-sm text-paper-muted backdrop-blur transition hover:border-paper-muted hover:text-paper"
            >
              Compare investors
            </Link>
            <Link
              href="/connect"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink-hairline bg-white/[.03] px-6 py-3 text-center text-sm text-paper-muted backdrop-blur transition hover:border-paper-muted hover:text-paper"
            >
              Verify as creator
            </Link>
          </div>
          {/* Evidence bar: never substitute demo data for traction. */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-paper-muted">
            <span>
              <strong className="font-mono text-paper">
                {profileCount && profileCount > 0 ? profileCount : "Early access"}
              </strong>{" "}
              {profileCount && profileCount > 0 ? "real verified creators" : "founding creators onboarding"}
            </span>
            <span><strong className="font-mono text-paper">Live</strong> NSE portfolio analysis</span>
            <span><strong className="font-mono text-brass">Free</strong> to browse, always</span>
          </div>
        </div>

        <div className="rounded-lg border border-ink-hairline bg-ink-elevated/75 p-4 shadow-[0_0_80px_rgba(0,157,85,.08)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">
                {hasLiveProfiles ? "Live evidence comparison" : "Fictional product preview"}
              </p>
              <h2 className="mt-2 font-display text-xl text-paper">Receipts before follows</h2>
            </div>
            <span className="rounded-full border border-brass/30 px-3 py-1 font-mono text-[11px] text-brass">
              Read-only
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {comparison.map((profile) => (
              <Link
                key={profile.id}
                href={`/investor/${profile.id}`}
                className="rounded-lg border border-white/[.07] bg-white/[.045] p-4 transition hover:border-brass/35"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg text-paper">{profile.displayName}</p>
                    <p className="mt-1 text-xs leading-5 text-paper-muted">{profile.bio}</p>
                  </div>
                  <span className="rounded-full border border-ink-hairline px-2.5 py-1 font-mono text-[11px] uppercase text-paper-muted">
                    {profile.isDemo ? `demo ${profile.verificationTier} example` : profile.verificationTier}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-sm">
                  <div className="rounded-lg bg-black/18 p-2">
                    <p className="text-[10px] uppercase text-paper-muted">CAGR</p>
                    <p className="mono-num text-gain">+{profile.cagr}%</p>
                  </div>
                  <div className="rounded-lg bg-black/18 p-2">
                    <p className="text-[10px] uppercase text-paper-muted">Max DD</p>
                    <p className="mono-num text-loss">{profile.maxDrawdown}%</p>
                  </div>
                  <div className="rounded-lg bg-black/18 p-2">
                    <p className="text-[10px] uppercase text-paper-muted">Updated</p>
                    <p className="mono-num text-paper">Jun 2026</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              ["Verification", "CAS/broker/demo tier shown clearly."],
              ["Evidence", "Holdings, replay, alerts, and benchmark view."],
              ["Guardrails", "No advice, order execution, or copy trading."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-white/[.06] bg-white/[.035] p-3">
                <p className="text-sm font-medium text-paper">{title}</p>
                <p className="mt-1 text-xs leading-5 text-paper-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ConvictionTicker />

      {/* Before/After comparison */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass text-center">The problem we solve</p>
        <h2 className="mt-3 font-display text-2xl text-paper text-center">
          How to check if a fintwit portfolio is real.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-loss/30 bg-loss/[.06] p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">❌</span>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-loss">Screenshot (unverifiable)</p>
            </div>
            <div className="rounded-lg border border-ink-hairline bg-white/[.03] p-4 space-y-2">
              <p className="font-display text-paper text-sm">&ldquo;My 3X return on RELIANCE this year 🚀&rdquo;</p>
              <div className="h-12 rounded bg-white/[.04] flex items-center justify-center">
                <p className="font-mono text-[10px] text-paper-muted">[ blurry WhatsApp screenshot ]</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {["No date. No context.", "No exit shown.", "Cannot be verified.", "Loss tweets deleted."].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-paper-muted">
                  <span className="text-loss">✗</span> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-brass/30 bg-brass/[.06] p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">✅</span>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-brass">Example FVI evidence record</p>
            </div>
            <div className="rounded-lg border border-ink-hairline bg-white/[.03] p-4 space-y-2">
              <p className="font-display text-paper text-sm">Arjun Mehta — COALINDIA</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div><p className="text-paper-muted">Entered</p><p className="text-paper">Jan 2022 · ₹165</p></div>
                <div><p className="text-paper-muted">Current</p><p className="text-gain">₹421 (+155%)</p></div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {["CAS review status visible.", "Every transaction timestamped.", "Full history including exits.", "Max drawdown shown."].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-paper-muted">
                  <span className="text-gain">✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pt-10">
        <TrustNotice compact />
      </section>

      <section className="mx-auto max-w-5xl px-6 pt-6">
        <BeginnerModePanel context="home" />
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 shadow-[0_0_80px_rgba(0,157,85,.06)] backdrop-blur-xl sm:grid-cols-[1fr_280px] sm:p-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
              Acquisition loop
            </p>
            <h2 className="mt-3 font-display text-2xl text-paper">
              Free NSE portfolio roast tool
            </h2>
            <p className="mt-3 text-paper-muted">
              Get an AI-powered, blunt assessment of your holdings. If screenshots cannot be trusted, what evidence should users inspect? The roast gets attention; our profile previews explain the trust layer we are building.
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
          <h2 className="font-display text-2xl text-paper">
            {hasLiveProfiles ? "Verified investor records" : "Preview the verified-record experience"}
          </h2>
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

      {/* Pricing section */}
      <section id="pricing" className="border-y border-ink-hairline bg-ink-elevated/35 py-24 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass text-center">Simple, honest pricing</p>
          <h2 className="mt-3 font-display text-2xl text-paper text-center">Free to explore. Forever.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                name: "Browse",
                price: "₹0",
                period: "/always",
                badge: null,
                items: [
                  "Explore clearly labelled previews",
                  "Inspect example evidence layouts",
                  "Portfolio Roast (5 free/month)",
                  "Full conviction history (demo)",
                ],
                cta: "Start browsing",
                href: "/explore",
                highlight: false,
              },
              {
                name: "Creator",
                price: "Apply",
                period: "/free",
                badge: "Invite only",
                items: [
                  "Verification review and evidence label",
                  "Conviction alert feed",
                  "Full holdings history (3+ yrs)",
                  "Monthly performance report",
                ],
                cta: "Apply to join",
                href: "/connect",
                highlight: true,
              },
              {
                name: "Pro",
                price: "Research",
                period: "/pricing",
                badge: "Not yet for sale",
                items: [
                  "Unlimited portfolio roasts",
                  "Full history for all investors",
                  "Email alerts on conviction changes",
                  "Nifty 50 / Midcap 150 benchmarks",
                ],
                cta: "Get notified",
                href: "/waitlist",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-brass/40 bg-brass/[.06] shadow-[0_0_60px_rgba(0,157,85,.1)]"
                    : "border-ink-hairline bg-ink-elevated/75"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 right-5 rounded-full border border-brass/40 bg-ink px-3 py-0.5 font-mono text-[10px] uppercase text-brass">
                    {plan.badge}
                  </span>
                )}
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-paper-muted">{plan.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-3xl text-paper">{plan.price}</span>
                  <span className="text-sm text-paper-muted">{plan.period}</span>
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-paper-muted">
                      <span className="mt-0.5 text-brass">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-brass text-white hover:opacity-90"
                      : "border border-ink-hairline text-paper-muted hover:border-paper-muted hover:text-paper"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass text-center">Questions</p>
        <h2 className="mt-3 font-display text-2xl text-paper text-center">Frequently asked</h2>
        <div className="mt-8 space-y-3">
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-lg border border-ink-hairline bg-ink-elevated/75 p-5 backdrop-blur"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-paper">
                {q}
                <span className="shrink-0 text-paper-muted transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-paper-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-hairline bg-ink-elevated/40 py-24">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-paper">Replay every portfolio change</h2>
            <p className="mt-4 text-paper-muted">
              See how a verified history will expose every published buy, add, reduce, and exit in
              order, with dates and allocation changes. The preview below is fictional until real
              creator evidence is approved.
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

      <footer className="border-t border-ink-hairline px-4 py-8 text-center text-xs text-paper-muted">
        <p>
          Users always make their own investment decisions. Follow Verified Investors does not manage
          funds, execute trades, or provide investment advice.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:text-paper">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-paper">
            Privacy
          </Link>
          <Link href="/verification" className="hover:text-paper">
            Verification methodology
          </Link>
        </div>
      </footer>
    </>
  );
}
