import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer page-shell">
      <div className="footer-top">
        <div>
          <Link href="/" className="brand-monogram">
            fvi<span>.</span>
          </Link>
          <p>A closer look at the evidence.</p>
          <p className="footer-note">
            Educational only. Your decisions stay yours.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/verification">Methodology</Link>
          <Link href="/privacy">Privacy & deletion</Link>
          <Link href="/terms">Terms</Link>
          <a href="mailto:gauravbihanigb@gmail.com">Contact</a>
          <Link href="/learn">Learn the terms</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Follow Verified Investors</span>
        <div>
          <a
            href="https://github.com/gau-rav0/stock-copy-autopilot"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/gauravbihanii"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
