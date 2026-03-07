"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";

interface CoachNotesEditorProps {
  clientId: string;
  initialNotes: string | null;
  initialCalorieTarget: number | null;
  initialProteinPct: string | null;
  initialCarbsPct: string | null;
  initialFatPct: string | null;
}

export function CoachNotesEditor({
  clientId,
  initialNotes,
  initialCalorieTarget,
  initialProteinPct,
  initialCarbsPct,
  initialFatPct,
}: CoachNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [calorieTarget, setCalorieTarget] = useState(
    initialCalorieTarget?.toString() ?? ""
  );
  const [proteinPct, setProteinPct] = useState(initialProteinPct ?? "");
  const [carbsPct, setCarbsPct] = useState(initialCarbsPct ?? "");
  const [fatPct, setFatPct] = useState(initialFatPct ?? "");

  const utils = trpc.useUtils();
  const mutation = trpc.coach.updateClientNotes.useMutation({
    onSuccess: () => {
      toast.success("已儲存");
      utils.coach.getClientDetail.invalidate({ clientId });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSave = () => {
    mutation.mutate({
      clientId,
      coachNotes: notes || undefined,
      calorieTarget: calorieTarget ? parseInt(calorieTarget) : null,
      proteinPct: proteinPct ? parseFloat(proteinPct) : null,
      carbsPct: carbsPct ? parseFloat(carbsPct) : null,
      fatPct: fatPct ? parseFloat(fatPct) : null,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-neutral-400 dark:text-neutral-600 block mb-1.5">
          教練備註
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="例：每天攝取熱量 2306大卡，蛋白質30% 碳水45% 脂肪25%"
          className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2 text-sm font-light placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none focus:border-foreground/20"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-neutral-400 dark:text-neutral-600 block mb-1.5">
            熱量目標 (kcal)
          </label>
          <input
            type="number"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(e.target.value)}
            placeholder="2300"
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:border-foreground/20"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400 dark:text-neutral-600 block mb-1.5">
            蛋白質 %
          </label>
          <input
            type="number"
            value={proteinPct}
            onChange={(e) => setProteinPct(e.target.value)}
            placeholder="30"
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:border-foreground/20"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400 dark:text-neutral-600 block mb-1.5">
            碳水 %
          </label>
          <input
            type="number"
            value={carbsPct}
            onChange={(e) => setCarbsPct(e.target.value)}
            placeholder="45"
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:border-foreground/20"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400 dark:text-neutral-600 block mb-1.5">
            脂肪 %
          </label>
          <input
            type="number"
            value={fatPct}
            onChange={(e) => setFatPct(e.target.value)}
            placeholder="25"
            className="w-full rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-transparent px-3 py-2 text-sm font-light focus:outline-none focus:border-foreground/20"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={mutation.isPending}
        className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-light transition-all hover:bg-foreground/5 disabled:opacity-50"
      >
        {mutation.isPending ? "儲存中..." : "儲存備註"}
      </button>
    </div>
  );
}
