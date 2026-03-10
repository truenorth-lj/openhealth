import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

const BASE_URL = "https://openhealth.blog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static public pages
  const staticPages = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/docs", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "monthly" as const },
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          "zh-TW": `${BASE_URL}${page.path}`,
          en: `${BASE_URL}/en${page.path}`,
        },
      },
    });
  }

  // Dynamic blog posts
  const posts = await db
    .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.videoPublishedAt))
    .limit(100);

  for (const post of posts) {
    entries.push({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ?? new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: {
        languages: {
          "zh-TW": `${BASE_URL}/blog/${post.slug}`,
          en: `${BASE_URL}/en/blog/${post.slug}`,
        },
      },
    });
  }

  // Auth pages (no locale alternates needed)
  entries.push(
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    }
  );

  return entries;
}
