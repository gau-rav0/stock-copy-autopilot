import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Roast",
  description:
    "Enter NSE holdings for an educational portfolio roast with concentration, drawdown, return, and benchmark signals.",
};

export default function RoastLayout({ children }: { children: React.ReactNode }) {
  return children;
}
