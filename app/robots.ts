import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth", "/dashboard", "/creator/", "/admin/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://fvi-ochre.vercel.app"}/sitemap.xml`,
  };
}
