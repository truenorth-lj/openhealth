"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  User,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  GraduationCap,
  Globe,
  Trash2,
  Crown,
  LayoutGrid,
} from "lucide-react";
import { deleteAccount } from "@/server/actions/account";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { SupportedLanguage } from "@open-health/shared/i18n";

const menuItems = [
  { href: "/settings/profile", labelKey: "settings:profile" as const, icon: User },
  { href: "/settings/subscription", labelKey: "settings:subscription" as const, icon: Crown },
  { href: "/settings/coaching", labelKey: "settings:coaching" as const, icon: GraduationCap },
  { href: "/settings/hub-config", labelKey: "settings:hubConfig" as const, icon: LayoutGrid },
];

const themeOptions = [
  { value: "light", labelKey: "theme.light" as const, icon: Sun },
  { value: "dark", labelKey: "theme.dark" as const, icon: Moon },
  { value: "system", labelKey: "theme.system" as const, icon: Monitor },
] as const;

const languageOptions = [
  { value: "zh-TW" as SupportedLanguage, labelKey: "settings:languageZhTW" as const },
  { value: "en" as SupportedLanguage, labelKey: "settings:languageEn" as const },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation(["common", "settings"]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/hub");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      router.push("/login");
    } catch {
      alert(t("settings:deleteAccountError"));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLanguageChange = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-light tracking-wide">{t("settings:title")}</h1>

      {session?.user && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.06]">
            <User className="h-5 w-5 text-neutral-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-light">{session.user.name}</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-600">
              {session.user.email}
            </p>
          </div>
        </div>
      )}

      {/* Theme selector */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          {t("theme.label")}
        </p>
        <div className="flex gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-light transition-all duration-300",
                theme === option.value
                  ? "border-foreground/20 text-foreground"
                  : "border-black/[0.06] dark:border-white/[0.06] text-neutral-400 dark:text-neutral-600 hover:text-foreground hover:border-foreground/10"
              )}
            >
              <option.icon className="h-4 w-4" strokeWidth={1.5} />
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Language selector */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          {t("settings:language")}
        </p>
        <div className="flex gap-2">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleLanguageChange(option.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-light transition-all duration-300",
                i18n.language === option.value
                  ? "border-foreground/20 text-foreground"
                  : "border-black/[0.06] dark:border-white/[0.06] text-neutral-400 dark:text-neutral-600 hover:text-foreground hover:border-foreground/10"
              )}
            >
              <Globe className="h-4 w-4" strokeWidth={1.5} />
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          {t("settings:account")}
        </p>
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-1 py-3.5 border-b border-black/[0.06] dark:border-white/[0.06] transition-all duration-300 hover:pl-2 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-neutral-400 dark:text-neutral-600" strokeWidth={1.5} />
                <span className="text-sm font-light">{t(item.labelKey)}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
            </Link>
          ))}
        </div>
      </div>

      {session?.user && (
        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm font-light text-neutral-400 transition-all duration-300 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            {t("auth.logout")}
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 py-3 text-xs font-light text-neutral-300 dark:text-neutral-700 transition-all duration-300 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t("settings:deleteAccount")}
            </button>
          ) : (
            <div className="rounded-lg border border-destructive/20 p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">
                {t("settings:deleteAccountConfirmTitle")}
              </p>
              <p className="text-xs font-light text-neutral-500">
                {t("settings:deleteAccountConfirmMessage")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border border-black/[0.06] dark:border-white/[0.06] py-2 text-sm font-light transition-all duration-300 hover:border-foreground/20"
                >
                  {t("settings:deleteAccountCancel")}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-destructive py-2 text-sm font-light text-white transition-all duration-300 hover:opacity-80 disabled:opacity-50"
                >
                  {isDeleting ? "..." : t("settings:deleteAccountConfirm")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
