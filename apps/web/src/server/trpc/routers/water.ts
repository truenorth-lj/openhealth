import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { waterLogs, waterGoals } from "@/server/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const DEFAULT_DAILY_WATER_ML = 2500;

export const waterRouter = router({
  getToday: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          totalMl: sql<number>`coalesce(sum(${waterLogs.amountMl}), 0)::int`,
        })
        .from(waterLogs)
        .where(
          and(
            eq(waterLogs.userId, ctx.user.id),
            eq(waterLogs.date, input.date)
          )
        );

      const goal = await ctx.db.query.waterGoals.findFirst({
        where: eq(waterGoals.userId, ctx.user.id),
      });

      return {
        totalMl: result[0]?.totalMl ?? 0,
        goalMl: goal?.dailyTargetMl ?? DEFAULT_DAILY_WATER_ML,
      };
    }),

  logWater: protectedProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        amountMl: z.number().int().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(waterLogs).values({
        userId: ctx.user.id,
        date: input.date,
        amountMl: input.amountMl,
      });
      return { success: true };
    }),

  undoLastLog: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .mutation(async ({ ctx, input }) => {
      const lastLog = await ctx.db
        .select({ id: waterLogs.id })
        .from(waterLogs)
        .where(
          and(
            eq(waterLogs.userId, ctx.user.id),
            eq(waterLogs.date, input.date)
          )
        )
        .orderBy(desc(waterLogs.loggedAt))
        .limit(1);

      if (lastLog.length === 0) {
        return { success: false, error: "沒有可復原的記錄" };
      }

      await ctx.db.delete(waterLogs).where(eq(waterLogs.id, lastLog[0].id));
      return { success: true };
    }),

  getGoal: protectedProcedure.query(async ({ ctx }) => {
    const goal = await ctx.db.query.waterGoals.findFirst({
      where: eq(waterGoals.userId, ctx.user.id),
    });
    return { dailyTargetMl: goal?.dailyTargetMl ?? DEFAULT_DAILY_WATER_ML };
  }),

  setGoal: protectedProcedure
    .input(z.object({ dailyTargetMl: z.number().int().min(500).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.waterGoals.findFirst({
        where: eq(waterGoals.userId, ctx.user.id),
      });

      if (existing) {
        await ctx.db
          .update(waterGoals)
          .set({ dailyTargetMl: input.dailyTargetMl })
          .where(eq(waterGoals.userId, ctx.user.id));
      } else {
        await ctx.db.insert(waterGoals).values({
          userId: ctx.user.id,
          dailyTargetMl: input.dailyTargetMl,
        });
      }

      return { success: true };
    }),
});
