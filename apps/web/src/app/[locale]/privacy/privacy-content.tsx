"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SiteNav } from "@/components/layout/site-nav";
import { useLocalePath } from "@/hooks/use-locale-path";

export function PrivacyContent() {
  const { t } = useTranslation("privacy");
  const lp = useLocalePath();

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white min-h-screen">
      <SiteNav />

      <main className="max-w-3xl mx-auto px-6 py-20 md:py-32">
        <p className="text-[10px] tracking-[0.4em] text-neutral-400 dark:text-neutral-600 uppercase mb-4">
          Legal
        </p>
        <h1 className="text-3xl md:text-4xl font-extralight mb-4">
          {t("title")}
        </h1>
        <p className="text-neutral-400 dark:text-neutral-600 font-light text-sm mb-16">
          {t("lastUpdated")}
        </p>

        <div className="space-y-12 text-sm font-light leading-relaxed text-neutral-600 dark:text-neutral-400">
          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              {t("overview.title")}
            </h2>
            <p>{t("overview.desc")}</p>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              {t("dataCollected.title")}
            </h2>
            <ul className="space-y-3 list-none">
              <li>
                <strong className="text-black dark:text-white">{t("dataCollected.accountTitle")}</strong>
                {t("dataCollected.accountDesc")}
              </li>
              <li>
                <strong className="text-black dark:text-white">{t("dataCollected.profileTitle")}</strong>
                {t("dataCollected.profileDesc")}
              </li>
              <li>
                <strong className="text-black dark:text-white">{t("dataCollected.dietTitle")}</strong>
                {t("dataCollected.dietDesc")}
              </li>
              <li>
                <strong className="text-black dark:text-white">{t("dataCollected.imageTitle")}</strong>
                {t("dataCollected.imageDesc")}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              {t("dataUsage.title")}
            </h2>
            <p className="mb-3">{t("dataUsage.intro")}</p>
            <ul className="space-y-2 list-none">
              <li>{t("dataUsage.item1")}</li>
              <li>{t("dataUsage.item2")}</li>
              <li>{t("dataUsage.item3")}</li>
              <li>{t("dataUsage.item4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              {t("thirdParty.title")}
            </h2>
            <p className="mb-3">{t("thirdParty.intro")}</p>
            <ul className="space-y-2 list-none">
              <li>
                - <strong className="text-black dark:text-white">Google Generative AI（Gemini）</strong>
                {t("thirdParty.gemini")}
              </li>
              <li>
                - <strong className="text-black dark:text-white">Google OAuth</strong>
                {t("thirdParty.oauth")}
              </li>
              <li>
                - <strong className="text-black dark:text-white">Sentry</strong>
                {t("thirdParty.sentry")}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              {t("security.title")}
            </h2>
            <ul className="space-y-2 list-none">
              <li>{t("security.item1")}</li>
              <li>{t("security.item2")}</li>
              <li>{t("security.item3")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              {t("rights.title")}
            </h2>
            <p className="mb-3">{t("rights.intro")}</p>
            <ul className="space-y-2 list-none">
              <li>- <strong className="text-black dark:text-white">{t("rights.accessTitle")}</strong>{t("rights.accessDesc")}</li>
              <li>- <strong className="text-black dark:text-white">{t("rights.exportTitle")}</strong>{t("rights.exportDesc")}</li>
              <li>- <strong className="text-black dark:text-white">{t("rights.deleteTitle")}</strong>{t("rights.deleteDesc")}</li>
              <li>- <strong className="text-black dark:text-white">{t("rights.portabilityTitle")}</strong>{t("rights.portabilityDesc")}</li>
            </ul>
            <p className="mt-3">{t("rights.outro")}</p>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              {t("wontDo.title")}
            </h2>
            <ul className="space-y-2 list-none">
              <li>{t("wontDo.item1")}</li>
              <li>{t("wontDo.item2")}</li>
              <li>{t("wontDo.item3")}</li>
              <li>{t("wontDo.item4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              {t("changes.title")}
            </h2>
            <p>{t("changes.desc")}</p>
          </section>

          <section>
            <h2 className="text-base font-normal text-black dark:text-white mb-4">
              {t("contact.title")}
            </h2>
            <p>
              {t("contact.desc")}
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
            href={lp("/")}
            className="text-xs text-neutral-400 dark:text-neutral-600 hover:text-black dark:hover:text-white transition-colors duration-300 tracking-wider"
          >
            {t("backToHome")}
          </Link>
        </div>
      </main>
    </div>
  );
}
