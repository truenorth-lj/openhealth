import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { pushSubscriptions } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { VAPID_PUBLIC_KEY } from "@/server/services/web-push";

export const pushRouter = router({
  getVapidPublicKey: publicProcedure.query(() => {
    return { key: VAPID_PUBLIC_KEY || null };
  }),

  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert: delete existing subscription with same endpoint, then insert
      await ctx.db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );

      await ctx.db.insert(pushSubscriptions).values({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        keys: input.keys,
      });

      return { success: true };
    }),

  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );
      return { success: true };
    }),
});
