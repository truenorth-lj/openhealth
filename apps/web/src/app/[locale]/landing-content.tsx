"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
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

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari =
    /Safari/.test(navigator.userAgent) &&
    !/CriOS|FxiOS/.test(navigator.userAgent);
  return isIOS && isSafari;
}

function Install() {
  const { t } = useTranslation("landing");
  const lp = useLocalePath();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (isIOSSafari()) {
      setShowIOSGuide(true);
    }

    // Detect if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    setMounted(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handlePwaInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return (
    <section id="install" className="max-w-4xl mx-auto px-6 py-32">
      <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-4">
        Download
      </p>
      <h2 className="text-3xl md:text-4xl font-extralight text-black dark:text-white mb-4">
        {t("install.title")}
      </h2>
      <p className="text-neutral-400 dark:text-neutral-600 font-light mb-20 text-sm">
        {t("install.subtitle")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
        {/* App Store */}
        <div className="group border border-black/[0.06] dark:border-white/[0.06] p-8 relative">
          <div className="absolute top-4 right-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-600 border border-neutral-200 dark:border-neutral-800 px-2 py-0.5">
              {t("install.comingSoon")}
            </span>
          </div>
          {/* Apple icon */}
          <svg className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <h3 className="text-sm font-light text-black dark:text-white mb-2">
            App Store
          </h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 font-light">
            {t("install.appStoreDesc")}
          </p>
        </div>

        {/* Google Play */}
        <div className="group border border-black/[0.06] dark:border-white/[0.06] p-8 relative">
          <div className="absolute top-4 right-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-600 border border-neutral-200 dark:border-neutral-800 px-2 py-0.5">
              {t("install.comingSoon")}
            </span>
          </div>
          {/* Google Play icon */}
          <svg className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.18 23.48c-.27-.2-.48-.55-.48-1.07V1.59c0-.52.21-.87.48-1.07l.12-.07L14.5 11.7v.25L3.3 23.2l-.12-.07zM18.47 15.71l-3.97-3.98v-.25l3.97-3.98.09.05 4.7 2.67c1.34.76 1.34 2.01 0 2.77l-4.7 2.67-.09.05zM14.5 11.7L3.3.55C3.72.15 4.42.09 5.2.53l9.3 5.27-4 3.9v2zM14.5 12.2v-.25l4 3.9-9.3 5.27c-.78.44-1.48.38-1.9-.02L14.5 12.2z"/>
          </svg>
          <h3 className="text-sm font-light text-black dark:text-white mb-2">
            Google Play
          </h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 font-light">
            {t("install.playStoreDesc")}
          </p>
        </div>

        {/* PWA */}
        <div className="group border border-black/[0.06] dark:border-white/[0.06] hover:border-black/20 dark:hover:border-white/20 p-8 transition-colors duration-300 relative">
          <div className="absolute top-4 right-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-green-600 dark:text-green-400 border border-green-300 dark:border-green-800 px-2 py-0.5">
              {t("install.available")}
            </span>
          </div>
          {/* Globe/PWA icon */}
          <svg className="w-8 h-8 text-green-600 dark:text-green-400 mb-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <h3 className="text-sm font-light text-black dark:text-white mb-2">
            PWA
          </h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 font-light mb-5">
            {t("install.pwaDesc")}
          </p>

          {!mounted ? null : installed ? (
            <p className="text-xs text-green-600 dark:text-green-400 font-light">
              {t("install.pwaInstalled")}
            </p>
          ) : deferredPrompt ? (
            <button
              onClick={handlePwaInstall}
              className="px-5 py-2 text-xs tracking-wider border border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white dark:hover:bg-green-400 dark:hover:text-black transition-all duration-300"
            >
              {t("install.pwaInstallButton")}
            </button>
          ) : showIOSGuide ? (
            <ol className="space-y-2 text-xs text-neutral-500 font-light">
              <li className="flex gap-2">
                <span className="text-neutral-300 dark:text-neutral-700 font-mono shrink-0">01</span>
                {t("install.ios02")}
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-300 dark:text-neutral-700 font-mono shrink-0">02</span>
                {t("install.ios03")}
              </li>
            </ol>
          ) : (
            <ol className="space-y-2 text-xs text-neutral-500 font-light">
              <li className="flex gap-2">
                <span className="text-neutral-300 dark:text-neutral-700 font-mono shrink-0">01</span>
                {t("install.android02")}
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-300 dark:text-neutral-700 font-mono shrink-0">02</span>
                {t("install.android03")}
              </li>
            </ol>
          )}
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
