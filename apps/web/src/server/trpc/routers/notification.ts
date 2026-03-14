import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  waterReminderSettings,
  waterMilestoneCheckpoints,
} from "@/server/db/schema";
import { eq, asc } from "drizzle-orm";
import { timeToMinutes } from "@open-health/shared/water-milestone";

const DEFAULTS = {
  enabled: false,
  reminderMode: "interval" as const,
  startTime: "08:00",
  endTime: "22:00",
  intervalMinutes: 120,
  stopWhenGoalReached: true,
};

export const notificationRouter = router({
  getWaterReminderSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.waterReminderSettings.findFirst({
      where: eq(waterReminderSettings.userId, ctx.user.id),
    });

    if (!settings) {
      return DEFAULTS;
    }

    return {
      enabled: settings.enabled,
      reminderMode: settings.reminderMode as "interval" | "milestone",
      startTime: settings.startTime,
      endTime: settings.endTime,
      intervalMinutes: settings.intervalMinutes,
      stopWhenGoalReached: settings.stopWhenGoalReached,
    };
  }),

  updateWaterReminderSettings: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        reminderMode: z.enum(["interval", "milestone"]).default("interval"),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        intervalMinutes: z.number().int().min(30).max(360),
        stopWhenGoalReached: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(waterReminderSettings)
        .values({
          userId: ctx.user.id,
          ...input,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: waterReminderSettings.userId,
          set: {
            ...input,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  getMilestoneCheckpoints: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(waterMilestoneCheckpoints)
      .where(eq(waterMilestoneCheckpoints.userId, ctx.user.id))
      .orderBy(asc(waterMilestoneCheckpoints.sortOrder));

    return rows.map((r) => ({
      id: r.id,
      time: r.time,
      targetMl: r.targetMl,
      sortOrder: r.sortOrder,
    }));
  }),

  saveMilestoneCheckpoints: protectedProcedure
    .input(
      z.array(
        z.object({
          time: z.string().regex(/^\d{2}:\d{2}$/),
          targetMl: z.number().int().min(1).max(10000),
        })
      ).max(10)
    )
    .mutation(async ({ ctx, input }) => {
      // Validate ordering: times must be chronological, targets must increase
      for (let i = 1; i < input.length; i++) {
        if (timeToMinutes(input[i].time) <= timeToMinutes(input[i - 1].time)) {
          throw new Error("Checkpoint times must be in chronological order");
        }
        if (input[i].targetMl <= input[i - 1].targetMl) {
          throw new Error("Checkpoint targets must be increasing");
        }
      }

      // Delete all existing checkpoints and re-insert in a transaction
      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(waterMilestoneCheckpoints)
          .where(eq(waterMilestoneCheckpoints.userId, ctx.user.id));

        if (input.length > 0) {
          await tx.insert(waterMilestoneCheckpoints).values(
            input.map((cp, i) => ({
              userId: ctx.user.id,
              time: cp.time,
              targetMl: cp.targetMl,
              sortOrder: i,
            }))
          );
        }
      });

      return { success: true };
    }),
});
