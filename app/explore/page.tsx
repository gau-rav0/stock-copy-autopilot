import ExploreClient from "@/app/explore/ExploreClient";
import { getProfiles } from "@/lib/investor-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore verified investor records",
  description:
    "Browse investor profiles by style, Trust Score, holdings evidence, drawdowns, and read-only conviction updates.",
};

export default async function ExplorePage() {
  const profiles = await getProfiles();

  return <ExploreClient profiles={profiles} />;
}
