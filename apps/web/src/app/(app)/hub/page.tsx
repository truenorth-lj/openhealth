"use client";

import Link from "next/link";
import {
  UtensilsCrossed,
  Dumbbell,
  Droplets,
  Bot,
  TrendingUp,
  Target,
  Camera,
  Timer,
  Scale,
  Footprints,
  Trophy,
  Gift,
  CreditCard,
  User,
  Settings2,
  Bell,
  Apple,
  Armchair,
  Weight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HubItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  implemented: boolean;
  badge?: string;
}

const sections: { title: string; items: HubItem[] }[] = [
  {
    title: "追蹤",
    items: [
      { href: "/diary", label: "飲食記錄", icon: UtensilsCrossed, implemented: true },
      { href: "/exercise", label: "運動記錄", icon: Dumbbell, implemented: true },
      { href: "/workout", label: "重訓記錄", icon: Weight, implemented: true, badge: "新" },
      { href: "/water", label: "水分追蹤", icon: Droplets, implemented: true },
      { href: "/fasting", label: "間歇斷食", icon: Timer, implemented: true },
      { href: "/progress?tab=weight", label: "體重紀錄", icon: Scale, implemented: true },
      { href: "/progress?tab=steps", label: "步數紀錄", icon: Footprints, implemented: true },
      { href: "/posture", label: "姿勢提醒", icon: Armchair, implemented: true, badge: "新" },
    ],
  },
  {
    title: "工具",
    items: [
      { href: "/chat", label: "AI 顧問", icon: Bot, implemented: true, badge: "新" },
      { href: "/progress", label: "進度分析", icon: TrendingUp, implemented: true },
      { href: "/settings/goals", label: "目標設定", icon: Target, implemented: true },
      { href: "/food/scan-label", label: "拍照辨識", icon: Camera, implemented: true },
      { href: "/food", label: "食物資料庫", icon: Apple, implemented: true },
    ],
  },
  {
    title: "生活",
    items: [
      { href: "/achievements", label: "成就", icon: Trophy, implemented: false, badge: "即將" },
    ],
  },
  {
    title: "帳號",
    items: [
      { href: "/settings/referral", label: "推薦碼", icon: Gift, implemented: true },
      { href: "/settings/subscription", label: "訂閱方案", icon: CreditCard, implemented: true },
      { href: "/settings/profile", label: "個人資料", icon: User, implemented: true },
      { href: "/settings/notifications", label: "通知設定", icon: Bell, implemented: true },
      { href: "/settings", label: "設定", icon: Settings2, implemented: true },
    ],
  },
];

export default function HubPage() {
  return (
    <div className="px-4 py-6 space-y-8">
      <h1 className="text-xl font-light tracking-wide">功能總覽</h1>

      <TooltipProvider>
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
              {section.title}
            </p>
            <div className={cn(
              "grid gap-3",
              section.items.length <= 3 ? "grid-cols-3" : section.items.length <= 4 ? "grid-cols-4" : "grid-cols-3"
            )}>
              {section.items.map((item) => (
                <HubIcon key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </TooltipProvider>
    </div>
  );
}

function HubIcon({ item }: { item: HubItem }) {
  const content = (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.06] dark:border-white/[0.06] transition-all duration-300 group-hover:border-foreground/20 group-hover:shadow-sm">
        <item.icon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" strokeWidth={1.5} />
        {item.badge && (
          <span className={cn(
            "absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-medium rounded-full",
            item.badge === "新"
              ? "bg-primary text-primary-foreground"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
          )}>
            {item.badge}
          </span>
        )}
      </div>
      <span className="text-[11px] font-light text-neutral-500 dark:text-neutral-400 text-center leading-tight">
        {item.label}
      </span>
    </div>
  );

  if (!item.implemented) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group flex justify-center opacity-40 cursor-not-allowed">
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>敬請期待</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={item.href} className="group flex justify-center">
      {content}
    </Link>
  );
}
