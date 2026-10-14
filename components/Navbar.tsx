"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
const links = [
  { href: "/roast", label: "Portfolio roast" },
  { href: "/explore", label: "Evidence preview" },
  { href: "/connect", label: "For creators" },
];
export default function Navbar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  return (
    <header className="site-header">
      <nav className="page-shell nav-inner" aria-label="Main navigation">
        <Link
          href="/"
          className="brand-lockup"
          aria-label="Follow Verified Investors home"
        >
          <span className="brand-monogram">
            fvi<span>.</span>
          </span>
          <span className="brand-description">
            Follow verified
            <br />
            investors
          </span>
        </Link>
        <div className="desktop-nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-link"
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <Link
            href={
              user ? "/dashboard" : `/auth?next=${encodeURIComponent(pathname)}`
            }
            className="nav-account"
          >
            {user ? "My account" : "Sign in"}
          </Link>
          <Link href="/roast?sample=1" className="nav-cta">
            Try the roast <ArrowUpRight size={15} />
          </Link>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(!open)}
            className="nav-menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-nav" className="mobile-nav page-shell">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <Link href="/learn">Learn the terms</Link>
          {user ? (
            <>
              <Link href="/dashboard">My account</Link>
              <button onClick={() => void signOut()}>Sign out</button>
            </>
          ) : (
            <Link href={`/auth?next=${encodeURIComponent(pathname)}`}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
