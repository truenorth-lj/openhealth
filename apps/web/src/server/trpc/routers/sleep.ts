import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { sleepSessions, sleepPhases, sleepGoals } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { saveSleepSessionSchema, updateSleepGoalSchema } from "@open-health/shared/schemas";

export const sleepRouter = router({
  getGoal: protectedProcedure.query(async ({ ctx }) => {
    const goal = await ctx.db.query.sleepGoals.findFirst({
      where: eq(sleepGoals.userId, ctx.user.id),
    });
    return goal ?? null;
  }),

  upsertGoal: protectedProcedure
    .input(updateSleepGoalSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(sleepGoals)
        .values({
          userId: ctx.user.id,
          goalHours: String(input.goalHours),
          alarmWindowMinutes: input.alarmWindowMinutes,
        })
        .onConflictDoUpdate({
          target: sleepGoals.userId,
          set: {
            goalHours: String(input.goalHours),
            alarmWindowMinutes: input.alarmWindowMinutes,
          },
        });
      return { success: true };
    }),

  saveSession: protectedProcedure
    .input(saveSleepSessionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [session] = await tx
          .insert(sleepSessions)
          .values({
            userId: ctx.user.id,
            startTime: new Date(input.startTime),
            endTime: new Date(input.endTime),
            sleepOnset: new Date(input.sleepOnset),
            wakeTime: new Date(input.wakeTime),
            durationMinutes: input.durationMinutes,
            quality: input.quality,
            detectionMethod: input.detectionMethod,
            movementSamples: input.movementSamples ?? null,
            note: input.note,
          })
          .returning();

        if (input.phases.length > 0) {
          await tx.insert(sleepPhases).values(
            input.phases.map((p) => ({
              sessionId: session.id,
              startTime: new Date(p.startTime),
              endTime: new Date(p.endTime),
              phase: p.phase,
            }))
          );
        }

        return session;
      });
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(14),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db
        .select()
        .from(sleepSessions)
        .where(eq(sleepSessions.userId, ctx.user.id))
        .orderBy(desc(sleepSessions.startTime))
        .limit(input.limit);

      return sessions;
    }),

  getSession: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db
        .select()
        .from(sleepSessions)
        .where(
          and(
            eq(sleepSessions.id, input.id),
            eq(sleepSessions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!session[0]) return null;

      const phases = await ctx.db
        .select()
        .from(sleepPhases)
        .where(eq(sleepPhases.sessionId, input.id))
        .orderBy(sleepPhases.startTime);

      return { ...session[0], phases };
    }),

  deleteSession: protectedProcedure
    .input(
      z.union([
        z.object({ id: z.string().uuid() }),
        z.object({ startTime: z.string().datetime() }),
      ])
    )
    .mutation(async ({ ctx, input }) => {
      const condition =
        "id" in input
          ? and(
              eq(sleepSessions.id, input.id),
              eq(sleepSessions.userId, ctx.user.id)
            )
          : and(
              eq(sleepSessions.startTime, new Date(input.startTime)),
              eq(sleepSessions.userId, ctx.user.id)
            );
      await ctx.db.delete(sleepSessions).where(condition);
      return { success: true };
    }),
});
