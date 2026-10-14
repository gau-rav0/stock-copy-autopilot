import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import WaitlistSignup from "@/components/WaitlistSignup";
export const metadata: Metadata = {
  title: "Join early access",
  description:
    "Get notified when the first reviewed creator profiles are available on FVI.",
  alternates: { canonical: "/waitlist" },
};
export default function WaitlistPage() {
  return (
    <section className="page-shell waitlist-layout">
      <p className="eyebrow">
        <span className="status-dot" />
        The founding cohort
      </p>
      <h1>
        The next chapter,
        <br />
        with better evidence.
      </h1>
      <p>
        We are reviewing our first creators. Leave your email for early access
        to published portfolio evidence and read-only updates as the marketplace
        opens.
      </p>
      <WaitlistSignup />
      <p className="form-help mt-5">
        The public directory is a fictional preview today. No launch date or
        returns are promised.
      </p>
      <Link href="/explore" className="text-link">
        Inspect an example record <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}
