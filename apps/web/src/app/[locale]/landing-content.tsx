"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useLocalePath } from "@/hooks/use-locale-path";

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

function Hero() {
  const { t } = useTranslation("landing");

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
        {t("hero.subtitle")}
      </p>

      <Link
        href="/hub"
        className="mt-12 px-8 py-3 border border-black/20 dark:border-white/20 text-sm text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-500 tracking-wider animate-fade-in-up"
        style={{ animationDelay: "1.1s" }}
      >
        {t("hero.cta")}
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
  const { t } = useTranslation("landing");

  return (
    <section className="max-w-3xl mx-auto px-6 py-32 md:py-40 text-center">
      <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-16">
        Philosophy
      </p>

      <blockquote className="text-2xl md:text-3xl lg:text-4xl font-extralight text-black dark:text-white leading-relaxed">
        {t("philosophy.quote1")}
        <br />
        {t("philosophy.quote2")}
      </blockquote>

      <div className="w-8 h-[1px] bg-neutral-200 dark:bg-neutral-800 mx-auto my-12" />

      <p className="text-neutral-500 font-light leading-loose max-w-xl mx-auto text-sm md:text-base">
        {t("philosophy.desc1")}
        <br className="hidden md:block" />
        {t("philosophy.desc2")}
      </p>

      <p className="mt-6 text-neutral-300 dark:text-neutral-700 font-light text-xs md:text-sm tracking-wide">
        {t("philosophy.tagline")}
      </p>
    </section>
  );
}

const featureEntries = [
  { num: "01", en: "All-in-One Tracking" },
  { num: "02", en: "AI-Powered" },
  { num: "03", en: "Data Visualization" },
  { num: "04", en: "Open Platform" },
];

function Features() {
  const { t } = useTranslation("landing");

  return (
    <section id="features" className="max-w-4xl mx-auto px-6 py-32">
      <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-20">
        Features
      </p>

      <div>
        {featureEntries.map((f) => (
          <div
            key={f.num}
            className="group grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 md:gap-12 py-10 md:py-14 border-t border-black/[0.06] dark:border-white/[0.06] last:border-b"
          >
            <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700 pt-1">
              {f.num}
            </span>
            <div>
              <h3 className="text-xl md:text-2xl font-light text-black dark:text-white group-hover:tracking-wide transition-all duration-500">
                {t(`features.title${f.num}`)}
              </h3>
              <p className="text-[10px] tracking-[0.2em] text-neutral-300 dark:text-neutral-700 mt-1 font-mono uppercase">
                {f.en}
              </p>
              <p className="mt-5 text-neutral-500 font-light leading-relaxed text-sm max-w-lg">
                {t(`features.desc${f.num}`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Install() {
  const { t } = useTranslation("landing");
  const lp = useLocalePath();

  return (
    <section id="install" className="max-w-4xl mx-auto px-6 py-32">
      <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-4">
        Install
      </p>
      <h2 className="text-3xl md:text-4xl font-extralight text-black dark:text-white mb-4">
        {t("install.title")}
      </h2>
      <p className="text-neutral-400 dark:text-neutral-600 font-light mb-20 text-sm">
        {t("install.subtitle")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20">
        {/* iOS */}
        <div>
          <h3 className="text-xs tracking-[0.3em] text-neutral-500 uppercase mb-10 font-mono">
            iOS / Safari
          </h3>
          <ol className="space-y-8">
            {(["01", "02", "03"] as const).map((num) => (
              <li key={num} className="flex gap-5">
                <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700 shrink-0 pt-0.5">
                  {num}
                </span>
                <p className="text-black dark:text-white font-light text-sm">
                  {t(`install.ios${num}`)}
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
            {(["01", "02", "03"] as const).map((num) => (
              <li key={num} className="flex gap-5">
                <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700 shrink-0 pt-0.5">
                  {num}
                </span>
                <p className="text-black dark:text-white font-light text-sm">
                  {t(`install.android${num}`)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-20 pt-8 border-t border-black/[0.06] dark:border-white/[0.06]">
        <Link
          href={lp("/docs")}
          className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
        >
          {t("install.fullGuide")}
        </Link>
      </div>
    </section>
  );
}

function BlogPreview({ posts }: { posts: BlogPost[] }) {
  const { t, i18n } = useTranslation("landing");
  const lp = useLocalePath();
  const dateLocale = i18n.language === "en" ? "en-US" : "zh-TW";

  return (
    <section className="max-w-4xl mx-auto px-6 py-32">
      <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-4">
        Journal
      </p>
      <h2 className="text-3xl md:text-4xl font-extralight text-black dark:text-white mb-4">
        {t("blog.title")}
      </h2>
      <p className="text-neutral-400 dark:text-neutral-600 font-light mb-16 text-sm">
        {t("blog.subtitle")}
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
            {t("blog.comingSoon")}
          </p>
        </div>
      ) : (
        <div className="space-y-px">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={lp(`/blog/${post.slug}`)}
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
                    {new Date(post.videoPublishedAt ?? post.createdAt).toLocaleDateString(dateLocale, {
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
                    {(post.summary?.length ?? 0) > 120 ? "..." : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Link
          href={lp("/blog")}
          className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
        >
          {t("blog.goToBlog")}
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useTranslation("landing");
  const lp = useLocalePath();

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
              {t("footer.product")}
            </p>
            <Link
              href="/hub"
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              {t("footer.getStarted")}
            </Link>
            <Link
              href={lp("/docs")}
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              {t("footer.installGuide")}
            </Link>
            <Link
              href={lp("/privacy")}
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              {t("footer.privacyPolicy")}
            </Link>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-[0.2em]">
              {t("footer.community")}
            </p>
            <Link
              href="https://line.me/ti/g2/yoiSxP0jx7pJDEFjQtFLu87dwRsKIGnFIIkV3g?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              {t("footer.lineCommunity")}
            </Link>
            <span className="block text-neutral-500 text-xs">
              {t("footer.githubComingSoon")}
            </span>
            <Link
              href={lp("/blog")}
              className="block text-neutral-500 hover:text-black dark:hover:text-white transition-colors duration-300 text-xs"
            >
              {t("footer.blog")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LandingContent({ posts }: { posts: BlogPost[] }) {
  return (
    <>
      <Hero />

      <div className="w-12 h-[1px] bg-black/[0.06] dark:bg-white/[0.06] mx-auto" />

      <Philosophy />
      <Features />
      <Install />
      <BlogPreview posts={posts} />
      <Footer />
    </>
  );
}
