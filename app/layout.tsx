import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://fvi-ochre.vercel.app",
  ),
  title: {
    default: "Follow Verified Investors - Investor track records with evidence",
    template: "%s | Follow Verified Investors",
  },
  description:
    "Get a closer look at concentration, sector exposure and estimated risk in your NSE holdings. Preview the next chapter of investor evidence.",
  alternates: { canonical: "/" },
  keywords: [
    "How to check if a fintwit portfolio is real",
    "Free NSE portfolio roast tool",
    "CDSL CAS portfolio tracker",
    "Evidence-backed investor track records in India",
    "verified investor track record India",
    "NSE portfolio verification",
    "CAS statement investor",
    "stock portfolio tracker NSE",
    "investment evidence India",
    "check investor credentials India",
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
        url: "/opengraph-image",
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
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Follow Verified Investors",
              url: "https://fvi-ochre.vercel.app",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
              description:
                "Free NSE portfolio analysis with transparent estimates and a fictional investor evidence preview. No copy trading or investment advice.",
            }),
          }}
        />
        <AuthProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
