import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { customReminders } from "@/server/db/schema";
import { eq, and, asc } from "drizzle-orm";

const reminderInput = z.object({
  title: z.string().min(1).max(100),
  type: z.string().min(1).max(50).default("custom"),
  note: z.string().max(500).nullable().optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  repeatDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  enabled: z.boolean().default(true),
  icon: z.string().max(10).nullable().optional(),
});

export const reminderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(customReminders)
      .where(eq(customReminders.userId, ctx.user.id))
      .orderBy(asc(customReminders.time));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      note: r.note,
      time: r.time,
      repeatDays: r.repeatDays,
      enabled: r.enabled,
      icon: r.icon,
      createdAt: r.createdAt,
    }));
  }),

  create: protectedProcedure
    .input(reminderInput)
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(customReminders)
        .values({
          userId: ctx.user.id,
          title: input.title,
          type: input.type,
          note: input.note ?? null,
          time: input.time,
          repeatDays: input.repeatDays,
          enabled: input.enabled,
          icon: input.icon ?? null,
        })
        .returning({ id: customReminders.id });

      return { id: row.id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        ...reminderInput.shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await ctx.db
        .update(customReminders)
        .set({
          title: data.title,
          type: data.type,
          note: data.note ?? null,
          time: data.time,
          repeatDays: data.repeatDays,
          enabled: data.enabled,
          icon: data.icon ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(customReminders.id, id),
            eq(customReminders.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(customReminders)
        .where(
          and(
            eq(customReminders.id, input.id),
            eq(customReminders.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  toggleEnabled: protectedProcedure
    .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(customReminders)
        .set({ enabled: input.enabled, updatedAt: new Date() })
        .where(
          and(
            eq(customReminders.id, input.id),
            eq(customReminders.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),
});
