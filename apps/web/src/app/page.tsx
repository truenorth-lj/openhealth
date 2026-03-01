import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open Health — 追蹤健康的本質",
  description:
    "開源、免費的健康追蹤平台。以簡約與科技的力量，重新定義健康管理。",
};

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/60 dark:bg-black/60 border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-light tracking-[0.3em] text-black dark:text-white"
        >
          OH
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400 dark:text-neutral-500">
          <a
            href="#features"
            className="hover:text-black dark:hover:text-white transition-colors duration-300"
          >
            功能
          </a>
          <a
            href="#install"
            className="hover:text-black dark:hover:text-white transition-colors duration-300"
          >
            安裝
          </a>
          <Link
            href="/blog"
            className="hover:text-black dark:hover:text-white transition-colors duration-300"
          >
            部落格
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/diary"
            className="text-sm text-black dark:text-white hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-300"
          >
            開始使用 →
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      {/* Enso Circle */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: "0.2s" }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="60"
            cy="60"
            r="50"
            className="stroke-black dark:stroke-white animate-draw-enso"
            strokeWidth="1.5"
            strokeDasharray="314"
            strokeDashoffset="30"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h1
        className="mt-12 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-black dark:text-white animate-fade-in-up"
        style={{ animationDelay: "0.5s" }}
      >
        Open Health
      </h1>

      <p
        className="mt-6 text-lg md:text-xl font-light text-neutral-500 dark:text-neutral-400 tracking-wide animate-fade-in-up"
        style={{ animationDelay: "0.7s" }}
      >
        追蹤健康的本質
      </p>

      <p
        className="mt-4 text-sm text-neutral-400 dark:text-neutral-600 font-light max-w-md text-center animate-fade-in-up"
        style={{ animationDelay: "0.9s" }}
      >
        開源、免費、屬於你的健康追蹤平台
      </p>

      <Link
        href="/diary"
        className="mt-12 px-8 py-3 border border-black/20 dark:border-white/20 text-sm text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-500 tracking-wider animate-fade-in-up"
        style={{ animationDelay: "1.1s" }}
      >
        開始使用
      </Link>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-12 animate-fade-in-up"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-neutral-300 dark:via-neutral-700 to-transparent animate-pulse" />
      </div>
    </section>
  );
}

function Philosophy() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-32 md:py-40 text-center">
      <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-16">
        Philosophy
      </p>

      <blockquote className="text-2xl md:text-3xl lg:text-4xl font-extralight text-black dark:text-white leading-relaxed">
        健康追蹤，
        <br />
        不該複雜。
      </blockquote>

      <div className="w-8 h-[1px] bg-neutral-200 dark:bg-neutral-800 mx-auto my-12" />

      <p className="text-neutral-500 font-light leading-loose max-w-xl mx-auto text-sm md:text-base">
        Open Health 將科技與簡約結合，
        <br className="hidden md:block" />
        讓你專注於真正重要的事——你的健康。
      </p>

      <p className="mt-6 text-neutral-300 dark:text-neutral-700 font-light text-xs md:text-sm tracking-wide">
        不是另一個 MyFitnessPal。是重新思考。
      </p>
    </section>
  );
}

const features = [
  {
    num: "01",
    title: "智能食物追蹤",
    en: "Smart Food Tracking",
    desc: "記錄每一餐的營養攝取，精確到 82 種以上營養素。從碳水、蛋白質到微量元素，全面掌握。",
  },
  {
    num: "02",
    title: "AI 營養辨識",
    en: "AI Recognition",
    desc: "拍照即可辨識營養標籤與食物內容。讓記錄變得毫不費力，科技為你服務。",
  },
  {
    num: "03",
    title: "數據視覺化",
    en: "Data Visualization",
    desc: "視覺化你的健康趨勢。體重、營養攝取、飲水量，一目瞭然。用數據驅動決策。",
  },
  {
    num: "04",
    title: "開源透明",
    en: "Open Source",
    desc: "完全屬於你的數據，沒有隱藏的追蹤，沒有付費牆。程式碼將於服務穩定後完全開源——敬請期待。",
  },
];

