import { VerificationTier } from "@/lib/types";

const DEMO_LABEL: Record<VerificationTier, string> = {
  demo: "Demo portfolio",
  cas: "Demo CAS example",
  broker: "Demo broker-linked example",
  auto: "Demo auto-sync example",
};

const VERIFIED_LABEL: Record<VerificationTier, string> = {
  demo: "Unverified portfolio",
  cas: "Verified by CAS statement",
  broker: "Verified by broker link",
  auto: "Verified by auto-sync",
};

export default function VerificationBadge({
  tier,
  isDemo,
}: {
  tier: VerificationTier;
  isDemo: boolean;
}) {
  const isVerified = !isDemo && tier !== "demo";
  const label = isDemo ? DEMO_LABEL[tier] : VERIFIED_LABEL[tier];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        isVerified
          ? "border-brass/40 bg-brass/10 text-brass"
          : "border-ink-hairline bg-white/[.03] text-paper-muted"
      }`}
    >
      {isVerified && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M1 5.2 3.6 8 9 1.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {label}
    </span>
  );
}
