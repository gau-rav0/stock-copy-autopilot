"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";

function AuthContent() {
  const { signInWithEmail, verifyEmailOtp, user } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

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
        text: "Check your email for the sign-in button and 6-digit code. Use the code here if you opened the email on another device.",
        type: "success",
      });
      setCooldown(60);
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage(null);
    const { error } = await verifyEmailOtp(email, otp.trim());
    if (error) setMessage({ text: "That code is invalid or expired. Request a new email and try again.", type: "error" });
    else setMessage({ text: "Signed in successfully. Redirecting…", type: "success" });
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
        {otpSent && (
          <form onSubmit={handleVerifyOtp} className="mt-6 border-t border-ink-hairline pt-6">
            <label htmlFor="otp" className="mb-2 block text-sm text-paper-muted">6-digit code</label>
            <input id="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required className="block w-full rounded-lg border border-ink-hairline bg-ink/50 p-3 text-paper tracking-[0.4em] focus:border-brass focus:outline-none" />
            <button type="submit" disabled={loading || otp.length !== 6} className="mt-3 w-full rounded-lg border border-brass/50 px-3 py-3 text-sm font-semibold text-brass disabled:opacity-50">{loading ? "Verifying…" : "Verify code"}</button>
          </form>
        )}
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
