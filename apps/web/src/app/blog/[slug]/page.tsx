import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { BlogContent } from "./blog-content";
import { ThemeToggle } from "@/components/theme-toggle";

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
      <nav className="border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-base font-light tracking-[0.3em] text-black dark:text-white"
          >
            OH
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/blog"
              className="text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300"
            >
              ← 所有文章
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        {/* Thumbnail */}
        {post.thumbnailUrl && (
          <div className="relative aspect-video mb-12 overflow-hidden border border-black/[0.06] dark:border-white/[0.06]">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <time className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase">
              {new Date(post.videoPublishedAt ?? post.createdAt).toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.youtubeChannel && (
              <span className="text-[10px] tracking-[0.3em] text-neutral-400 dark:text-neutral-600 uppercase">
                {post.youtubeChannel}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extralight leading-tight mb-6">
            {post.title}
          </h1>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] tracking-wider text-neutral-500 border border-black/[0.06] dark:border-white/[0.06] px-2.5 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Summary box */}
        <div className="border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] px-6 py-5 mb-12">
          <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-3">
            精華摘要
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 font-light leading-relaxed">
            {post.summary}
          </p>
        </div>

        {/* Content */}
        <article className="mb-16">
          <BlogContent content={post.content} />
        </article>

        {/* YouTube link */}
        {post.youtubeVideoId && (
          <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-8 mb-12">
            <a
              href={`https://www.youtube.com/watch?v=${post.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              觀看原始影片 →
            </a>
          </div>
        )}

        {/* Back link */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-8">
          <Link
            href="/blog"
            className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
          >
            ← 所有文章
          </Link>
        </div>
      </main>
    </div>
  );
}
