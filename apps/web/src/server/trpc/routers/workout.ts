import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import {
  workouts,
  workoutExercises,
  workoutSets,
  workoutTemplates,
  workoutTemplateExercises,
  exercises,
  personalRecords,
} from "@/server/db/schema";
import { eq, and, desc, isNull, sql, gte, lte } from "drizzle-orm";
import { canAccessFeature } from "@/server/services/plan";

function assertExerciseAccess(userPlan: string) {
  if (!canAccessFeature(userPlan as "free" | "pro", "exercise")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "重訓記錄為 Pro 功能",
    });
  }
}

export const workoutRouter = router({
  getActive: protectedProcedure.query(async ({ ctx }) => {
    assertExerciseAccess(ctx.userPlan);
    const workout = await ctx.db
      .select({
        id: workouts.id,
        name: workouts.name,
        startedAt: workouts.startedAt,
        templateId: workouts.templateId,
      })
      .from(workouts)
      .where(
        and(eq(workouts.userId, ctx.user.id), isNull(workouts.completedAt))
      )
      .orderBy(desc(workouts.startedAt))
      .limit(1)
      .then((r) => r[0] ?? null);

    if (!workout) return null;

    // Get exercises with sets
    const wExercises = await ctx.db
      .select({
        weId: workoutExercises.id,
        exerciseId: workoutExercises.exerciseId,
        sortOrder: workoutExercises.sortOrder,
        note: workoutExercises.note,
        exerciseName: exercises.name,
        exerciseCategory: exercises.category,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, workout.id))
      .orderBy(workoutExercises.sortOrder);

    const exercisesWithSets = await Promise.all(
      wExercises.map(async (we) => {
        const sets = await ctx.db
          .select({
            id: workoutSets.id,
            setNumber: workoutSets.setNumber,
            weightKg: workoutSets.weightKg,
            reps: workoutSets.reps,
            durationSec: workoutSets.durationSec,
            rpe: workoutSets.rpe,
            isWarmup: workoutSets.isWarmup,
            isDropset: workoutSets.isDropset,
            isPersonalRecord: workoutSets.isPersonalRecord,
            completedAt: workoutSets.completedAt,
          })
          .from(workoutSets)
          .where(eq(workoutSets.workoutExerciseId, we.weId))
          .orderBy(workoutSets.setNumber);

        return { ...we, sets };
      })
    );

    return { ...workout, exercises: exercisesWithSets };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      assertExerciseAccess(ctx.userPlan);
      const workout = await ctx.db
        .select({
          id: workouts.id,
          name: workouts.name,
          startedAt: workouts.startedAt,
          completedAt: workouts.completedAt,
          durationSec: workouts.durationSec,
          note: workouts.note,
        })
        .from(workouts)
        .where(
          and(eq(workouts.id, input.id), eq(workouts.userId, ctx.user.id))
        )
        .then((r) => r[0] ?? null);

      if (!workout) return null;

      const wExercises = await ctx.db
        .select({
          weId: workoutExercises.id,
          exerciseId: workoutExercises.exerciseId,
          sortOrder: workoutExercises.sortOrder,
          note: workoutExercises.note,
          exerciseName: exercises.name,
          exerciseCategory: exercises.category,
        })
        .from(workoutExercises)
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(eq(workoutExercises.workoutId, workout.id))
        .orderBy(workoutExercises.sortOrder);

      const exercisesWithSets = await Promise.all(
        wExercises.map(async (we) => {
          const sets = await ctx.db
            .select({
              id: workoutSets.id,
              setNumber: workoutSets.setNumber,
              weightKg: workoutSets.weightKg,
              reps: workoutSets.reps,
              durationSec: workoutSets.durationSec,
              rpe: workoutSets.rpe,
              isWarmup: workoutSets.isWarmup,
              isDropset: workoutSets.isDropset,
              isPersonalRecord: workoutSets.isPersonalRecord,
              completedAt: workoutSets.completedAt,
            })
            .from(workoutSets)
            .where(eq(workoutSets.workoutExerciseId, we.weId))
            .orderBy(workoutSets.setNumber);

          return { ...we, sets };
        })
      );

      return { ...workout, exercises: exercisesWithSets };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).optional(),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      assertExerciseAccess(ctx.userPlan);
      const limit = input.limit ?? 20;

      const conditions = [
        eq(workouts.userId, ctx.user.id),
        sql`${workouts.completedAt} IS NOT NULL`,
      ];

      if (input.cursor) {
        const cursorWorkout = await ctx.db
          .select({ startedAt: workouts.startedAt })
          .from(workouts)
          .where(eq(workouts.id, input.cursor))
          .then((r) => r[0]);

        if (cursorWorkout) {
          conditions.push(lte(workouts.startedAt, cursorWorkout.startedAt));
          conditions.push(sql`${workouts.id} != ${input.cursor}`);
        }
      }

      const items = await ctx.db
        .select({
          id: workouts.id,
          name: workouts.name,
          startedAt: workouts.startedAt,
          completedAt: workouts.completedAt,
          durationSec: workouts.durationSec,
        })
        .from(workouts)
        .where(and(...conditions))
        .orderBy(desc(workouts.startedAt))
        .limit(limit + 1);

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;

      // Get exercise counts and volume for each workout
      const enriched = await Promise.all(
        data.map(async (w) => {
          const stats = await ctx.db
            .select({
              exerciseCount: sql<number>`count(distinct ${workoutExercises.id})`,
              totalSets: sql<number>`count(${workoutSets.id})`,
              totalVolume: sql<number>`coalesce(sum(
                case when ${workoutSets.isWarmup} = false
                  then cast(${workoutSets.weightKg} as numeric) * ${workoutSets.reps}
                  else 0
                end
              ), 0)`,
              prCount: sql<number>`sum(case when ${workoutSets.isPersonalRecord} = true then 1 else 0 end)`,
            })
            .from(workoutExercises)
            .leftJoin(
              workoutSets,
              eq(workoutSets.workoutExerciseId, workoutExercises.id)
            )
            .where(eq(workoutExercises.workoutId, w.id))
            .then((r) => r[0]);

          return {
            ...w,
            exerciseCount: Number(stats?.exerciseCount ?? 0),
            totalSets: Number(stats?.totalSets ?? 0),
            totalVolume: Number(stats?.totalVolume ?? 0),
            prCount: Number(stats?.prCount ?? 0),
          };
        })
      );

      return {
        items: enriched,
        nextCursor: hasMore ? data[data.length - 1].id : undefined,
      };
    }),

  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    assertExerciseAccess(ctx.userPlan);
    const templates = await ctx.db
      .select({
        id: workoutTemplates.id,
        name: workoutTemplates.name,
        description: workoutTemplates.description,
        updatedAt: workoutTemplates.updatedAt,
      })
      .from(workoutTemplates)
      .where(eq(workoutTemplates.userId, ctx.user.id))
      .orderBy(workoutTemplates.sortOrder);

    // Get exercise names for each template
    const enriched = await Promise.all(
      templates.map(async (t) => {
        const exerciseNames = await ctx.db
          .select({ name: exercises.name })
          .from(workoutTemplateExercises)
          .innerJoin(
            exercises,
            eq(workoutTemplateExercises.exerciseId, exercises.id)
          )
          .where(eq(workoutTemplateExercises.templateId, t.id))
          .orderBy(workoutTemplateExercises.sortOrder);

        return {
          ...t,
          exerciseNames: exerciseNames.map((e) => e.name),
        };
      })
    );

    return enriched;
  }),

  getExerciseHistory: protectedProcedure
    .input(
      z.object({
        exerciseId: z.string().uuid(),
        limit: z.number().int().min(1).max(10).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      assertExerciseAccess(ctx.userPlan);
      const limit = input.limit ?? 3;

      // Get the most recent completed workouts containing this exercise
      const history = await ctx.db
        .select({
          workoutId: workouts.id,
          workoutName: workouts.name,
          startedAt: workouts.startedAt,
          weId: workoutExercises.id,
        })
        .from(workoutExercises)
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(
          and(
            eq(workoutExercises.exerciseId, input.exerciseId),
            eq(workouts.userId, ctx.user.id),
            sql`${workouts.completedAt} IS NOT NULL`
          )
        )
        .orderBy(desc(workouts.startedAt))
        .limit(limit);

      const result = await Promise.all(
        history.map(async (h) => {
          const sets = await ctx.db
            .select({
              setNumber: workoutSets.setNumber,
              weightKg: workoutSets.weightKg,
              reps: workoutSets.reps,
              isWarmup: workoutSets.isWarmup,
            })
            .from(workoutSets)
            .where(eq(workoutSets.workoutExerciseId, h.weId))
            .orderBy(workoutSets.setNumber);

          return {
            workoutName: h.workoutName,
            date: h.startedAt,
            sets,
          };
        })
      );

      return result;
    }),

  getPersonalRecords: protectedProcedure
    .input(
      z
        .object({ exerciseId: z.string().uuid().optional() })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      assertExerciseAccess(ctx.userPlan);
      const conditions = [eq(personalRecords.userId, ctx.user.id)];
      if (input?.exerciseId) {
        conditions.push(eq(personalRecords.exerciseId, input.exerciseId));
      }

      return ctx.db
        .select({
          id: personalRecords.id,
          exerciseId: personalRecords.exerciseId,
          exerciseName: exercises.name,
          type: personalRecords.type,
          value: personalRecords.value,
          achievedAt: personalRecords.achievedAt,
        })
        .from(personalRecords)
        .innerJoin(
          exercises,
          eq(personalRecords.exerciseId, exercises.id)
        )
        .where(and(...conditions))
        .orderBy(desc(personalRecords.achievedAt));
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        exerciseId: z.string().uuid(),
        period: z.enum(["1m", "3m", "6m", "1y", "all"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      assertExerciseAccess(ctx.userPlan);
      const periodDays = {
        "1m": 30,
        "3m": 90,
        "6m": 180,
        "1y": 365,
        all: 99999,
      };
      const days = periodDays[input.period ?? "3m"];
      const since = new Date();
      since.setDate(since.getDate() - days);

      const data = await ctx.db
        .select({
          date: workouts.startedAt,
          maxWeight: sql<number>`max(cast(${workoutSets.weightKg} as numeric))`,
          totalVolume: sql<number>`sum(
            case when ${workoutSets.isWarmup} = false
              then cast(${workoutSets.weightKg} as numeric) * ${workoutSets.reps}
              else 0
            end
          )`,
          estimated1rm: sql<number>`max(
            case when ${workoutSets.reps} = 1
              then cast(${workoutSets.weightKg} as numeric)
              else cast(${workoutSets.weightKg} as numeric) * (1 + ${workoutSets.reps}::numeric / 30)
            end
          )`,
        })
        .from(workoutSets)
        .innerJoin(
          workoutExercises,
          eq(workoutSets.workoutExerciseId, workoutExercises.id)
        )
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(
          and(
            eq(workoutExercises.exerciseId, input.exerciseId),
            eq(workouts.userId, ctx.user.id),
            sql`${workouts.completedAt} IS NOT NULL`,
            gte(workouts.startedAt, since)
          )
        )
        .groupBy(workouts.startedAt, workouts.id)
        .orderBy(workouts.startedAt);

      return data.map((d) => ({
        date: d.date,
        maxWeight: Number(d.maxWeight ?? 0),
        totalVolume: Number(d.totalVolume ?? 0),
        estimated1rm: Math.round(Number(d.estimated1rm ?? 0) * 10) / 10,
      }));
    }),
});
