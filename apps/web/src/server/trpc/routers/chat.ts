import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { chatSessions, chatMessages } from "@/server/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { getTaipeiTodayStart } from "@/lib/date";

export const chatRouter = router({
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: chatSessions.id,
        title: chatSessions.title,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
      })
      .from(chatSessions)
      .where(eq(chatSessions.userId, ctx.user.id))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(20);
  }),

  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await ctx.db.query.chatSessions.findFirst({
        where: and(
          eq(chatSessions.id, input.sessionId),
          eq(chatSessions.userId, ctx.user.id)
        ),
      });

      if (!session) {
        return [];
      }

      return ctx.db
        .select({
          id: chatMessages.id,
          role: chatMessages.role,
          content: chatMessages.content,
          parts: chatMessages.parts,
          createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId))
        .orderBy(chatMessages.createdAt);
    }),

  getDailyUsage: protectedProcedure.query(async ({ ctx }) => {
    const todayStart = getTaipeiTodayStart();

    const result = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.userId, ctx.user.id),
          eq(chatMessages.role, "user"),
          gte(chatMessages.createdAt, todayStart)
        )
      );

    return {
      used: result[0]?.count ?? 0,
      limit: 100,
    };
  }),
});
