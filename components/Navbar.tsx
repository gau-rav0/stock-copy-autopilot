"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/roast", label: "Portfolio Roast" },
  { href: "/explore", label: "Explore" },
  { href: "/learn", label: "Beginner Mode" },
  { href: "/connect", label: "Become a creator" },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[.06] bg-ink/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="text-wrap-safe font-display text-sm tracking-tight text-paper sm:text-lg">
          <span className="sm:hidden">FVI</span>
          <span className="hidden sm:inline">Follow Verified Investors</span>
          <span className="text-brass">.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 text-sm text-paper-muted md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hover:text-paper ${pathname === link.href ? "text-paper" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="shrink-0 rounded-lg border border-brass/40 bg-brass/10 px-3 py-1.5 text-xs text-brass transition hover:border-brass hover:bg-brass/15 sm:px-4 sm:text-sm"
          >
            Explore investors
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-xs text-paper-muted transition hover:text-paper md:inline"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="hidden text-xs text-paper-muted transition hover:text-paper md:inline"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href={`/auth?next=${encodeURIComponent(pathname)}`}
              className="hidden rounded-lg bg-white/5 px-4 py-1.5 text-xs text-paper transition hover:bg-white/10 md:inline"
            >
              Sign in
            </Link>
          )}

          {/* Hamburger */}
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-ink-hairline text-paper-muted transition hover:border-paper-muted hover:text-paper md:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="border-t border-ink-hairline bg-ink/95 px-4 pb-6 pt-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-3 text-sm transition hover:bg-white/[.04] hover:text-paper ${
                  pathname === link.href ? "text-paper" : "text-paper-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-ink-hairline" />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-4 py-3 text-sm text-paper-muted transition hover:bg-white/[.04] hover:text-paper"
                >
                  My Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="rounded-lg px-4 py-3 text-left text-sm text-paper-muted transition hover:bg-white/[.04] hover:text-paper"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href={`/auth?next=${encodeURIComponent(pathname)}`}
                className="rounded-lg px-4 py-3 text-sm text-paper-muted transition hover:bg-white/[.04] hover:text-paper"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
