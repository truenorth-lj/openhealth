"use client";

import Link from "next/link";
import {
  UtensilsCrossed,
  Activity,
  Dumbbell,
  Droplets,
  Timer,
  Moon,
  Scale,
  Footprints,
  Headphones,
  AlarmClock,
  Bot,
  TrendingUp,
  Target,
  Camera,
  Apple,
  Trophy,
  Gift,
  CreditCard,
  User,
  Settings2,
  Bell,
  GraduationCap,
  Download,
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
import { useTranslation } from "react-i18next";

interface HubItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  implemented: boolean;
  badgeKey?: string;
  platform?: "web" | "mobile";
  external?: boolean;
}

interface HubSection {
  titleKey: string;
  items: HubItem[];
}

const sections: HubSection[] = [
  {
    titleKey: "hub.sections.tracking",
    items: [
      { href: "/hub/diary", labelKey: "hub.items.diary", icon: UtensilsCrossed, implemented: true },
      { href: "/hub/exercise", labelKey: "hub.items.exercise", icon: Activity, implemented: true },
      { href: "/hub/workout", labelKey: "hub.items.workout", icon: Dumbbell, implemented: true, badgeKey: "hub.badges.new" },
      { href: "/hub/water", labelKey: "hub.items.water", icon: Droplets, implemented: true },
      { href: "/hub/fasting", labelKey: "hub.items.fasting", icon: Timer, implemented: true },
      { href: "", labelKey: "hub.items.sleep", icon: Moon, implemented: true, badgeKey: "hub.badges.new", platform: "mobile" },
      { href: "/hub/weight", labelKey: "hub.items.weight", icon: Scale, implemented: true },
      { href: "/hub/steps", labelKey: "hub.items.steps", icon: Footprints, implemented: true },
      { href: "", labelKey: "hub.items.postureDetection", icon: Headphones, implemented: true, badgeKey: "hub.badges.new", platform: "mobile" },
      { href: "/hub/posture", labelKey: "hub.items.posture", icon: AlarmClock, implemented: true, badgeKey: "hub.badges.new" },
    ],
  },
  {
    titleKey: "hub.sections.tools",
    items: [
      { href: "/hub/chat", labelKey: "hub.items.aiAdvisor", icon: Bot, implemented: true, badgeKey: "hub.badges.new" },
      { href: "/hub/progress", labelKey: "hub.items.progress", icon: TrendingUp, implemented: true },
      { href: "/settings/goals", labelKey: "hub.items.goals", icon: Target, implemented: true },
      { href: "/hub/food/scan-label", labelKey: "hub.items.scanLabel", icon: Camera, implemented: true },
      { href: "/hub/food", labelKey: "hub.items.foodDatabase", icon: Apple, implemented: true },
    ],
  },
  {
    titleKey: "hub.sections.life",
    items: [
      { href: "/achievements", labelKey: "hub.items.achievements", icon: Trophy, implemented: false, badgeKey: "hub.badges.coming" },
    ],
  },
  {
    titleKey: "hub.sections.account",
    items: [
      { href: "/settings/referral", labelKey: "hub.items.referral", icon: Gift, implemented: true },
      { href: "/settings/subscription", labelKey: "hub.items.subscription", icon: CreditCard, implemented: true },
      { href: "/settings/profile", labelKey: "hub.items.profile", icon: User, implemented: true },
      { href: "/settings/notifications", labelKey: "hub.items.notifications", icon: Bell, implemented: true },
      { href: "/settings/coaching", labelKey: "hub.items.coaching", icon: GraduationCap, implemented: true },
      { href: "/settings", labelKey: "hub.items.settings", icon: Settings2, implemented: true },
    ],
  },
  {
    titleKey: "hub.sections.dataManagement",
    items: [
      { href: "/settings/export", labelKey: "hub.items.export", icon: Download, implemented: true },
    ],
  },
  {
    titleKey: "hub.sections.community",
    items: [
      { href: "https://line.me/ti/g2/yoiSxP0jx7pJDEFjQtFLu87dwRsKIGnFIIkV3g?utm_source=invitation&utm_medium=link_copy&utm_campaign=default", labelKey: "hub.items.lineCommunity", icon: LineIcon, implemented: true, external: true },
      { href: "https://line.me/ti/g2/yoiSxP0jx7pJDEFjQtFLu87dwRsKIGnFIIkV3g?utm_source=invitation&utm_medium=link_copy&utm_campaign=default", labelKey: "hub.items.reportIssue", icon: MessageCircle, implemented: true, external: true },
    ],
  },
];

export default function HubPage() {
  const { t } = useTranslation("common");

  return (
    <div className="px-4 py-6 space-y-8">
      <h1 className="text-xl font-light tracking-wide">{t("hub.title")}</h1>

      <TooltipProvider>
        {sections.map((section) => (
          <div key={section.titleKey} className="space-y-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
              {t(section.titleKey)}
            </p>
            <div className={cn(
              "grid gap-3",
              section.items.length <= 3 ? "grid-cols-3" : section.items.length <= 4 ? "grid-cols-4" : "grid-cols-3"
            )}>
              {section.items.map((item) => (
                <HubIcon key={`${item.href}-${item.labelKey}`} item={item} />
              ))}
            </div>
          </div>
        ))}
      </TooltipProvider>
    </div>
  );
}

function HubIcon({ item }: { item: HubItem }) {
  const { t } = useTranslation("common");
  const isDisabled = !item.implemented || item.platform === "mobile";
  const tooltipText = item.platform === "mobile"
    ? t("hub.tooltips.mobileOnly")
    : !item.implemented
      ? t("hub.tooltips.comingSoon")
      : "";

  const badgeText = item.platform === "mobile"
    ? t("hub.badges.app")
    : item.platform === "web"
      ? t("hub.badges.web")
      : item.badgeKey
        ? t(item.badgeKey)
        : undefined;

  const badgeStyle = item.platform === "mobile" || item.platform === "web"
    ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
    : item.badgeKey === "hub.badges.new"
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
        {t(item.labelKey)}
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
