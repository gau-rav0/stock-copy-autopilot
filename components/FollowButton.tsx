"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import Script from "next/script";

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
    setError(null);

    if (!user) {
      // Remember the current page so we can return after sign-in
      const next = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth?next=${next}`;
      return;
    }

    if (following) {
      // Unfollow logic
      setFollowing(false);
      setSaving(true);
      try {
        await fetch("/api/follow", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ profileId: investorId }),
        });
      } catch {
        setFollowing(true);
        setError("Failed to unfollow. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Follow logic
    setSaving(true);

    if (subscriptionFeeInr > 0) {
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        setError("Payment is temporarily unavailable. Please try again later.");
        setSaving(false);
        return;
      }

      try {
        const orderRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ profileId: investorId }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          throw new Error(orderData.error || "Failed to create order");
        }

        const options = {
          key: razorpayKey,
          amount: orderData.amount,
          currency: "INR",
          name: "Follow Verified Investors",
          description: `Subscription to follow ${investorName}`,
          order_id: orderData.id,
          handler: async function () {
            // Payment success — proactively confirm on server side too
            setFollowing(true);
            setSaving(false);
            try {
              await fetch("/api/follow", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ profileId: investorId, subscribed: true }),
              });
            } catch {
              // Webhook will handle DB insertion; this is best-effort
            }
          },
          prefill: {
            email: user.email,
          },
          theme: {
            color: "#009D55",
          },
          modal: {
            ondismiss: function () {
              setSaving(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          setError("Payment failed: " + (response.error?.description || "Unknown error"));
          setSaving(false);
        });
        rzp.open();
      } catch (err: any) {
        setError(err.message || "Failed to initiate payment. Please try again.");
        setSaving(false);
      }
      return;
    }

    // Free follow logic
    setFollowing(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId: investorId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to follow");
      }
    } catch (err: any) {
      setFollowing(false);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-9 w-24 rounded-lg bg-ink-elevated animate-pulse" />;

  return (
    <>
      {subscriptionFeeInr > 0 && (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          onLoad={() => setRazorpayLoaded(true)}
        />
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
        {error && (
          <p className="mt-2 text-xs text-loss">{error}</p>
        )}
        {!compact && !following && !error && (
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
