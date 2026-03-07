import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { waterReminderSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const DEFAULTS = {
  enabled: false,
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
});
