"use client";

import { useState, useTransition, useEffect } from "react";
import { ArrowLeft, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { updateProfile } from "@/server/actions/profile";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: profile } = trpc.user.getProfile.useQuery();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderately_active");

  // Pre-fill when data loads
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && session?.user && profile !== undefined) {
      setName(session.user.name || "");
      setSex(profile?.sex || "");
      setHeightCm(profile?.heightCm ? String(profile.heightCm) : "");
      setDateOfBirth(profile?.dateOfBirth || "");
      setActivityLevel(profile?.activityLevel || "moderately_active");
      setInitialized(true);
    }
  }, [session, profile, initialized]);

  const handleSave = () => {
    setSaved(false);
    startTransition(async () => {
      await updateProfile({
        name,
        sex: sex ? (sex as "male" | "female" | "other") : null,
        heightCm: heightCm ? Number(heightCm) : null,
        dateOfBirth: dateOfBirth || null,
        activityLevel: activityLevel
          ? (activityLevel as
              | "sedentary"
              | "lightly_active"
              | "moderately_active"
              | "very_active"
              | "extremely_active")
          : null,
      });
      setSaved(true);
      router.refresh();
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/diary");
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">個人資料</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本資料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">名稱</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">電子郵件</label>
            <Input defaultValue={session?.user?.email || ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">身體資料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">性別</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
              >
                <option value="">選擇</option>
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">身高 (cm)</label>
              <Input
                type="number"
                placeholder="170"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">出生日期</label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">活動量</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
              >
                <option value="sedentary">久坐</option>
                <option value="lightly_active">輕度活動</option>
                <option value="moderately_active">中度活動</option>
                <option value="very_active">高度活動</option>
                <option value="extremely_active">極高活動</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSave} disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            儲存中...
          </>
        ) : saved ? (
          "已儲存"
        ) : (
          "儲存"
        )}
      </Button>

      <Button
        variant="outline"
        className="w-full text-destructive hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        登出
      </Button>
    </div>
  );
}
