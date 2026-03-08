import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  postureDefinitions,
  postureSessions,
  postureConfig,
} from "@/server/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import {
  schedulePush,
  cancelPush,
} from "@/server/services/posture-push-scheduler";

const DEFAULT_POSTURES = [
  { name: "坐姿", emoji: "🪑", maxMinutes: 45, suggestedBreak: "站起來走動 2 分鐘", sortOrder: 0 },
  { name: "站姿", emoji: "🧍", maxMinutes: 60, suggestedBreak: "坐下休息或走動一下", sortOrder: 1 },
  { name: "走路", emoji: "🚶", maxMinutes: 120, suggestedBreak: "找個地方坐下休息", sortOrder: 2 },
  { name: "躺姿", emoji: "🛌", maxMinutes: 30, suggestedBreak: "起來活動一下", sortOrder: 3 },
  { name: "半躺", emoji: "🛋️", maxMinutes: 45, suggestedBreak: "變換姿勢、伸展一下", sortOrder: 4 },
];

export const postureRouter = router({
  getDefinitions: protectedProcedure.query(async ({ ctx }) => {
    const defs = await ctx.db
      .select()
      .from(postureDefinitions)
      .where(
        and(
          eq(postureDefinitions.userId, ctx.user.id),
          eq(postureDefinitions.isArchived, false)
        )
      )
      .orderBy(postureDefinitions.sortOrder);

    // If user has no definitions, seed defaults
    if (defs.length === 0) {
      const seeded = await ctx.db
        .insert(postureDefinitions)
        .values(
          DEFAULT_POSTURES.map((p) => ({
            userId: ctx.user.id,
            ...p,
          }))
        )
        .returning();
      return seeded;
    }

    return defs;
  }),

  upsertDefinition: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(20),
        emoji: z.string().min(1).max(4),
        maxMinutes: z.number().int().min(5).max(480),
        suggestedBreak: z.string().min(1).max(100),
        sortOrder: z.number().int().min(0).default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        await ctx.db
          .update(postureDefinitions)
          .set({
            name: input.name,
            emoji: input.emoji,
            maxMinutes: input.maxMinutes,
            suggestedBreak: input.suggestedBreak,
            sortOrder: input.sortOrder,
          })
          .where(
            and(
              eq(postureDefinitions.id, input.id),
              eq(postureDefinitions.userId, ctx.user.id)
            )
          );
      } else {
        await ctx.db.insert(postureDefinitions).values({
          userId: ctx.user.id,
          name: input.name,
          emoji: input.emoji,
          maxMinutes: input.maxMinutes,
          suggestedBreak: input.suggestedBreak,
          sortOrder: input.sortOrder,
        });
      }
      return { success: true };
    }),

  deleteDefinition: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Archive instead of hard delete to preserve session history
      await ctx.db
        .update(postureDefinitions)
        .set({ isArchived: true })
        .where(
          and(
            eq(postureDefinitions.id, input.id),
            eq(postureDefinitions.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.query.postureConfig.findFirst({
      where: eq(postureConfig.userId, ctx.user.id),
    });
    return config ?? { reminderEnabled: true, snoozeMinutes: 10 };
  }),

  upsertConfig: protectedProcedure
    .input(
      z.object({
        reminderEnabled: z.boolean(),
        snoozeMinutes: z.number().int().min(1).max(60),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(postureConfig)
        .values({
          userId: ctx.user.id,
          reminderEnabled: input.reminderEnabled,
          snoozeMinutes: input.snoozeMinutes,
        })
        .onConflictDoUpdate({
          target: postureConfig.userId,
          set: {
            reminderEnabled: input.reminderEnabled,
            snoozeMinutes: input.snoozeMinutes,
          },
        });
      return { success: true };
    }),

  getActiveSession: protectedProcedure.query(async ({ ctx }) => {
    const session = await ctx.db
      .select({
        id: postureSessions.id,
        postureId: postureSessions.postureId,
        startedAt: postureSessions.startedAt,
        wasReminded: postureSessions.wasReminded,
        postureName: postureDefinitions.name,
        postureEmoji: postureDefinitions.emoji,
        maxMinutes: postureDefinitions.maxMinutes,
        suggestedBreak: postureDefinitions.suggestedBreak,
      })
      .from(postureSessions)
      .innerJoin(
        postureDefinitions,
        eq(postureSessions.postureId, postureDefinitions.id)
      )
      .where(
        and(
          eq(postureSessions.userId, ctx.user.id),
          isNull(postureSessions.endedAt)
        )
      )
      .orderBy(desc(postureSessions.startedAt))
      .limit(1);

    return session[0] ?? null;
  }),

  switchPosture: protectedProcedure
    .input(z.object({ postureId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        // End any active session
        const existing = await tx
          .select({ id: postureSessions.id, startedAt: postureSessions.startedAt })
          .from(postureSessions)
          .where(
            and(
              eq(postureSessions.userId, ctx.user.id),
              isNull(postureSessions.endedAt)
            )
          );

        const now = new Date();
        for (const session of existing) {
          cancelPush(session.id);
          const durationMinutes = Math.round(
            (now.getTime() - new Date(session.startedAt).getTime()) / 60000
          );
          await tx
            .update(postureSessions)
            .set({ endedAt: now, durationMinutes })
            .where(eq(postureSessions.id, session.id));
        }

        // Start new session
        const [newSession] = await tx
          .insert(postureSessions)
          .values({
            userId: ctx.user.id,
            postureId: input.postureId,
            startedAt: now,
          })
          .returning();

        // Look up posture definition for push notification
        const postureDef = await tx
          .select()
          .from(postureDefinitions)
          .where(eq(postureDefinitions.id, input.postureId))
          .then((r) => r[0]);

        if (postureDef) {
          const fireAt = new Date(
            now.getTime() + postureDef.maxMinutes * 60000
          );
          schedulePush(ctx.user.id, newSession.id, fireAt, {
            type: "posture-reminder",
            title: `${postureDef.emoji} 該換姿勢了！`,
            body: `你已經維持「${postureDef.name}」超過 ${postureDef.maxMinutes} 分鐘。${postureDef.suggestedBreak}`,
            tag: "posture-reminder",
            url: "/posture",
          });
        }

        return newSession;
      });
    }),

  stopSession: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.db
      .select({ id: postureSessions.id, startedAt: postureSessions.startedAt })
      .from(postureSessions)
      .where(
        and(
          eq(postureSessions.userId, ctx.user.id),
          isNull(postureSessions.endedAt)
        )
      );

    const now = new Date();
    for (const session of existing) {
      cancelPush(session.id);
      const durationMinutes = Math.round(
        (now.getTime() - new Date(session.startedAt).getTime()) / 60000
      );
      await ctx.db
        .update(postureSessions)
        .set({ endedAt: now, durationMinutes })
        .where(eq(postureSessions.id, session.id));
    }

    return { success: true };
  }),

  markReminded: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(postureSessions)
        .set({ wasReminded: true })
        .where(
          and(
            eq(postureSessions.id, input.id),
            eq(postureSessions.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({ limit: z.number().int().min(1).max(50).default(20) })
    )
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db
        .select({
          id: postureSessions.id,
          startedAt: postureSessions.startedAt,
          endedAt: postureSessions.endedAt,
          durationMinutes: postureSessions.durationMinutes,
          wasReminded: postureSessions.wasReminded,
          postureName: postureDefinitions.name,
          postureEmoji: postureDefinitions.emoji,
        })
        .from(postureSessions)
        .innerJoin(
          postureDefinitions,
          eq(postureSessions.postureId, postureDefinitions.id)
        )
        .where(eq(postureSessions.userId, ctx.user.id))
        .orderBy(desc(postureSessions.startedAt))
        .limit(input.limit);

      return logs;
    }),
});
