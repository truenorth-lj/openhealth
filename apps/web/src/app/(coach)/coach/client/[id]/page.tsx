"use client";

import { use, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { ClientInfoHeader } from "@/components/coach/client-info-header";
import { CoachNotesEditor } from "@/components/coach/coach-notes-editor";
import { WeekNavigator } from "@/components/coach/week-navigator";
import { WeeklyDataTable } from "@/components/coach/weekly-data-table";

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = use(params);
  const { t } = useTranslation("coach");
  const { data: session } = useSession();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const { data: detail, isLoading } = trpc.coach.getClientDetail.useQuery(
    { clientId },
    { enabled: !!session?.user }
  );

  const { data: weeklyData, isLoading: weekLoading } =
    trpc.coach.getClientWeeklyData.useQuery(
      { clientId, weekStart },
      { enabled: !!session?.user }
    );

  if (!session?.user) {
    return (
      <div className="py-20 text-center text-sm text-neutral-400">
        {t("auth.pleaseLoginFirst", { ns: "common" })}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-neutral-400">
        {t("buttons.loading", { ns: "common" })}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-20 text-center text-sm text-neutral-400">
        {t("clientNotFound")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ClientInfoHeader
        name={detail.client.name}
        email={detail.client.email}
        image={detail.client.image}
        heightCm={detail.profile?.heightCm ?? null}
        sex={detail.profile?.sex ?? null}
        dateOfBirth={detail.profile?.dateOfBirth ?? null}
        activityLevel={detail.profile?.activityLevel ?? null}
        latestWeight={detail.latestWeight}
        bmr={detail.bmr}
        tdee={detail.tdee}
      />

      {/* Coach Notes */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
          {t("coachNotesAndGoals")}
        </p>
        <CoachNotesEditor
          clientId={clientId}
          initialNotes={detail.coaching.coachNotes}
          initialCalorieTarget={detail.coaching.calorieTarget}
          initialProteinPct={detail.coaching.proteinPct}
          initialCarbsPct={detail.coaching.carbsPct}
          initialFatPct={detail.coaching.fatPct}
        />
      </div>

      {/* Weekly Data */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 dark:text-neutral-600">
            {t("weeklyData")}
          </p>
          <WeekNavigator weekStart={weekStart} onWeekChange={setWeekStart} />
        </div>

        {weekLoading ? (
          <div className="py-10 text-center text-sm text-neutral-400">
            {t("buttons.loading", { ns: "common" })}
          </div>
        ) : weeklyData ? (
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
            <WeeklyDataTable
              days={weeklyData.days}
              averages={weeklyData.averages}
              calorieTarget={detail.coaching.calorieTarget}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
