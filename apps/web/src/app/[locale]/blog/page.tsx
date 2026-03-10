import type { Metadata } from "next";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { SiteNav } from "@/components/layout/site-nav";
import { BlogListContent } from "./blog-list-content";
import { defaultLocale, type Locale } from "@/lib/i18n-config";

export const dynamic = "force-dynamic";

const BASE_URL = "https://openhealth.blog";

interface Props {
  params: Promise<{ locale: string }>;
}

const descriptions: Record<Locale, string> = {
  "zh-TW": "營養科學、訓練方法、睡眠優化——來自 Open Health 的深度健康內容。",
  en: "Nutrition science, training methods, sleep optimization — in-depth health content from Open Health.",
};

const titles: Record<Locale, string> = {
  "zh-TW": "部落格 — Open Health",
  en: "Blog — Open Health",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = (locale as Locale) || defaultLocale;

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      canonical: `${BASE_URL}/blog`,
      languages: {
        "zh-TW": `${BASE_URL}/blog`,
        en: `${BASE_URL}/en/blog`,
      },
    },
  };
}

async function getPosts(locale: string) {
  return db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      summary: blogPosts.summary,
      thumbnailUrl: blogPosts.thumbnailUrl,
      tags: blogPosts.tags,
      createdAt: blogPosts.createdAt,
      videoPublishedAt: blogPosts.videoPublishedAt,
    })
    .from(blogPosts)
    .where(
      and(eq(blogPosts.status, "published"), eq(blogPosts.locale, locale))
    )
    .orderBy(desc(blogPosts.videoPublishedAt))
    .limit(50);
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  const lang = (locale as Locale) || defaultLocale;
  const posts = await getPosts(lang);

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <SiteNav />
      <BlogListContent posts={posts} />
    </div>
  );
}
