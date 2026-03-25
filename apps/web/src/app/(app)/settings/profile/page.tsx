"use client";

import { useState, useTransition, useEffect } from "react";
import { ArrowLeft, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { signOut, useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { updateProfile } from "@/server/actions/profile";
import posthog from "posthog-js";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { t } = useTranslation(["settings", "common"]);
  const { data: session, isPending: sessionPending } = useSession();
  const { data: profile, isLoading: profileLoading } = trpc.user.getProfile.useQuery();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderately_active");

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
    setError("");
    startTransition(async () => {
      const result = await updateProfile({
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
      if (!result.success) {
        setError(result.error);
        return;
      }
      posthog.capture("profile_updated");
      setSaved(true);
      router.refresh();
    });
  };

  const handleSignOut = async () => {
    posthog.capture("user_logged_out");
    posthog.reset();
    await signOut();
    router.push("/hub");
  };

  if (sessionPending || profileLoading) return <LoadingSpinner />;

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 text-neutral-400 transition-all duration-300 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-light tracking-wide">{t("profile")}</h1>
      </div>

      {/* Basic info */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          {t("profilePage.basicInfo")}
        </p>
        <div className="space-y-4 border-t border-black/[0.06] dark:border-white/[0.06] pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-light text-neutral-500">{t("profilePage.name")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-black/[0.06] dark:border-white/[0.06] font-light"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-light text-neutral-500">{t("profilePage.email")}</label>
            <Input
              defaultValue={session?.user?.email || ""}
              disabled
              className="border-black/[0.06] dark:border-white/[0.06] font-light"
            />
          </div>
        </div>
      </div>

      {/* Body info */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          {t("profilePage.bodyInfo")}
        </p>
        <div className="space-y-4 border-t border-black/[0.06] dark:border-white/[0.06] pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-light text-neutral-500">{t("profilePage.sex")}</label>
              <select
                className="flex h-10 w-full rounded-md border border-black/[0.06] dark:border-white/[0.06] bg-background px-3 py-2 text-sm font-light"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
              >
                <option value="">{t("profilePage.selectSex")}</option>
                <option value="male">{t("profilePage.male")}</option>
                <option value="female">{t("profilePage.female")}</option>
                <option value="other">{t("profilePage.other")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-light text-neutral-500">{t("profilePage.height")}</label>
              <Input
                type="number"
                placeholder="170"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="border-black/[0.06] dark:border-white/[0.06] font-light"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-light text-neutral-500">{t("profilePage.dateOfBirth")}</label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="border-black/[0.06] dark:border-white/[0.06] font-light"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-light text-neutral-500">{t("profilePage.activityLevel")}</label>
              <select
                className="flex h-10 w-full rounded-md border border-black/[0.06] dark:border-white/[0.06] bg-background px-3 py-2 text-sm font-light"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
              >
                <option value="sedentary">{t("profilePage.sedentary")}</option>
                <option value="lightly_active">{t("profilePage.lightlyActive")}</option>
                <option value="moderately_active">{t("profilePage.moderatelyActive")}</option>
                <option value="very_active">{t("profilePage.veryActive")}</option>
                <option value="extremely_active">{t("profilePage.extremelyActive")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive font-light">{error}</p>
      )}

      <button
        className="w-full py-2.5 text-sm font-light border border-black/[0.06] dark:border-white/[0.06] rounded-md transition-all duration-300 hover:border-foreground/20 disabled:opacity-30"
        onClick={handleSave}
        disabled={isPending}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
            {t("profilePage.saving")}
          </span>
        ) : saved ? (
          t("profilePage.saved")
        ) : (
          t("common:buttons.save")
        )}
      </button>

      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 py-2.5 text-sm font-light text-neutral-400 transition-all duration-300 hover:text-destructive"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        {t("profilePage.signOut")}
      </button>
    </div>
  );
}
