import { SearchX, Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 rounded-full bg-white/5 p-4 ring-1 ring-white/10">
        <SearchX className="h-12 w-12 text-white/40" />
      </div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
        Page not found
      </h1>
      <p className="mx-auto mb-8 max-w-lg text-lg text-white/60">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 font-semibold text-white transition hover:bg-indigo-600"
        >
          <Home size={18} />
          Go Home
        </Link>
        <Link
          href="/explore"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 font-semibold text-white transition hover:bg-white/10"
        >
          <Search size={18} />
          Explore Investors
        </Link>
      </div>
    </div>
  );
}