function Features() {
  return (
    <section id="features" className="max-w-4xl mx-auto px-6 py-32">
      <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-20">
        Features
      </p>

      <div>
        {features.map((f) => (
          <div
            key={f.num}
            className="group grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 md:gap-12 py-10 md:py-14 border-t border-black/[0.06] dark:border-white/[0.06] last:border-b"
          >
            <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700 pt-1">
              {f.num}
            </span>
            <div>
              <h3 className="text-xl md:text-2xl font-light text-black dark:text-white group-hover:tracking-wide transition-all duration-500">
                {f.title}
              </h3>
              <p className="text-[10px] tracking-[0.2em] text-neutral-300 dark:text-neutral-700 mt-1 font-mono uppercase">
                {f.en}
              </p>
              <p className="mt-5 text-neutral-500 font-light leading-relaxed text-sm max-w-lg">
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Install() {
  return (
    <section id="install" className="max-w-4xl mx-auto px-6 py-32">
      <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-4">
        Install
      </p>
      <h2 className="text-3xl md:text-4xl font-extralight text-black dark:text-white mb-4">
        安裝到你的裝置
      </h2>
      <p className="text-neutral-400 dark:text-neutral-600 font-light mb-20 text-sm">
        PWA 應用程式——無需商店下載，直接安裝到主畫面。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20">
        {/* iOS */}
        <div>
          <h3 className="text-xs tracking-[0.3em] text-neutral-500 uppercase mb-10 font-mono">
            iOS / Safari
          </h3>
          <ol className="space-y-8">
            {[
              ["01", "用 Safari 開啟 openhealth.blog"],
              ["02", "點選底部分享按鈕"],
              ["03", "選擇「加入主畫面」"],
            ].map(([num, text]) => (
              <li key={num} className="flex gap-5">
                <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700 shrink-0 pt-0.5">
                  {num}
                </span>
                <p className="text-black dark:text-white font-light text-sm">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* Android */}
        <div>
          <h3 className="text-xs tracking-[0.3em] text-neutral-500 uppercase mb-10 font-mono">
            Android / Chrome
          </h3>
          <ol className="space-y-8">
            {[
              ["01", "用 Chrome 開啟 openhealth.blog"],
              ["02", "點選右上角選單 ⋮"],
              ["03", "選擇「安裝應用程式」"],
            ].map(([num, text]) => (
              <li key={num} className="flex gap-5">
                <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700 shrink-0 pt-0.5">
                  {num}
                </span>
                <p className="text-black dark:text-white font-light text-sm">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-black/[0.06] dark:border-white/[0.06]">
        <Link
          href="/docs"
          className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
        >
          查看完整安裝指南 →
        </Link>
      </div>
    </section>
  );
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl: string | null;
  tags: string[] | null;
  videoPublishedAt: Date | null;
  createdAt: Date;
}

function BlogPreview({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="max-w-4xl mx-auto px-6 py-32">
      <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-4">
        Journal
      </p>
      <h2 className="text-3xl md:text-4xl font-extralight text-black dark:text-white mb-4">
        關於健康的思考
      </h2>
      <p className="text-neutral-400 dark:text-neutral-600 font-light mb-16 text-sm">
        健康、營養與生活方式的見解。
      </p>

      {posts.length === 0 ? (
        <div className="border border-black/[0.06] dark:border-white/[0.06] p-12 md:p-20 flex flex-col items-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 120 120"
            fill="none"
            aria-hidden="true"
            className="mb-8 opacity-20"
          >
            <circle
              cx="60"
              cy="60"
              r="50"
              className="stroke-black dark:stroke-white"
              strokeWidth="1.5"
              strokeDasharray="314"
              strokeDashoffset="30"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-neutral-400 dark:text-neutral-600 font-light text-sm">
            即將推出
          </p>
        </div>
      ) : (
        <div className="space-y-px">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12] transition-colors duration-300"
            >
              <div className="flex flex-col md:flex-row">
                {post.thumbnailUrl && (
                  <div className="md:w-56 md:flex-shrink-0 aspect-video md:aspect-auto relative overflow-hidden">
                    <Image
                      src={post.thumbnailUrl}
                      alt={post.title}
                      fill
                      className="object-cover opacity-80 group-hover:opacity-100 dark:opacity-70 dark:group-hover:opacity-90 transition-opacity duration-300"
                      sizes="(max-width: 768px) 100vw, 224px"
                    />
                  </div>
                )}
                <div className="p-5 md:p-6 flex flex-col justify-center min-w-0">
                  <time className="text-[10px] tracking-[0.3em] text-neutral-400 dark:text-neutral-600 uppercase mb-2">
                    {new Date(post.videoPublishedAt ?? post.createdAt).toLocaleDateString("zh-TW", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <h3 className="text-base font-light mb-2 group-hover:text-black/80 dark:group-hover:text-white/90 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-neutral-500 font-light line-clamp-2">
                    {post.summary?.slice(0, 120)}
                    {(post.summary?.length ?? 0) > 120 ? "…" : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Link
          href="/blog"
          className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
        >
          前往部落格 →
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="max-w-4xl mx-auto px-6 py-20 border-t border-black/[0.06] dark:border-white/[0.06]">
      <div className="flex flex-col md:flex-row justify-between gap-12">
        <div>
          <p className="text-base font-light tracking-[0.3em] text-black dark:text-white">
            OH
          </p>
          <p className="text-xs text-neutral-300 dark:text-neutral-700 mt-3 font-light">
            &copy; {new Date().getFullYear()} Open Health
          </p>
        </div>

        <div className="flex gap-16 text-sm">
          <div className="space-y-4">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.2em]">
              產品
            </p>
            <Link
              href="/diary"
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              開始使用
            </Link>
            <Link
              href="/docs"
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              安裝指南
            </Link>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.2em]">
              社群
            </p>
            <span className="block text-neutral-500 text-xs">
              GitHub — 敬請期待
            </span>
            <Link
              href="/blog"
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              部落格
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
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
      <Nav />
      <Hero />

      <div className="w-12 h-[1px] bg-black/[0.06] dark:bg-white/[0.06] mx-auto" />

      <Philosophy />
      <Features />
      <Install />
      <BlogPreview posts={recentPosts} />
      <Footer />
    </div>
  );
}
