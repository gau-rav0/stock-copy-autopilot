import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy and data deletion",
  description:
    "How Follow Verified Investors handles emails, creator applications, roast leads, and deletion requests.",
};

export default function PrivacyPage() {
  return (
    <section className="mobile-safe mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">Privacy</p>
      <h1 className="mt-3 font-display text-3xl text-paper">Data use and deletion</h1>
      <div className="mt-6 space-y-5 text-sm leading-7 text-paper-muted">
        <p>
          Follow Verified Investors stores only the information needed to operate the current flow:
          roast lead emails, follow intent, and creator verification applications when Supabase is
          configured. CAS parsing and broker sync are not enabled in this build.
        </p>
        <p>
          Creator files should be treated as sensitive financial evidence. Production storage must
          use private buckets, limited retention, access logs, and human review controls before any
          paid or public creator launch.
        </p>
        <p>
          Users should be able to request deletion of roast leads, follow intents, creator
          applications, and any uploaded verification evidence. Until an automated account center is
          live, route deletion requests to the operator email configured for production support.
        </p>
        <p>
          The product must not request trading permissions, place orders, manage funds, or sell
          personal portfolio data to third parties.
        </p>
      </div>
    </section>
  );
}
