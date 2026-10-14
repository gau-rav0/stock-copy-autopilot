import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> A clearer view of your investments
          </p>
          <h1>
            Find the <em>weak spots.</em>
            <br />
            Keep the conviction.
          </h1>
          <p className="hero-description">
            A closer look at concentration, sector exposure, and estimated risk
            in your NSE holdings. Clear numbers. A little honest criticism.
          </p>
          <div className="hero-actions">
            <TrackedLink
              href="/roast?sample=1"
              event="hero_roast"
              className="button-primary"
            >
              Try a sample roast <ArrowUpRight size={18} />
            </TrackedLink>
            <TrackedLink
              href="/waitlist"
              event="early_access"
              className="text-link"
            >
              Join early access <ArrowRight size={16} />
            </TrackedLink>
          </div>
          <p className="hero-note">
            Free to try. No login. No broker connection.
          </p>
        </div>
        <div
          className="report-preview"
          aria-label="Illustrative portfolio analysis"
        >
          <div className="report-heading">
            <span className="wordmark-small">FVI / Portfolio review</span>
            <span className="demo-label">Sample</span>
          </div>
          <div className="report-summary">
            <div>
              <p className="eyebrow">The first thing to look at</p>
              <p className="report-number">
                48<span>%</span>
              </p>
            </div>
            <p className="report-insight">
              One position.
              <br />
              Almost half
              <br />
              the portfolio.
            </p>
          </div>
          <div className="allocation-track">
            <span style={{ width: "48%" }} />
            <span style={{ width: "24%" }} />
            <span style={{ width: "16%" }} />
            <span style={{ width: "12%" }} />
          </div>
          <div className="report-table">
            <div>
              <span>Holding</span>
              <span>Allocation</span>
            </div>
            {[
              ["HDFCBANK", "48%"],
              ["INFY", "24%"],
              ["ITC", "16%"],
              ["RELIANCE", "12%"],
            ].map(([name, value], i) => (
              <div key={name}>
                <span>
                  <i className={`allocation-dot tone-${i}`} />
                  {name}
                </span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="report-footer">
            <span>
              Concentration is measurable.
              <br />
              Conviction needs a closer look.
            </span>
            <ArrowUpRight size={22} />
          </div>
          <p className="report-disclaimer">
            Illustrative holdings. Educational estimates, not investment advice.
          </p>
        </div>
      </section>
      <section className="product-strip page-shell">
        <span>
          <b>01</b> See the exposure
        </span>
        <span>
          <b>02</b> Understand the estimate
        </span>
        <span>
          <b>03</b> Inspect the evidence
        </span>
      </section>
      <section className="home-section page-shell" id="analysis">
        <div className="section-intro">
          <p className="eyebrow">The portfolio roast</p>
          <h2>
            Less noise.
            <br />
            <em>More perspective.</em>
          </h2>
          <Link href="/roast" className="text-link">
            Review your own holdings <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="editorial-rows">
          {[
            [
              "01",
              "Find hidden concentration",
              "Five stock names do not always mean five different bets. See where your money is actually concentrated.",
            ],
            [
              "02",
              "Put risk in context",
              "Look beyond the return. Understand sector exposure and clearly labelled historical estimates.",
            ],
            [
              "03",
              "Take the joke. Keep the numbers.",
              "Get a frank, shareable roast with its assumptions and data sources attached. The investment decisions stay yours.",
            ],
          ].map(([n, title, body]) => (
            <div className="editorial-row" key={n}>
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="evidence-section page-shell">
        <div className="evidence-copy">
          <p className="eyebrow">The next chapter / Early access</p>
          <h2>
            Before you follow a claim,
            <br />
            <em>inspect the record.</em>
          </h2>
          <p>
            We are building a place to examine investor evidence: published
            holdings, review dates, and portfolio changes. Our founding creator
            cohort is being reviewed.
          </p>
          <div className="hero-actions">
            <TrackedLink
              event="early_access"
              href="/waitlist"
              className="button-primary"
            >
              Get notified at launch <ArrowUpRight size={18} />
            </TrackedLink>
            <Link href="/explore" className="text-link">
              Inspect the preview <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="evidence-note">
          <span className="demo-label">Fictional product preview</span>
          <p className="evidence-quote">
            A record should show
            <br />
            what is known.
            <br />
            <em>And what is missing.</em>
          </p>
          <div className="evidence-check">
            <span>Source of evidence</span>
            <span>Visible</span>
          </div>
          <div className="evidence-check">
            <span>Review date & coverage</span>
            <span>Visible</span>
          </div>
          <div className="evidence-check">
            <span>Return guarantees</span>
            <span>None</span>
          </div>
          <p className="report-disclaimer">
            Directory examples are fictional. They cannot be followed or
            purchased.
          </p>
        </div>
      </section>
      <section className="home-section page-shell faq-section">
        <div className="section-intro">
          <p className="eyebrow">A few useful answers</p>
          <h2>
            Know what
            <br />
            <em>you are looking at.</em>
          </h2>
        </div>
        <div className="faq-list">
          {[
            [
              "Is the roast free?",
              "Yes. You can analyse a sample or enter your own NSE holdings without signing in. Email is optional and requested only if you want early access.",
            ],
            [
              "Are these actual portfolio returns?",
              "The roast uses current or illustrative quotes and holding-level estimates. It does not reconstruct your full cash-flow or transaction history. Every result shows these limits.",
            ],
            [
              "Can I follow investors now?",
              "The public directory currently previews fictional examples. Join early access for updates as real reviewed creator profiles become available.",
            ],
            [
              "What does verified mean?",
              "A review label describes the evidence inspected, its date and scope. It is not a return guarantee or an endorsement. Read our methodology for the details.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="creator-invitation page-shell">
        <div>
          <p className="eyebrow">For creators</p>
          <h2>Let the evidence speak.</h2>
          <p>
            Apply to the founding cohort. Submit a statement for review and
            choose what to publish.
          </p>
        </div>
        <TrackedLink
          href="/connect"
          event="creator_started"
          className="button-secondary"
        >
          Apply for creator review <ArrowUpRight size={18} />
        </TrackedLink>
      </section>
    </div>
  );
}
