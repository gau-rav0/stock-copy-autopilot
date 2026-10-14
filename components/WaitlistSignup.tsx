"use client";

import { useState, type FormEvent } from "react";

import { ArrowUpRight, Check } from "lucide-react";

import { trackEvent } from "@/lib/product-events";

export default function WaitlistSignup({
  source = "founding_access",
}: {
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
        signal: AbortSignal.timeout(15000),
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(
          body.error || "Could not save your email. Please try again.",
        );
      setStatus("success");
      setMessage(
        body.alreadySubscribed
          ? "You’re already on the list. We’ll email you when reviewed creator profiles are available."
          : "You’re on the list. We’ll email you when reviewed creator profiles are available.",
      );
      trackEvent(
        body.alreadySubscribed ? "waitlist_existing" : "waitlist_success",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save your email. Please try again.",
      );
    }
  }

  return (
    <div className="waitlist-form">
      {status === "success" ? (
        <p role="status" className="flex gap-3 text-sm leading-7">
          <Check size={20} className="mt-1 shrink-0 text-gain" />
          {message}
        </p>
      ) : (
        <form onSubmit={submit}>
          <label className="field-label" htmlFor={`waitlist-${source}`}>
            Email address
          </label>
          <div className="form-line">
            <input
              id={`waitlist-${source}`}
              type="email"
              autoComplete="email"
              required
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="button-primary"
            >
              {status === "loading" ? "Saving…" : "Notify me at launch"}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </form>
      )}
      {status === "error" && (
        <p role="alert" className="mt-3 text-sm text-loss">
          {message}
        </p>
      )}
      <p className="form-help mt-4">
        Only launch and early-access updates. No payment required.{" "}
        <a href="/privacy" className="underline underline-offset-4">
          Privacy & deletion
        </a>
      </p>
    </div>
  );
}
