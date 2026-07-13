"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";

function AuthContent() {
  const { signInWithEmail, user } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Redirect signed-in users to ?next= or /explore
  useEffect(() => {
    if (user) {
      const next = searchParams.get("next") || "/explore";
      window.location.replace(decodeURIComponent(next));
    }
  }, [user, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setLoading(true);
    setMessage(null);

    const next = searchParams.get("next");
    const { error } = await signInWithEmail(email, next ?? undefined);

    if (error) {
      if (error.toLowerCase().includes("rate limit")) {
        setMessage({ text: "You've sent too many requests. Please wait a minute before trying again.", type: "error" });
        setCooldown(60);
      } else {
        setMessage({ text: error, type: "error" });
      }
    } else {
      setMessage({
        text: "Check your email for the magic link to sign in.",
        type: "success",
      });
      setEmail("");
      setCooldown(60);
    }
    setLoading(false);
  };

  // Cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-ink-hairline bg-ink-elevated/75 p-6 shadow-[0_0_80px_rgba(0,157,85,.08)] backdrop-blur-xl sm:p-10">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass">
            Welcome back
          </p>
          <h1 className="mt-3 font-display text-2xl text-paper">
            Sign in to your account
          </h1>
          <p className="mt-3 text-sm text-paper-muted">
            Enter your email to receive a magic link. No passwords required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="mb-6">
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="block w-full rounded-lg border border-ink-hairline bg-ink/50 p-3 text-paper focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass sm:text-sm"
            />
          </div>

          {message && (
            <div
              className={`mb-6 rounded-md p-4 text-sm ${
                message.type === "error"
                  ? "bg-loss/10 text-loss border border-loss/20"
                  : "bg-brass/10 text-brass border border-brass/20"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="group relative flex w-full justify-center rounded-lg bg-brass px-3 py-3 text-sm font-semibold text-white transition hover:bg-brass-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50"
          >
            {loading ? "Sending magic link..." : cooldown > 0 ? `Wait ${cooldown}s to send again` : "Send magic link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-80px)] items-center justify-center">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
