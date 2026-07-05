"use client";

import { useState } from "react";

export default function FollowButton({
  investorName,
  compact = false,
}: {
  investorName: string;
  compact?: boolean;
}) {
  const [following, setFollowing] = useState(false);

  return (
    <div className={compact ? "w-full" : "w-full max-w-xs sm:w-auto"}>
      <button
        onClick={() => setFollowing((f) => !f)}
        className={`w-full rounded-lg px-5 py-2 text-sm font-semibold transition sm:w-auto ${
          following
            ? "border border-ink-hairline bg-ink-elevated/80 text-paper-muted hover:border-loss/40 hover:text-loss"
            : "bg-brass text-white shadow-[0_0_38px_rgba(0,157,85,.18)] hover:bg-brass-bright"
        }`}
      >
        {following ? "Following" : `Follow ${investorName.split(" ")[0]}`}
      </button>
      {!compact && !following && (
        <p className="mt-2 text-xs text-paper-muted">
          Follow means read-only portfolio-update notifications. No advice, copying, or execution.
        </p>
      )}
      {!compact && following && (
        <p className="mt-2 text-xs text-paper-muted">
          Demo read-only updates are enabled. You still decide independently; no orders are placed.
        </p>
      )}
    </div>
  );
}
