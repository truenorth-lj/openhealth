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
  Activity,
  Download,
  Moon,
  GraduationCap,
  MessageCircle,
} from "lucide-react";

function LineIcon({ className, strokeWidth: _sw }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.271.173-.508.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M12 1c-6.627 0-12 4.208-12 9.399 0 4.662 4.131 8.564 9.713 9.301.378.082.89.258 1.019.592.118.303.077.778.038 1.085l-.164 1.025c-.045.303-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.006 24 11.792 24 9.399 24 5.208 18.627 1 12 1" />
    </svg>
  );
}
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
  platform?: "web" | "mobile";
  external?: boolean;
}

const sections: { title: string; items: HubItem[] }[] = [
  {
    title: "追蹤",
    items: [
      { href: "/hub/diary", label: "飲食記錄", icon: UtensilsCrossed, implemented: true },
      { href: "/hub/exercise", label: "運動記錄", icon: Activity, implemented: true },
      { href: "/hub/workout", label: "重訓記錄", icon: Dumbbell, implemented: true, badge: "新" },
      { href: "/hub/water", label: "水分追蹤", icon: Droplets, implemented: true },
      { href: "/hub/fasting", label: "間歇斷食", icon: Timer, implemented: true },
      { href: "", label: "睡眠追蹤", icon: Moon, implemented: true, badge: "新", platform: "mobile" },
      { href: "/hub/weight", label: "體重紀錄", icon: Scale, implemented: true },
      { href: "/hub/steps", label: "步數紀錄", icon: Footprints, implemented: true },
      { href: "/hub/posture", label: "姿勢提醒", icon: Armchair, implemented: true, badge: "新" },
    ],
  },
  {
    title: "工具",
    items: [
      { href: "/hub/chat", label: "AI 顧問", icon: Bot, implemented: true, badge: "新" },
      { href: "/hub/progress", label: "進度分析", icon: TrendingUp, implemented: true },
      { href: "/settings/goals", label: "目標設定", icon: Target, implemented: true },
      { href: "/hub/food/scan-label", label: "拍照辨識", icon: Camera, implemented: true },
      { href: "/hub/food", label: "食物資料庫", icon: Apple, implemented: true },
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
      { href: "/settings/coaching", label: "我的教練", icon: GraduationCap, implemented: true },
      { href: "/settings", label: "設定", icon: Settings2, implemented: true },
    ],
  },
  {
    title: "資料管理",
    items: [
      { href: "/settings/export", label: "匯出資料", icon: Download, implemented: true },
    ],
  },
  {
    title: "社群",
    items: [
      { href: "https://line.me/ti/g2/yoiSxP0jx7pJDEFjQtFLu87dwRsKIGnFIIkV3g?utm_source=invitation&utm_medium=link_copy&utm_campaign=default", label: "Line 社群", icon: LineIcon, implemented: true, external: true },
      { href: "https://github.com/truenorth-lj/open-health/issues", label: "問題回報", icon: MessageCircle, implemented: true, external: true },
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
                <HubIcon key={`${item.href}-${item.label}`} item={item} />
              ))}
            </div>
          </div>
        ))}
      </TooltipProvider>
    </div>
  );
}

function HubIcon({ item }: { item: HubItem }) {
  const isDisabled = !item.implemented || item.platform === "mobile";
  const tooltipText = item.platform === "mobile" ? "僅限 App" : "敬請期待";

  const badgeText = item.platform === "mobile" ? "App" : item.badge;
  const badgeStyle = item.platform === "mobile"
    ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
    : item.badge === "新"
      ? "bg-primary text-primary-foreground"
      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400";

  const content = (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.06] dark:border-white/[0.06] transition-all duration-300 group-hover:border-foreground/20 group-hover:shadow-sm">
        <item.icon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" strokeWidth={1.5} />
        {badgeText && (
          <span className={cn(
            "absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-medium rounded-full",
            badgeStyle
          )}>
            {badgeText}
          </span>
        )}
      </div>
      <span className="text-[11px] font-light text-neutral-500 dark:text-neutral-400 text-center leading-tight">
        {item.label}
      </span>
    </div>
  );

  if (isDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group flex justify-center opacity-40 cursor-not-allowed">
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="group flex justify-center">
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className="group flex justify-center">
      {content}
    </Link>
  );
}
