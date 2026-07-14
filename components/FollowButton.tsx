"use client";

import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import { useAuth } from "@/lib/auth-context";

type RazorpayInstance = {
  on: (event: string, handler: (response: any) => void) => void;
  open: () => void;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: () => Promise<void>;
  prefill: { email?: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
};

export default function FollowButton({
  investorId,
  investorName,
  compact = false,
  subscriptionFeeInr = 0,
}: {
  investorId?: string;
  investorName: string;
  compact?: boolean;
  subscriptionFeeInr?: number;
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshFollowState = useCallback(async (signal?: AbortSignal) => {
    if (!investorId) return false;

    const response = await fetch(`/api/follow?profileId=${encodeURIComponent(investorId)}`, { signal });
    if (!response.ok) throw new Error("Could not load your follow status.");

    const data = await response.json();
    const nextFollowing = Boolean(data.following);
    if (!signal?.aborted) setFollowing(nextFollowing);
    return nextFollowing;
  }, [investorId]);

  useEffect(() => {
    if (!user || !investorId) {
      setFollowing(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    refreshFollowState(controller.signal)
      .catch(() => setFollowing(false))
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user, investorId, refreshFollowState]);

  const toggleFollow = async () => {
    setError(null);
    setNotice(null);

    if (!user) {
      const next = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth?next=${next}`;
      return;
    }

    if (following) {
      setFollowing(false);
      setSaving(true);
      try {
        const response = await fetch("/api/follow", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ profileId: investorId }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to unfollow");
        }
      } catch (caught) {
        setFollowing(true);
        setError(caught instanceof Error ? caught.message : "Failed to unfollow. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);

    if (subscriptionFeeInr > 0) {
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        setError("Payment is temporarily unavailable. Please try again later.");
        setSaving(false);
        return;
      }

      try {
        const orderResponse = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ profileId: investorId }),
        });
        const orderData = await orderResponse.json();
        if (!orderResponse.ok) {
          throw new Error(orderData.error || "Failed to create order");
        }

        const options: RazorpayOptions = {
          key: razorpayKey,
          amount: orderData.amount,
          currency: "INR",
          name: "Follow Verified Investors",
          description: `Subscription to follow ${investorName}`,
          order_id: orderData.id,
          handler: async () => {
            // A signed Razorpay webhook, not the browser, activates a paid follow.
            setSaving(false);
            setNotice("Payment received. Activating your follow after Razorpay confirms it.");

            for (let attempt = 0; attempt < 6; attempt += 1) {
              await new Promise<void>((resolve) => window.setTimeout(resolve, 1500));
              try {
                if (await refreshFollowState()) {
                  setNotice("Payment confirmed. You are now following this investor.");
                  return;
                }
              } catch {
                // The next check can still succeed after a transient network failure.
              }
            }
          },
          prefill: { email: user.email },
          theme: { color: "#009D55" },
          modal: { ondismiss: () => setSaving(false) },
        };

        const Razorpay = (window as Window & {
          Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
        }).Razorpay;
        if (!Razorpay) throw new Error("Payment checkout did not load. Please refresh and try again.");

        const razorpay = new Razorpay(options);
        razorpay.on("payment.failed", (response) => {
          setError("Payment failed: " + (response?.error?.description || "Unknown error"));
          setSaving(false);
        });
        razorpay.open();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to initiate payment. Please try again.");
        setSaving(false);
      }
      return;
    }

    setFollowing(true);
    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId: investorId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to follow");
      }
    } catch (caught) {
      setFollowing(false);
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-9 w-24 animate-pulse rounded-lg bg-ink-elevated" />;

  return (
    <>
      {subscriptionFeeInr > 0 && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setRazorpayLoaded(true)} />
      )}
      <div className={compact ? "w-full sm:w-auto" : "w-full max-w-xs sm:w-auto"}>
        <button
          onClick={toggleFollow}
          disabled={saving || (subscriptionFeeInr > 0 && !razorpayLoaded)}
          className={`w-full rounded-lg px-5 py-2 text-sm font-semibold transition sm:w-auto ${
            following
              ? "border border-ink-hairline bg-ink-elevated/80 text-paper-muted hover:border-loss/40 hover:text-loss"
              : "bg-brass text-white shadow-[0_0_38px_rgba(0,157,85,.18)] hover:bg-brass-bright"
          }`}
        >
          {saving
            ? "Loading..."
            : following
              ? "Following"
              : `Follow ${investorName.split(" ")[0]}${subscriptionFeeInr > 0 ? ` (₹${subscriptionFeeInr})` : ""}`}
        </button>
        {error && <p role="alert" className="mt-2 text-xs text-loss">{error}</p>}
        {notice && <p aria-live="polite" className="mt-2 text-xs text-brass">{notice}</p>}
        {!compact && !following && !error && !notice && (
          <p className="mt-2 text-xs text-paper-muted">
            Follow means read-only portfolio-update notifications. No advice, copying, or execution.
          </p>
        )}
        {!compact && following && (
          <p className="mt-2 text-xs text-paper-muted">
            Read-only updates are enabled. You still decide independently; no orders are placed.
          </p>
        )}
      </div>
    </>
  );
}
