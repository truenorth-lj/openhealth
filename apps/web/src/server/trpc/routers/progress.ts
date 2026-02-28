import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { weightLogs, tdeeCalculations } from "@/server/db/schema";
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
});
