import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";

export const metadata: Metadata = {
  title: "隱私權政策 - Open Health",
  description: "Open Health 隱私權政策，說明我們如何收集、使用與保護你的個人資料。",
};

export default function PrivacyPage() {
  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <SiteNav />

      <main className="max-w-3xl mx-auto px-6 py-20 md:py-32">
        <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-4">
          Legal
        </p>
        <h1 className="text-3xl md:text-4xl font-extralight mb-4">
          隱私權政策
        </h1>
        <p className="text-neutral-400 dark:text-neutral-600 font-light text-sm mb-16">
          最後更新日期：2025 年 3 月 4 日
        </p>

        <div className="space-y-12 text-sm font-light leading-relaxed text-neutral-600 dark:text-neutral-400">
          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              概述
            </h2>
            <p>
              Open Health（以下簡稱「本服務」）重視你的隱私。本隱私權政策說明我們在你使用本服務時，如何收集、使用、儲存與保護你的個人資料。
            </p>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              我們收集的資料
            </h2>
            <ul className="space-y-3 list-none">
              <li>
                <strong className="text-black dark:text-white">帳號資料</strong>
                ：電子郵件地址、密碼（加密儲存）。若使用 Google 登入，我們會取得你的 Google 帳號名稱與電子郵件。
              </li>
              <li>
                <strong className="text-black dark:text-white">個人檔案</strong>
                ：你主動提供的身高、體重、年齡、性別等資料，用於計算每日營養目標。
              </li>
              <li>
                <strong className="text-black dark:text-white">飲食記錄</strong>
                ：你記錄的食物、營養素攝取、飲水量、體重變化等健康追蹤資料。
              </li>
              <li>
                <strong className="text-black dark:text-white">上傳的圖片</strong>
                ：你上傳的營養標示照片，用於 AI 辨識後即處理，不會長期儲存原始圖片。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              資料使用方式
            </h2>
            <p className="mb-3">我們僅在以下目的範圍內使用你的資料：</p>
            <ul className="space-y-2 list-none">
              <li>- 提供飲食記錄、營養追蹤、體重管理等核心功能</li>
              <li>- 透過 AI 辨識營養標示以簡化食物記錄流程</li>
              <li>- 計算並顯示個人化的營養目標與進度</li>
              <li>- 維護與改善服務品質</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              第三方服務
            </h2>
            <p className="mb-3">本服務使用以下第三方服務：</p>
            <ul className="space-y-2 list-none">
              <li>
                - <strong className="text-black dark:text-white">Google Generative AI（Gemini）</strong>
                ：用於營養標示圖片辨識。上傳的圖片會傳送至 Google API 進行處理。
              </li>
              <li>
                - <strong className="text-black dark:text-white">Google OAuth</strong>
                ：提供第三方登入選項。
              </li>
              <li>
                - <strong className="text-black dark:text-white">Sentry</strong>
                ：用於錯誤追蹤與服務穩定性監控，可能收集匿名的錯誤報告資料。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              資料儲存與安全
            </h2>
            <ul className="space-y-2 list-none">
              <li>- 你的資料儲存於受保護的 PostgreSQL 資料庫中</li>
              <li>- 密碼經過加密處理，我們無法取得你的明文密碼</li>
              <li>- 所有資料傳輸皆透過 HTTPS 加密</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              你的資料權利
            </h2>
            <p className="mb-3">
              你對自己的資料擁有完全的主控權：
            </p>
            <ul className="space-y-2 list-none">
              <li>- <strong className="text-black dark:text-white">存取</strong>：你可以隨時查看自己的所有資料</li>
              <li>- <strong className="text-black dark:text-white">匯出</strong>：你可以匯出自己的完整資料</li>
              <li>- <strong className="text-black dark:text-white">刪除</strong>：你可以要求刪除帳號及所有相關資料</li>
              <li>- <strong className="text-black dark:text-white">攜帶</strong>：我們不會以任何方式阻止你帶走自己的資料</li>
            </ul>
            <p className="mt-3">
              我們不會為了留住用戶而設置任何資料匯出障礙，或做任何損害用戶利益的事。
            </p>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              我們不會做的事
            </h2>
            <ul className="space-y-2 list-none">
              <li>- 我們不會將你的個人資料出售給第三方</li>
              <li>- 我們不會在服務中投放廣告</li>
              <li>- 我們不會在未經你同意的情況下分享你的資料</li>
              <li>- 我們不會使用你的健康資料進行行銷</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              政策變更
            </h2>
            <p>
              本隱私權政策可能會不定期更新。重大變更時，我們會透過服務內通知或電子郵件告知你。繼續使用本服務即表示你同意更新後的政策。
            </p>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              聯絡我們
            </h2>
            <p>
              如對本隱私權政策有任何疑問，請透過電子郵件聯繫我們：
              <a
                href="mailto:support@openhealth.blog"
                className="text-black dark:text-white underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-black dark:hover:decoration-white transition-colors"
              >
                support@openhealth.blog
              </a>
            </p>
          </section>
        </div>

        <div className="mt-20 pt-8 border-t border-black/[0.06] dark:border-white/[0.06]">
          <Link
            href="/"
            className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
          >
            返回首頁 →
          </Link>
        </div>
      </main>
    </div>
  );
}
