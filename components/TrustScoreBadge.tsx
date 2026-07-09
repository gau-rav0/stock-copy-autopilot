import type { TrustScoreResult } from "@/lib/trust-score";
import { trustScoreTone } from "@/lib/trust-score";
import { ShieldCheck } from "lucide-react";

export default function TrustScoreBadge({
  trust,
  compact = false,
}: {
  trust: TrustScoreResult;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-ink-hairline bg-white/[.035] ${
        compact ? "px-3 py-2" : "p-4"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={compact ? 14 : 17} className="text-brass-bright" />
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper-muted">
            Trust score
          </p>
        </div>
        <p className={`mono-num font-mono ${compact ? "text-base" : "text-2xl"} ${trustScoreTone(trust.score)}`}>
          {trust.score}
        </p>
      </div>
      {!compact && (
        <>
          <p className="mt-2 font-display text-lg text-paper">{trust.band}</p>
          <p className="mt-1 text-xs leading-5 text-paper-muted">{trust.summary}</p>
        </>
      )}
      {compact && <p className="mt-1 text-xs text-paper-muted">{trust.band}</p>}
    </div>
  );
}
