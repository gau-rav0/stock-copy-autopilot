import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Roast",
  description:
    "Inspect stock concentration, sector exposure and clearly labelled holding-level estimates. Try a fictional sample without login.",
  alternates: { canonical: "/roast" },
};

export default function RoastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
