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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/settings/profile", label: "個人資料", icon: User },
  { href: "/settings/coaching", label: "我的教練", icon: GraduationCap },
];

const themeOptions = [
  { value: "light", label: "淺色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "系統", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.push("/hub");
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-light tracking-wide">設定</h1>

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
          外觀
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
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          帳號
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
                <span className="text-sm font-light">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
            </Link>
          ))}
        </div>
      </div>

      {session?.user && (
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 py-3 text-sm font-light text-neutral-400 transition-all duration-300 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          登出
        </button>
      )}
    </div>
  );
}
