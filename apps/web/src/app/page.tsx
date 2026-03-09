import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteNav } from "@/components/layout/site-nav";
import { db } from "@/server/db";
import { blogPosts } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open Health — All-in-One Health OS",
  description:
    "開放的健康作業系統。飲食、運動、睡眠、體重——所有健康數據整合在一個開源平台。",
};


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
        All-in-One Health OS
      </p>

      <p
        className="mt-4 text-sm text-neutral-400 dark:text-neutral-600 font-light max-w-md text-center animate-fade-in-up"
        style={{ animationDelay: "0.9s" }}
      >
        開放的健康作業系統——飲食、運動、睡眠、體重，一個平台全部搞定
      </p>

      <Link
        href="/hub"
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
        你的健康，
        <br />
        不該被分散在十個 App 裡。
      </blockquote>

      <div className="w-8 h-[1px] bg-neutral-200 dark:bg-neutral-800 mx-auto my-12" />

      <p className="text-neutral-500 font-light leading-loose max-w-xl mx-auto text-sm md:text-base">
        Open Health 是一個開放的健康作業系統，
        <br className="hidden md:block" />
        將飲食、運動、睡眠、體重整合在同一個平台。
      </p>

      <p className="mt-6 text-neutral-300 dark:text-neutral-700 font-light text-xs md:text-sm tracking-wide">
        不是另一個追蹤 App。是你的健康 OS。
      </p>
    </section>
  );
}

const features = [
  {
    num: "01",
    title: "全方位健康追蹤",
    en: "All-in-One Tracking",
    desc: "飲食、運動、睡眠、體重、水分、斷食——不再需要多個 App。一個平台涵蓋所有健康面向，數據自然互通。",
  },
  {
    num: "02",
    title: "AI 智能助手",
    en: "AI-Powered",
    desc: "拍照辨識營養標籤、AI 教練分析你的健康數據，給出個人化建議。讓科技為你的健康服務。",
  },
  {
    num: "03",
    title: "數據視覺化",
    en: "Data Visualization",
    desc: "體重趨勢、營養攝取、睡眠品質、運動表現——所有數據一目瞭然。用整合的視角做出更好的決策。",
  },
  {
    num: "04",
    title: "開源開放",
    en: "Open Platform",
    desc: "數據完全屬於你，沒有鎖定、沒有付費牆。開源架構，社群驅動，任何人都可以貢獻與擴展。",
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
        健康知識庫
      </h2>
      <p className="text-neutral-400 dark:text-neutral-600 font-light mb-16 text-sm">
        營養科學、訓練方法、睡眠優化的深度內容。
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
              href="/hub"
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
            <Link
              href="/privacy"
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              隱私權政策
            </Link>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.2em]">
              社群
            </p>
            <Link
              href="https://line.me/ti/g2/yoiSxP0jx7pJDEFjQtFLu87dwRsKIGnFIIkV3g?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              LINE 社群
            </Link>
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
      <SiteNav />
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
