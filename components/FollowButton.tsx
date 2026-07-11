"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function FollowButton({
  investorId,
  investorName,
  compact = false,
}: {
  investorId?: string;
  investorName: string;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !investorId) {
      setFollowing(false);
      setLoading(false);
      return;
    }

    const checkFollowState = async () => {
      try {
        const res = await fetch(`/api/follow?profileId=${investorId}`);
        const data = await res.json();
        setFollowing(!!data.following);
      } catch {
        // Fallback silently
      } finally {
        setLoading(false);
      }
    };

    checkFollowState();
  }, [user, investorId]);

  const toggleFollow = async () => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const next = !following;
    setFollowing(next);
    setSaving(true);

    try {
      await fetch("/api/follow", {
        method: next ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId: investorId }),
      });
    } catch {
      // Revert if API fails
      setFollowing(!next);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-9 w-24 rounded-lg bg-ink-elevated animate-pulse"></div>;

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
