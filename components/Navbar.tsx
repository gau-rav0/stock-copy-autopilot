import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[.06] bg-ink/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg tracking-tight text-paper">
          Ledger<span className="text-brass">.</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-paper-muted md:flex">
          <Link href="/roast" className="transition hover:text-paper">
            Portfolio Roast
          </Link>
          <Link href="/explore" className="transition hover:text-paper">
            Explore
          </Link>
          <Link href="/learn" className="transition hover:text-paper">
            Beginner Mode
          </Link>
          <Link href="/connect" className="transition hover:text-paper">
            Become a creator
          </Link>
        </div>
        <Link
          href="/explore"
          className="rounded-lg border border-brass/40 bg-brass/10 px-4 py-1.5 text-sm text-brass transition hover:border-brass hover:bg-brass/15"
        >
          Explore investors
        </Link>
      </nav>
    </header>
  );
}
