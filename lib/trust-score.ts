import type { Holding, Profile } from "./types";

export type TrustScoreComponent = {
  label: string;
  score: number;
  weight: number;
  note: string;
};

export type TrustScoreResult = {
  score: number;
  band: "High evidence" | "Balanced evidence" | "Review closely" | "Low evidence";
  summary: string;
  components: TrustScoreComponent[];
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const round = (value: number) => Math.round(clamp(value));

const verificationScore: Record<Profile["verificationTier"], number> = {
  broker: 96,
  cas: 88,
  auto: 82,
  demo: 46,
};

export function calculateTrustScore(profile: Profile, holdings: Holding[] = []): TrustScoreResult {
  const verifiedScore = profile.verified
    ? verificationScore[profile.verificationTier]
    : Math.min(verificationScore[profile.verificationTier], 38);
  const returnScore = clamp(profile.cagr * 2.2 + profile.alpha * 2.4 + profile.winRate * 0.35);
  const riskScore = clamp(100 - Math.abs(profile.maxDrawdown) * 1.35 - profile.volatility * 0.85);
  const consistencyScore = clamp(profile.winRate * 0.9 + profile.xirr * 0.8 - Math.max(0, profile.volatility - 18));
  const transparencyScore = clamp(
    (holdings.length >= 5 ? 90 : holdings.length >= 3 ? 74 : 46) +
      (profile.verified ? 8 : -10) +
      (profile.isDemo ? -4 : 6)
  );

  const components: TrustScoreComponent[] = [
    {
      label: "Verification",
      score: round(verifiedScore),
      weight: 0.28,
      note: profile.verified
        ? `${profile.verificationTier.toUpperCase()} evidence is published on this profile.`
        : profile.isDemo
          ? "Demo profile — not a verified live creator."
          : "Unverified profile; inspect evidence carefully.",
    },
    {
      label: "Performance",
      score: round(returnScore),
      weight: 0.24,
      note: `CAGR ${profile.cagr}% with alpha ${profile.alpha}%.`,
    },
    {
      label: "Risk control",
      score: round(riskScore),
      weight: 0.22,
      note: `Max drawdown ${profile.maxDrawdown}% and volatility ${profile.volatility}%.`,
    },
    {
      label: "Consistency",
      score: round(consistencyScore),
      weight: 0.14,
      note: `Win rate ${profile.winRate}% and XIRR ${profile.xirr}%.`,
    },
    {
      label: "Transparency",
      score: round(transparencyScore),
      weight: 0.12,
      note: `${holdings.length} published holdings are available for inspection.`,
    },
  ];

  const weightedScore = components.reduce((sum, item) => sum + item.score * item.weight, 0);
  const score = round(weightedScore);

  const band =
    score >= 82
      ? "High evidence"
      : score >= 68
        ? "Balanced evidence"
        : score >= 52
          ? "Review closely"
          : "Low evidence";

  return {
    score,
    band,
    summary:
      profile.isDemo
        ? "Demo score based on verification status, returns, drawdown, volatility, consistency, and published holdings."
        : "Trust score based on verified evidence: returns, drawdown, volatility, consistency, and published holdings.",
    components,
  };
}

export function trustScoreTone(score: number) {
  if (score >= 82) return "text-gain";
  if (score >= 68) return "text-brass-bright";
  if (score >= 52) return "text-paper";
  return "text-loss";
}
