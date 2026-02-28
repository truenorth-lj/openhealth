"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  User,
  Target,
  Bell,
  Droplets,
  Timer,
  Trophy,
  Dumbbell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { href: "/settings/profile", label: "個人資料", icon: User, implemented: true },
  { href: "/settings/goals", label: "目標設定", icon: Target, implemented: true },
  { href: "/water", label: "水分追蹤", icon: Droplets, implemented: true },
  { href: "/exercise", label: "運動記錄", icon: Dumbbell, implemented: false },
  { href: "/fasting", label: "間歇性斷食", icon: Timer, implemented: false },
  { href: "/achievements", label: "成就", icon: Trophy, implemented: false },
  { href: "/settings/notifications", label: "通知設定", icon: Bell, implemented: false },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/diary");
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold">更多</h1>

      {session?.user && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{session.user.name}</p>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <TooltipProvider>
            {menuItems.map((item, index) => {
              const className = `flex items-center justify-between px-4 py-3 transition-colors ${
                index !== menuItems.length - 1 ? "border-b" : ""
              } ${
                item.implemented
                  ? "hover:bg-muted/50 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`;

              const content = (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </>
              );

              if (item.implemented) {
                return (
                  <Link key={item.href} href={item.href} className={className}>
                    {content}
                  </Link>
                );
              }

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <div className={className}>{content}</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>敬請期待</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </CardContent>
      </Card>

      {session?.user && (
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          登出
        </Button>
      )}
    </div>
  );
}
