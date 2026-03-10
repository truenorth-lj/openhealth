import { z } from "zod";
import { logWeightSchema, logMeasurementsSchema, logStepsSchema } from "@open-health/shared/schemas";
import { DEFAULT_WATER_GOAL_ML } from "@open-health/shared/constants";
import { protectedProcedure, router } from "../trpc";
import { weightLogs, bodyMeasurements, tdeeCalculations, stepLogs } from "@/server/db/schema";
import { waterLogs, waterGoals } from "@/server/db/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export const progressRouter = router({
  getWeightHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(365).default(90),
      })
    )
    .query(async ({ ctx, input }) => {
      const weights = await ctx.db
        .select()
        .from(weightLogs)
        .where(eq(weightLogs.userId, ctx.user.id))
        .orderBy(desc(weightLogs.date))
        .limit(input.limit);

      return weights.reverse();
    }),

  getDateWeight: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(weightLogs)
        .where(
          and(
            eq(weightLogs.userId, ctx.user.id),
            eq(weightLogs.date, input.date)
          )
        )
        .limit(1);

      return result[0] ?? null;
    }),

  getLatestWeight: protectedProcedure.query(async ({ ctx }) => {
    const latest = await ctx.db
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, ctx.user.id))
      .orderBy(desc(weightLogs.date))
      .limit(1);

    return latest[0] ?? null;
  }),

  getTDEEHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const tdee = await ctx.db
        .select()
        .from(tdeeCalculations)
        .where(eq(tdeeCalculations.userId, ctx.user.id))
        .orderBy(desc(tdeeCalculations.date))
        .limit(input.limit);

      return tdee.reverse();
    }),

  logWeight: protectedProcedure
    .input(logWeightSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(weightLogs)
        .values({
          userId: ctx.user.id,
          date: input.date,
          weightKg: String(input.weightKg),
          note: input.note,
        })
        .onConflictDoUpdate({
          target: [weightLogs.userId, weightLogs.date],
          set: {
            weightKg: String(input.weightKg),
            note: input.note,
          },
        });

      return { success: true };
    }),

  logMeasurements: protectedProcedure
    .input(logMeasurementsSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(bodyMeasurements)
        .values({
          userId: ctx.user.id,
          date: input.date,
          waistCm: input.waistCm ? String(input.waistCm) : null,
          hipCm: input.hipCm ? String(input.hipCm) : null,
          chestCm: input.chestCm ? String(input.chestCm) : null,
          armCm: input.armCm ? String(input.armCm) : null,
          thighCm: input.thighCm ? String(input.thighCm) : null,
          neckCm: input.neckCm ? String(input.neckCm) : null,
          bodyFatPct: input.bodyFatPct ? String(input.bodyFatPct) : null,
          note: input.note,
        })
        .onConflictDoUpdate({
          target: [bodyMeasurements.userId, bodyMeasurements.date],
          set: {
            waistCm: input.waistCm ? String(input.waistCm) : null,
            hipCm: input.hipCm ? String(input.hipCm) : null,
            chestCm: input.chestCm ? String(input.chestCm) : null,
            armCm: input.armCm ? String(input.armCm) : null,
            thighCm: input.thighCm ? String(input.thighCm) : null,
            neckCm: input.neckCm ? String(input.neckCm) : null,
            bodyFatPct: input.bodyFatPct ? String(input.bodyFatPct) : null,
            note: input.note,
          },
        });

      return { success: true };
    }),

  // Steps
  getStepsHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(365).default(90),
      })
    )
    .query(async ({ ctx, input }) => {
      const steps = await ctx.db
        .select()
        .from(stepLogs)
        .where(eq(stepLogs.userId, ctx.user.id))
        .orderBy(desc(stepLogs.date))
        .limit(input.limit);

      return steps.reverse();
    }),

  getDateSteps: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(stepLogs)
        .where(
          and(
            eq(stepLogs.userId, ctx.user.id),
            eq(stepLogs.date, input.date)
          )
        )
        .limit(1);

      return result[0] ?? null;
    }),

  logSteps: protectedProcedure
    .input(logStepsSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(stepLogs)
        .values({
          userId: ctx.user.id,
          date: input.date,
          steps: String(input.steps),
          note: input.note,
        })
        .onConflictDoUpdate({
          target: [stepLogs.userId, stepLogs.date],
          set: {
            steps: String(input.steps),
            note: input.note,
          },
        });

      return { success: true };
    }),

  // Analytics — combined trends for water, weight, steps
  getAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);
      const sinceStr = since.toISOString().split("T")[0];

      const [weights, steps, waterDaily] = await Promise.all([
        ctx.db
          .select({ date: weightLogs.date, value: weightLogs.weightKg })
          .from(weightLogs)
          .where(
            and(
              eq(weightLogs.userId, ctx.user.id),
              gte(weightLogs.date, sinceStr)
            )
          )
          .orderBy(weightLogs.date),

        ctx.db
          .select({ date: stepLogs.date, value: stepLogs.steps })
          .from(stepLogs)
          .where(
            and(
              eq(stepLogs.userId, ctx.user.id),
              gte(stepLogs.date, sinceStr)
            )
          )
          .orderBy(stepLogs.date),

        ctx.db
          .select({
            date: waterLogs.date,
            totalMl: sql<number>`sum(${waterLogs.amountMl})::int`,
          })
          .from(waterLogs)
          .where(
            and(
              eq(waterLogs.userId, ctx.user.id),
              gte(waterLogs.date, sinceStr)
            )
          )
          .groupBy(waterLogs.date)
          .orderBy(waterLogs.date),
      ]);

      const waterGoal = await ctx.db.query.waterGoals.findFirst({
        where: eq(waterGoals.userId, ctx.user.id),
      });

      // Generate all dates in the range to fill gaps
      const allDates: string[] = [];
      const cursor = new Date(since);
      const today = new Date();
      while (cursor <= today) {
        allDates.push(cursor.toISOString().split("T")[0]);
        cursor.setDate(cursor.getDate() + 1);
      }

      // Build lookup maps
      const weightMap = new Map(weights.map((w) => [w.date, Number(w.value)]));
      const stepsMap = new Map(steps.map((s) => [s.date, Number(s.value)]));
      const waterMap = new Map(waterDaily.map((w) => [w.date, w.totalMl]));

      return {
        weight: allDates
          .filter((d) => weightMap.has(d))
          .map((d) => ({ date: d, value: weightMap.get(d)! })),
        steps: allDates.map((d) => ({
          date: d,
          value: stepsMap.get(d) ?? 0,
        })),
        water: allDates.map((d) => ({
          date: d,
          value: waterMap.get(d) ?? 0,
        })),
        waterGoalMl: waterGoal?.dailyTargetMl ?? DEFAULT_WATER_GOAL_ML,
      };
    }),
});
