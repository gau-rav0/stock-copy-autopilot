"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AuthPage() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await signInWithEmail(email);

    if (error) {
      setMessage({ text: error, type: "error" });
    } else {
      setMessage({
        text: "Check your email for the magic link to sign in.",
        type: "success",
      });
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-ink-hairline bg-ink-elevated p-8 shadow-2xl backdrop-blur-xl">
        <div>
          <h2 className="mt-2 text-center font-display text-3xl font-bold tracking-tight text-paper">
            Sign in to FVI
          </h2>
          <p className="mt-2 text-center text-sm text-paper-muted">
            Enter your email to receive a secure magic link. No passwords required.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full rounded-lg border-0 bg-ink py-3 text-paper shadow-sm ring-1 ring-inset ring-ink-hairline placeholder:text-paper-muted focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brass sm:text-sm sm:leading-6"
              placeholder="Email address"
            />
          </div>

          {message && (
            <div
              className={`rounded-md p-4 text-sm ${
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
            disabled={loading}
            className="group relative flex w-full justify-center rounded-lg bg-brass px-3 py-3 text-sm font-semibold text-white transition hover:bg-brass-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:opacity-50"
          >
            {loading ? "Sending magic link..." : "Send magic link"}
          </button>
        </form>
      </div>
    </div>
  );
}
