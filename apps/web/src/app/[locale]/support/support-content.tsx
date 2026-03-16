"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteNav } from "@/components/layout/site-nav";
import { useLocalePath } from "@/hooks/use-locale-path";
import { defaultLocale, type Locale } from "@/lib/i18n-config";

const content = {
  "zh-TW": {
    label: "Support",
    title: "支援中心",
    intro: "我們在這裡幫助你。選擇以下方式取得協助。",
    contactTitle: "聯繫我們",
    contactDesc:
      "如果你遇到任何問題或有功能建議，歡迎透過以下方式聯繫我們：",
    emailLabel: "Email",
    responseTime: "我們通常會在 24 小時內回覆。",
    resourcesTitle: "自助資源",
    resources: [
      {
        title: "使用指南",
        desc: "了解如何安裝 Open Health 並開始追蹤你的健康。",
        link: "/docs",
      },
      {
        title: "常見問題",
        desc: "查看常見問題與解答。",
        link: "/docs#faq",
      },
      {
        title: "隱私權政策",
        desc: "了解我們如何保護你的資料。",
        link: "/privacy",
      },
    ],
    faqTitle: "常見問題",
    faqs: [
      {
        q: "如何重設密碼？",
        a: "目前可以透過 Email 聯繫 support@openhealth.blog，我們會協助你重設密碼。",
      },
      {
        q: "如何刪除我的帳號？",
        a: "請透過 Email 聯繫 support@openhealth.blog，我們會在確認身份後協助你刪除帳號及所有相關資料。",
      },
      {
        q: "App 支援哪些裝置？",
        a: "Open Health 同時提供 iOS App 與網頁版（PWA）。網頁版支援 iOS、Android 及桌面瀏覽器。",
      },
      {
        q: "我的資料安全嗎？",
        a: "你的健康資料儲存在加密的資料庫中，我們不會將你的資料出售或分享給第三方。詳見我們的隱私權政策。",
      },
    ],
    backToHome: "← 返回首頁",
  },
  en: {
    label: "Support",
    title: "Support Center",
    intro: "We're here to help. Choose an option below to get assistance.",
    contactTitle: "Contact Us",
    contactDesc:
      "If you encounter any issues or have feature suggestions, feel free to reach out:",
    emailLabel: "Email",
    responseTime: "We typically respond within 24 hours.",
    resourcesTitle: "Self-Service Resources",
    resources: [
      {
        title: "Documentation",
        desc: "Learn how to install Open Health and start tracking your health.",
        link: "/docs",
      },
      {
        title: "FAQ",
        desc: "Check frequently asked questions and answers.",
        link: "/docs#faq",
      },
      {
        title: "Privacy Policy",
        desc: "Learn how we protect your data.",
        link: "/privacy",
      },
    ],
    faqTitle: "Frequently Asked Questions",
    faqs: [
      {
        q: "How do I reset my password?",
        a: "Contact us at support@openhealth.blog and we'll help you reset your password.",
      },
      {
        q: "How do I delete my account?",
        a: "Contact us at support@openhealth.blog and we'll delete your account and all associated data after verifying your identity.",
      },
      {
        q: "What devices are supported?",
        a: "Open Health is available as an iOS app and a web app (PWA). The web version supports iOS, Android, and desktop browsers.",
      },
      {
        q: "Is my data safe?",
        a: "Your health data is stored in encrypted databases. We never sell or share your data with third parties. See our Privacy Policy for details.",
      },
    ],
    backToHome: "← Back to Home",
  },
};

export function SupportContent() {
  const params = useParams();
  const locale = ((params?.locale as string) || defaultLocale) as Locale;
  const t = content[locale] || content["zh-TW"];
  const lp = useLocalePath();

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <SiteNav />

      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16 md:pt-32 md:pb-24">
        <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-4">
          {t.label}
        </p>
        <h1 className="text-4xl md:text-5xl font-extralight mb-8">
          {t.title}
        </h1>
        <p className="text-neutral-500 font-light mb-20 max-w-xl text-sm leading-relaxed">
          {t.intro}
        </p>

        {/* Contact */}
        <section className="mb-20">
          <h2 className="text-xl font-light mb-6">{t.contactTitle}</h2>
          <div className="border-l border-black/[0.06] dark:border-white/[0.06] pl-6 space-y-4">
            <p className="text-neutral-500 font-light text-sm leading-relaxed">
              {t.contactDesc}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs tracking-widest text-neutral-400 dark:text-neutral-600 uppercase">
                {t.emailLabel}
              </span>
              <a
                href="mailto:support@openhealth.blog"
                className="text-sm font-light text-green-600 dark:text-green-400 hover:underline underline-offset-2"
              >
                support@openhealth.blog
              </a>
            </div>
            <p className="text-neutral-400 dark:text-neutral-600 font-light text-xs">
              {t.responseTime}
            </p>
          </div>
        </section>

        {/* Resources */}
        <section className="mb-20">
          <h2 className="text-xl font-light mb-6">{t.resourcesTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {t.resources.map((r) => (
              <Link
                key={r.link}
                href={lp(r.link)}
                className="block border border-black/[0.06] dark:border-white/[0.06] rounded-lg p-6 hover:border-black/20 dark:hover:border-white/20 transition-colors duration-300"
              >
                <h3 className="text-sm font-light mb-2">{r.title}</h3>
                <p className="text-neutral-500 dark:text-neutral-600 font-light text-xs leading-relaxed">
                  {r.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <h2 className="text-xl font-light mb-10">{t.faqTitle}</h2>
          <div className="space-y-8">
            {t.faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-sm font-light mb-2">{faq.q}</h3>
                <p className="text-neutral-500 dark:text-neutral-600 font-light text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-8">
          <Link
            href={lp("/")}
            className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
          >
            {t.backToHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
