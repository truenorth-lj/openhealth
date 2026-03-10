"use client";

import { useTranslation } from "react-i18next";
import { User } from "lucide-react";

type Sex = "male" | "female" | "other";
type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extremely_active";

interface ClientInfoHeaderProps {
  name: string;
  email: string;
  image: string | null;
  heightCm: string | null; // Drizzle decimal returns string
  sex: Sex | null;
  dateOfBirth: string | null;
  activityLevel: ActivityLevel | null;
  latestWeight: { weightKg: string; date: string } | null;
  bmr: number | null;
  tdee: number | null;
}

const ACTIVITY_KEYS: Record<string, string> = {
  sedentary: "activitySedentary",
  lightly_active: "activityLightlyActive",
  moderately_active: "activityModeratelyActive",
  very_active: "activityVeryActive",
  extremely_active: "activityExtremelyActive",
};

export function ClientInfoHeader({
  name,
  email,
  heightCm,
  sex,
  activityLevel,
  latestWeight,
  bmr,
  tdee,
}: ClientInfoHeaderProps) {
  const { t } = useTranslation("coach");

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.06]">
          <User className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-light">{name}</h2>
          <p className="text-xs text-neutral-400 dark:text-neutral-600">
            {email}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 sm:ml-auto">
        {latestWeight && (
          <InfoChip
            label={t("weight")}
            value={`${Number(latestWeight.weightKg).toFixed(1)} kg`}
          />
        )}
        {heightCm && <InfoChip label={t("height")} value={`${heightCm} cm`} />}
        {sex && (
          <InfoChip
            label={t("sex")}
            value={sex === "male" ? t("sexMale") : sex === "female" ? t("sexFemale") : t("sexOther")}
          />
        )}
        {activityLevel && (
          <InfoChip
            label={t("activityLevel")}
            value={ACTIVITY_KEYS[activityLevel] ? t(ACTIVITY_KEYS[activityLevel]) : activityLevel}
          />
        )}
        {bmr != null && <InfoChip label="BMR" value={`${bmr} kcal`} />}
        {tdee != null && <InfoChip label="TDEE" value={`${tdee} kcal`} />}
      </div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] tracking-wider text-neutral-400 dark:text-neutral-600 uppercase">
        {label}
      </p>
      <p className="text-sm font-light">{value}</p>
    </div>
  );
}
