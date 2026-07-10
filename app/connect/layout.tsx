import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator verification",
  description:
    "Apply to publish a read-only investor profile with clear verification status, privacy controls, and no trading permissions.",
};

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
