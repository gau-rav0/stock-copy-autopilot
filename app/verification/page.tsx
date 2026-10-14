import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export const metadata: Metadata = {
  title: "What a review label means",
  description: "The scope and limits of creator evidence review on FVI.",
  alternates: { canonical: "/verification" },
};
export default function VerificationPage() {
  return (
    <section className="page-shell onboarding-layout">
      <p className="eyebrow">The methodology</p>
      <h1>
        A label is a starting point.
        <br />
        Not a guarantee.
      </h1>
      <p className="onboarding-intro">
        Evidence review explains what was inspected, when it was reviewed, and
        what it covers. It does not endorse an investor or authenticate every
        historical performance claim.
      </p>
      <div className="editorial-rows mt-10">
        {[
          [
            "01",
            "Fictional preview",
            "Demo identities, holdings and returns illustrate the interface. They are not real verified creators, traction or recommendations. Demo records cannot be followed or purchased.",
          ],
          [
            "02",
            "Manual holdings / unverified",
            "A creator has entered allocations without an original statement review. This is a real submitted record when published, but it does not receive a CAS verification badge.",
          ],
          [
            "03",
            "CAS reviewed",
            "An authorised reviewer opened the original private statement, checked the account owner and the holdings intended for publication, and recorded the statement date and review notes. This is a holdings review. It is not an authenticity guarantee or an audit of investment returns.",
          ],
          [
            "04",
            "Broker linked / not enabled",
            "Live broker authorisation remains unavailable while provider and operational checks are outstanding. Saving a broker preference does not connect an account.",
          ],
        ].map(([n, title, body]) => (
          <section className="editorial-row" key={n}>
            <span>{n}</span>
            <div>
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
          </section>
        ))}
      </div>
      <div className="notice mt-9">
        <strong className="text-paper">Dates matter.</strong>
        <p>
          Profiles show the actual evidence review date and statement-as-of date
          where supplied. Missing dates are labelled as unavailable. A review
          describes that point in time; later trades and performance need their
          own evidence.
        </p>
      </div>
      <h2 className="mt-10 mb-4 text-xl">How statement review works</h2>
      <ol className="space-y-4 text-sm leading-7 text-paper-muted">
        <li>
          1. The creator signs in and uploads the original PDF or text statement
          to private storage. No automatic redaction is promised.
        </li>
        <li>
          2. The parser extracts possible holdings for reviewer assistance.
          Parsing success never grants a badge.
        </li>
        <li>
          3. An authorised reviewer examines the original, checks ownership and
          matches the rows intended for publication.
        </li>
        <li>
          4. Review notes, reviewer identity and dates are recorded. Profile
          creation and approval commit together, or roll back together if
          something fails.
        </li>
      </ol>
      <h2 className="mt-10 mb-4 text-xl">How to read the scores</h2>
      <p className="text-sm leading-7 text-paper-muted">
        The Trust Score combines review status, published holdings, and reported
        performance/risk context. It is a heuristic for inspecting a record, not
        a measure of honesty or investment suitability. Portfolio roast figures
        are holding-level estimates and risk proxies; the tool does not rebuild
        cash flows or your full portfolio history. Data sources and illustrative
        fallbacks are shown with the output.
      </p>
      <div className="hero-actions">
        <Link className="text-link" href="/connect">
          Submit a creator application <ArrowUpRight size={16} />
        </Link>
        <Link className="text-link" href="/privacy">
          Privacy & original evidence <ArrowUpRight size={16} />
        </Link>
      </div>
    </section>
  );
}
