import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy & data deletion",
  description:
    "How FVI handles portfolio analysis, account emails, private statements and deletion requests.",
  alternates: { canonical: "/privacy" },
};
export default function PrivacyPage() {
  return (
    <section className="page-shell onboarding-layout">
      <p className="eyebrow">Privacy / Last updated 14 October 2026</p>
      <h1>
        Your evidence.
        <br />
        Handled with care.
      </h1>
      <div className="space-y-8 text-sm leading-7 text-paper-muted">
        <section>
          <h2 className="mb-3 text-lg text-paper">Portfolio analysis</h2>
          <p>
            The roast processes the holdings you enter to calculate exposure and
            estimates. The public tool does not require an account or email, and
            does not save those holding rows to the product database. If AI
            writing is configured, aggregate analysis metrics, including
            estimated values and sector exposure, may be sent to the configured
            AI provider. Account emails and original CAS files are not sent
            through the roast-writing flow.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-lg text-paper">Accounts and early access</h2>
          <p>
            Supabase handles email sign-in and stores account information,
            creator applications, notification preferences and early-access
            emails. Vercel hosts the app. Signup capture may also use the
            configured email or CRM delivery service. We use these details to
            operate your account and send the updates you requested.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-lg text-paper">
            Private creator statements
          </h2>
          <p>
            CAS uploads require sign-in and are bound to that account. Original
            statements are stored in a private bucket. Reviewers use short-lived
            links, and access is recorded. Applications retain parsed holdings,
            file metadata, a checksum and review notes. We do not automatically
            redact original files. Upload a redacted copy if appropriate while
            keeping the owner, holdings and statement date readable.
          </p>
          <p className="mt-3">
            Original statement files are scheduled for removal after 90 days.
            Review metadata and published records remain until a deletion
            request or other account action is processed. A review date
            describes a historical review, not a promise of continuous
            monitoring.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-lg text-paper">Product measurement</h2>
          <p>
            We count a small set of actions such as sample starts, completed
            roasts and early-access signups. These event records contain an
            event name and timestamp, not account IDs, emails, holdings or IP
            addresses. Infrastructure providers may maintain operational request
            logs. We do not sell personal portfolio data.
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-lg text-paper">
            Request deletion or ask a question
          </h2>
          <p>
            Email{" "}
            <a
              href="mailto:gauravbihanigb@gmail.com?subject=FVI%20data%20deletion"
              className="text-gain underline underline-offset-4"
            >
              gauravbihanigb@gmail.com
            </a>{" "}
            from the address associated with your account or application. Tell
            us whether you want your early-access email, creator evidence or
            account records removed. We verify the request before removing
            private records. Do not send passwords or a financial statement by
            email.
          </p>
        </section>
        <p className="notice">
          FVI does not request trading permissions, execute orders, manage funds
          or automatically copy another investor’s trades.
        </p>
      </div>
    </section>
  );
}
