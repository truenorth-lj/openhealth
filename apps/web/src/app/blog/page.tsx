import type { Metadata } from "next";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { SiteNav } from "@/components/layout/site-nav";
import { BlogListContent } from "./blog-list-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "部落格 — Open Health",
  description: "營養科學、訓練方法、睡眠優化——來自 Open Health 的深度健康內容。",
};

async function getPosts() {
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
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.videoPublishedAt))
    .limit(50);
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <SiteNav />
      <BlogListContent posts={posts} />
    </div>
  );
}
