import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://follow-verified-investors.vercel.app"),
  title: {
    default: "Follow Verified Investors - Investor track records with evidence",
    template: "%s | Follow Verified Investors",
  },
  description:
    "Inspect verified investor track records, holdings history, benchmark comparisons, and read-only conviction updates. No advice, copy trading, or order execution.",
  keywords: [
    "verified investors",
    "portfolio evidence",
    "NSE portfolio tracking",
    "investor marketplace",
    "portfolio roast",
    "investment education",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Follow Verified Investors",
    description:
      "Investor profiles with evidence artifacts: verification status, holdings history, benchmarks, and risk context.",
    url: "/",
    siteName: "Follow Verified Investors",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Follow Verified Investors evidence dashboard",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Follow Verified Investors",
    description:
      "Inspect investor track records with evidence before you follow read-only updates.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
