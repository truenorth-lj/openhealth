import type { Metadata } from "next";
import { SiteNav } from "@/components/layout/site-nav";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { LandingContent } from "./landing-content";
import { defaultLocale, type Locale } from "@/lib/i18n-config";

export const dynamic = "force-dynamic";

const BASE_URL = "https://openhealth.blog";

interface Props {
  params: Promise<{ locale: string }>;
}

const descriptions: Record<Locale, string> = {
  "zh-TW":
    "第一個開源、行動優先的個人健康 AI Agent。理解你的飲食、睡眠、運動與體重，成為最認識你的健康小助手。",
  en: "The first open-source, mobile-first personal health AI agent. Understands your nutrition, sleep, fitness, and becomes the health companion that knows you best.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = (locale as Locale) || defaultLocale;

  return {
    title: "Open Health — Your Open-Source Health AI Agent",
    description: descriptions[lang],
    alternates: {
      canonical: BASE_URL,
      languages: {
        "zh-TW": BASE_URL,
        en: `${BASE_URL}/en`,
      },
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  const lang = (locale as Locale) || defaultLocale;

  const recentPosts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      summary: blogPosts.summary,
      thumbnailUrl: blogPosts.thumbnailUrl,
      tags: blogPosts.tags,
      videoPublishedAt: blogPosts.videoPublishedAt,
      createdAt: blogPosts.createdAt,
    })
    .from(blogPosts)
    .where(
      and(eq(blogPosts.status, "published"), eq(blogPosts.locale, lang))
    )
    .orderBy(desc(blogPosts.videoPublishedAt))
    .limit(3);

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen overflow-x-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <SiteNav />
      <LandingContent posts={recentPosts} />
    </div>
  );
}
