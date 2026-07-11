"use client";

import { AlertTriangle, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service here if available
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 rounded-full bg-red-500/10 p-4 ring-1 ring-red-500/25">
        <AlertTriangle className="h-12 w-12 text-red-400" />
      </div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
        Server meltdown.
      </h1>
      <p className="mx-auto mb-8 max-w-lg text-lg text-white/60">
        Something unexpected went wrong. Our servers probably tripped over a cable.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <button onClick={() => reset()} className="primary-button px-6">
          Try Again
        </button>
        <Link
          href="/"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 font-semibold text-white transition hover:bg-white/10"
        >
          <Home size={18} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
