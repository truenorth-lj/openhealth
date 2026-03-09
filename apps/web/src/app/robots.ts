import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/hub", "/settings"],
    },
    sitemap: "https://openhealth.blog/sitemap.xml",
  };
}
