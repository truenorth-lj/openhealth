import { z } from "zod";
import { logWeightSchema, logMeasurementsSchema } from "@open-health/shared/schemas";
import { protectedProcedure, router } from "../trpc";
import { weightLogs, bodyMeasurements, tdeeCalculations } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

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
});
