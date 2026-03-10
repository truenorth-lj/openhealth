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

  // Dynamic blog posts (grouped by slug, with locale awareness)
  const posts = await db
    .select({
      slug: blogPosts.slug,
      locale: blogPosts.locale,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.videoPublishedAt))
    .limit(200);

  // Group by slug to avoid duplicate sitemap entries
  const slugMap = new Map<
    string,
    { updatedAt: Date | null; locales: Set<string> }
  >();
  for (const post of posts) {
    const existing = slugMap.get(post.slug);
    if (existing) {
      existing.locales.add(post.locale);
      if (post.updatedAt && (!existing.updatedAt || post.updatedAt > existing.updatedAt)) {
        existing.updatedAt = post.updatedAt;
      }
    } else {
      slugMap.set(post.slug, {
        updatedAt: post.updatedAt,
        locales: new Set([post.locale]),
      });
    }
  }

  for (const [slug, data] of slugMap) {
    entries.push({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: data.updatedAt ?? new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: {
        languages: {
          "zh-TW": `${BASE_URL}/blog/${slug}`,
          en: `${BASE_URL}/en/blog/${slug}`,
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
