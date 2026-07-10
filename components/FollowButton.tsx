"use client";

import { useState } from "react";

export default function FollowButton({
  investorId,
  investorName,
  compact = false,
}: {
  investorId?: string;
  investorName: string;
  compact?: boolean;
}) {
  const [following, setFollowing] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleFollow = async () => {
    const next = !following;
    setFollowing(next);

    if (!next) return;

    setSaving(true);
    try {
      await fetch("/api/follow-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ investorId, investorName, source: "follow_button" }),
      });
    } catch {
      // Keep the UI responsive even when capture is unavailable locally.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? "w-full sm:w-auto" : "w-full max-w-xs sm:w-auto"}>
      <button
        onClick={toggleFollow}
        disabled={saving}
        className={`w-full rounded-lg px-5 py-2 text-sm font-semibold transition sm:w-auto ${
          following
            ? "border border-ink-hairline bg-ink-elevated/80 text-paper-muted hover:border-loss/40 hover:text-loss"
            : "bg-brass text-white shadow-[0_0_38px_rgba(0,157,85,.18)] hover:bg-brass-bright"
        }`}
      >
        {saving ? "Saving..." : following ? "Following" : `Follow ${investorName.split(" ")[0]}`}
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
