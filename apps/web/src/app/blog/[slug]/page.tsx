import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { SiteNav } from "@/components/layout/site-nav";
import { BlogPostContent } from "./blog-post-content";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const result = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  return result[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "文章未找到 — Open Health" };

  return {
    title: `${post.title} — Open Health`,
    description: post.summary?.slice(0, 160) ?? "",
    openGraph: {
      title: post.title,
      description: post.summary?.slice(0, 160) ?? "",
      type: "article",
      images: post.thumbnailUrl ? [{ url: post.thumbnailUrl }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <SiteNav />
      <BlogPostContent post={post} />
    </div>
  );
}
