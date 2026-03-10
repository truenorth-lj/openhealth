import type { Metadata } from "next";
import { SiteNav } from "@/components/layout/site-nav";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { LandingContent } from "./landing-content";
import { defaultLocale, type Locale } from "@/lib/i18n-config";

export const dynamic = "force-dynamic";

const BASE_URL = "https://openhealth.blog";

interface Props {
  params: Promise<{ locale: string }>;
}

const descriptions: Record<Locale, string> = {
  "zh-TW":
    "開放的健康作業系統。飲食、運動、睡眠、體重——所有健康數據整合在一個開源平台。",
  en: "Open-source Health OS. Diet, exercise, sleep, weight — all health data in one AI-powered platform.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = (locale as Locale) || defaultLocale;

  return {
    title: "Open Health — All-in-One Health OS",
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

export default async function LandingPage() {
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
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.videoPublishedAt))
    .limit(3);

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen overflow-x-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <SiteNav />
      <LandingContent posts={recentPosts} />
    </div>
  );
}
