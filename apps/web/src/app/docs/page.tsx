import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";

export const metadata: Metadata = {
  title: "安裝指南 — Open Health",
  description: "了解如何將 Open Health 安裝到你的裝置上。支援 iOS、Android 與桌面瀏覽器。",
};

function Step({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-6 border-b border-black/[0.06] dark:border-white/[0.06] grid grid-cols-1 md:grid-cols-[50px_180px_1fr] gap-2 md:gap-8 items-baseline">
      <span className="text-xs font-mono text-neutral-300 dark:text-neutral-700">{num}</span>
      <h3 className="text-black dark:text-white font-light text-sm">{title}</h3>
      <p className="text-neutral-500 font-light text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <SiteNav />

      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16 md:pt-32 md:pb-24">
        <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-4">
          Documentation
        </p>
        <h1 className="text-4xl md:text-5xl font-extralight mb-8">安裝指南</h1>
        <p className="text-neutral-500 font-light mb-20 max-w-xl text-sm leading-relaxed">
          Open Health 是一個 Progressive Web App (PWA)。
          無需透過 App Store 或 Google Play 下載，直接從瀏覽器安裝到裝置主畫面，
          享受接近原生應用的體驗。
        </p>

        {/* What is PWA */}
        <section className="mb-20">
          <h2 className="text-xl font-light mb-6">什麼是 PWA？</h2>
          <div className="border-l border-black/[0.06] dark:border-white/[0.06] pl-6">
            <p className="text-neutral-500 font-light leading-loose text-sm">
              Progressive Web App 是一種可以安裝到裝置上的網頁應用程式。
              安裝後，它會像一般 App 一樣出現在主畫面上，擁有獨立的應用視窗，
              支援離線快取與推送通知。不佔用大量儲存空間，永遠保持最新版本。
            </p>
          </div>
        </section>

        {/* iOS */}
        <section className="mb-20">
          <h2 className="text-xs tracking-[0.3em] text-neutral-500 uppercase mb-10 font-mono">
            iOS / iPadOS
          </h2>
          <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
            <Step num="01" title="開啟 Safari">
              必須使用 Safari 瀏覽器。iOS 上的 Chrome 和 Firefox 不支援 PWA 安裝。
            </Step>
            <Step num="02" title="前往網站">
              在網址列輸入 openhealth.blog 並前往。
            </Step>
            <Step num="03" title="點選分享按鈕">
              點選 Safari 底部工具列的分享按鈕（方形加上箭頭的圖示 ↑）。
            </Step>
            <Step num="04" title="加入主畫面">
              在分享選單中向下滑動，找到「加入主畫面」選項並點選。
            </Step>
            <Step num="05" title="確認安裝">
              可自訂名稱，然後點選右上角的「新增」完成安裝。
            </Step>
          </div>
        </section>

        {/* Android */}
        <section className="mb-20">
          <h2 className="text-xs tracking-[0.3em] text-neutral-500 uppercase mb-10 font-mono">
            Android
          </h2>
          <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
            <Step num="01" title="開啟 Chrome">
              建議使用 Chrome 瀏覽器以獲得最佳體驗。
            </Step>
            <Step num="02" title="前往網站">
              在網址列輸入 openhealth.blog 並前往。
            </Step>
            <Step num="03" title="開啟選單">
              點選右上角的三個點選單（⋮）。
            </Step>
            <Step num="04" title="安裝應用程式">
              在選單中找到「安裝應用程式」或「加入主畫面」選項。
            </Step>
            <Step num="05" title="確認安裝">
              點選「安裝」完成。App 會出現在主畫面上。
            </Step>
          </div>
        </section>

        {/* Desktop */}
        <section className="mb-20">
          <h2 className="text-xs tracking-[0.3em] text-neutral-500 uppercase mb-10 font-mono">
            Desktop / Chrome
          </h2>
          <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
            <Step num="01" title="開啟 Chrome">
              在電腦上使用 Chrome 或 Edge 瀏覽器。
            </Step>
            <Step num="02" title="前往網站">
              在網址列輸入 openhealth.blog。
            </Step>
            <Step num="03" title="安裝">
              點選網址列右側的安裝圖示（⊕），或從選單中選擇「安裝 Open Health」。
            </Step>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h2 className="text-xl font-light mb-10">常見問題</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-light mb-2">
                PWA 和原生 App 有什麼不同？
              </h3>
              <p className="text-neutral-500 dark:text-neutral-600 font-light text-sm leading-relaxed">
                PWA 透過瀏覽器技術運行，不需要從應用商店安裝。它佔用更少的儲存空間，
                且永遠是最新版本。功能上與原生 App 幾乎沒有差別。
              </p>
            </div>
            <div>
              <h3 className="text-sm font-light mb-2">
                可以離線使用嗎？
              </h3>
              <p className="text-neutral-500 dark:text-neutral-600 font-light text-sm leading-relaxed">
                基本的頁面瀏覽可以離線使用。資料同步需要網路連線。
              </p>
            </div>
            <div>
              <h3 className="text-sm font-light mb-2">
                如何更新 PWA？
              </h3>
              <p className="text-neutral-500 dark:text-neutral-600 font-light text-sm leading-relaxed">
                PWA 會自動更新。每次開啟時，Service Worker 會在背景檢查是否有新版本。
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-8">
          <Link
            href="/"
            className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
          >
            ← 返回首頁
          </Link>
        </div>
      </main>
    </div>
  );
}
