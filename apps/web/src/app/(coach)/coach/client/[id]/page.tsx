"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { ClientInfoHeader } from "@/components/coach/client-info-header";
import { CoachNotesEditor } from "@/components/coach/coach-notes-editor";
import { WeekNavigator } from "@/components/coach/week-navigator";
import { WeeklyDataTable } from "@/components/coach/weekly-data-table";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
        請先登入
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-neutral-400">
        載入中...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-20 text-center text-sm text-neutral-400">
        找不到此學員
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/coach"
        className="inline-flex items-center gap-1.5 text-sm font-light text-neutral-500 transition-all hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        返回學員列表
      </Link>

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
          教練備註與目標
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
            每週數據
          </p>
          <WeekNavigator weekStart={weekStart} onWeekChange={setWeekStart} />
        </div>

        {weekLoading ? (
          <div className="py-10 text-center text-sm text-neutral-400">
            載入中...
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
