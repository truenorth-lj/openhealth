import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/diary", "/food", "/progress", "/water", "/settings", "/hub"],
    },
    sitemap: "https://openhealth.blog/sitemap.xml",
  };
}
