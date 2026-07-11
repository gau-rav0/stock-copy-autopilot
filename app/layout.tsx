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
    "verified investor track record India",
    "NSE portfolio verification",
    "CAS statement investor",
    "portfolio roast tool India",
    "best investors to follow India",
    "stock portfolio tracker NSE",
    "investment evidence India",
    "CDSL CAS portfolio history",
    "check investor credentials India",
    "investor transparency platform India",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Follow Verified Investors",
              "url": "https://fvi-ochre.vercel.app",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
              "description": "Inspect verified investor track records, holdings history, and benchmark comparisons. No copy trading or investment advice.",
            }),
          }}
        />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
