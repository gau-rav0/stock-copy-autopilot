import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

const CONTACT_EMAIL = "gauravbihanigb@gmail.com";
const GITHUB_URL = "https://github.com/gau-rav0/stock-copy-autopilot";
const LINKEDIN_URL = "https://linkedin.com/in/gauravbihanii";

export default function Footer() {
  return (
    <footer className="border-t border-white/[.06] bg-ink">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-sm text-paper">
              Follow Verified Investors<span className="text-brass">.</span>
            </p>
            <p className="mt-1 text-xs text-paper-muted">
              Evidence-backed investor track records. No advice, no copy trading.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/[.06] px-3 py-1.5 text-xs text-paper-muted transition hover:border-brass/40 hover:text-brass"
            >
              <Github size={14} />
              GitHub
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/[.06] px-3 py-1.5 text-xs text-paper-muted transition hover:border-brass/40 hover:text-brass"
            >
              <Linkedin size={14} />
              LinkedIn
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-2 rounded-lg border border-brass/40 bg-brass/10 px-3 py-1.5 text-xs text-brass transition hover:bg-brass/15"
            >
              <Mail size={14} />
              Contact
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/[.06] pt-6 text-xs text-paper-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Follow Verified Investors. All rights reserved.</p>
          <p>
            Built by{" "}
            <Link
              href="https://github.com/gau-rav0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass hover:underline"
            >
              Gaurav Bihani
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
