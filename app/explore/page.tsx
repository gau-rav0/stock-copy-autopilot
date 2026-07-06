import ExploreClient from "@/app/explore/ExploreClient";
import { getProfiles } from "@/lib/investor-data";

export default async function ExplorePage() {
  const profiles = await getProfiles();

  return <ExploreClient profiles={profiles} />;
}
