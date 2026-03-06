"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  User,
  Target,
  Droplets,
  Timer,
  Trophy,
  Dumbbell,
  LogOut,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  Monitor,
  Gift,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/settings/profile", label: "個人資料", icon: User, implemented: true },
  { href: "/settings/goals", label: "目標設定", icon: Target, implemented: true },
  { href: "/settings/referral", label: "推薦碼", icon: Gift, implemented: true },
  { href: "/settings/subscription", label: "訂閱方案", icon: CreditCard, implemented: true },
  { href: "/water", label: "水分追蹤", icon: Droplets, implemented: true },
  { href: "/exercise", label: "運動記錄", icon: Dumbbell, implemented: false },
  { href: "/fasting", label: "間歇性斷食", icon: Timer, implemented: true },
  { href: "/achievements", label: "成就", icon: Trophy, implemented: false },
  { href: "/settings/notifications", label: "通知設定", icon: Bell, implemented: false },
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
    router.push("/diary");
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-light tracking-wide">更多</h1>

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
          設定
        </p>
        <div className="border-t border-black/[0.06] dark:border-white/[0.06]">
          <TooltipProvider>
            {menuItems.map((item) => {
              const itemClass = cn(
                "flex items-center justify-between px-1 py-3.5 border-b border-black/[0.06] dark:border-white/[0.06] transition-all duration-300",
                item.implemented
                  ? "hover:pl-2 cursor-pointer"
                  : "opacity-40 cursor-not-allowed"
              );

              const content = (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-neutral-400 dark:text-neutral-600" strokeWidth={1.5} />
                    <span className="text-sm font-light">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />
                </>
              );

              if (item.implemented) {
                return (
                  <Link key={item.href} href={item.href} className={itemClass}>
                    {content}
                  </Link>
                );
              }

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <div className={itemClass}>{content}</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>敬請期待</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
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
