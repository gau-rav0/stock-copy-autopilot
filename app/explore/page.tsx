import ExploreClient from "@/app/explore/ExploreClient";
import { getProfiles } from "@/lib/investor-data";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore verified investor records",
  description:
    "Browse investor profiles by style, Trust Score, holdings evidence, drawdowns, and read-only conviction updates.",
};

export default async function ExplorePage() {
  const profiles = await getProfiles();

  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-paper-muted">Loading investors...</div>}>
      <ExploreClient profiles={profiles} />
    </Suspense>
  );
}
