"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Zap } from "lucide-react";

const FOUNDING_FEATURES = [
  "Priority access to the first real verified creators",
  "Read-only alerts when published allocations change",
  "Full evidence history and benchmark context",
  "Direct input into which features ship first",
  "Early access to portfolio analysis improvements",
  "Transparent pricing research before anything is sold",
];

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "founding_access" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to join");
      setStatus("success");
      setMsg("You're on the founding-access list. We'll email you when the first real creator profiles are ready.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMsg(error instanceof Error ? error.message : "Could not join the waitlist. Please try again.");
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-3 py-1 font-mono text-xs text-brass">
          <Zap size={12} /> Founding access
        </span>
        <h1 className="mt-5 font-display text-4xl text-paper sm:text-5xl">
          Help shape the first real cohort
        </h1>
        <p className="mt-4 text-paper-muted">
          Join before the marketplace opens. We are recruiting verified creators and the first users who care about evidence more than screenshots.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-brass/25 bg-brass/[.04] p-8 shadow-[0_0_80px_rgba(0,157,85,.09)] backdrop-blur-xl">
        <ul className="grid gap-3 sm:grid-cols-2">
          {FOUNDING_FEATURES.map((feat) => (
            <li key={feat} className="flex items-start gap-2 text-sm text-paper-muted">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brass" />
              {feat}
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t border-ink-hairline pt-8">
          {status === "success" ? (
            <div className="flex items-center gap-3 rounded-lg border border-brass/30 bg-brass/10 p-5">
              <CheckCircle2 size={20} className="shrink-0 text-brass" />
              <p className="text-sm text-paper">{msg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-lg border border-ink-hairline bg-ink py-3 px-4 text-sm text-paper placeholder:text-paper-muted focus:border-brass/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="shrink-0 rounded-lg bg-brass px-6 py-3 text-sm font-semibold text-white transition hover:bg-brass-bright disabled:opacity-50"
              >
                {status === "loading" ? "Joining…" : "Join waitlist"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p className="mt-2 text-xs text-loss">{msg}</p>
          )}
          <p className="mt-3 text-center text-xs text-paper-muted">
            No spam, no payment, and no invented launch date. Unsubscribe any time.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/explore" className="text-sm text-brass hover:underline">
          Preview the fictional product examples in the meantime →
        </Link>
      </div>
    </section>
  );
}
