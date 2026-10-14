import { MetadataRoute } from "next";
import { getProfiles } from "@/lib/investor-data";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://fvi-ochre.vercel.app";
  const profiles = (await getProfiles()).filter((p) => !p.isDemo);
  return [
    ...[
      "",
      "/explore",
      "/roast",
      "/learn",
      "/connect",
      "/waitlist",
      "/verification",
      "/terms",
      "/privacy",
    ].map((path) => ({
      url: base + path,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.6,
    })),
    ...profiles.map((p) => ({
      url: `${base}/investor/${p.id}`,
      ...(p.evidenceUpdatedAt
        ? { lastModified: new Date(p.evidenceUpdatedAt) }
        : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
