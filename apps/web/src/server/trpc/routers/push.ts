import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { pushSubscriptions, pushTokens } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { VAPID_PUBLIC_KEY } from "@/server/services/web-push";

export const pushRouter = router({
  getVapidPublicKey: publicProcedure.query(() => {
    return { key: VAPID_PUBLIC_KEY || null };
  }),

  // Legacy: keep old subscribe/unsubscribe for backward compat during migration
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
      // Upsert to legacy table
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

      // Also upsert to new push_tokens table
      const token = JSON.stringify({
        endpoint: input.endpoint,
        keys: input.keys,
      });
      await ctx.db
        .insert(pushTokens)
        .values({
          userId: ctx.user.id,
          platform: "web",
          token,
        })
        .onConflictDoUpdate({
          target: [pushTokens.userId, pushTokens.token],
          set: { updatedAt: new Date() },
        });

      return { success: true };
    }),

  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      // Delete from legacy table
      await ctx.db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );

      // Delete from new table — need to find matching token
      const userTokens = await ctx.db
        .select()
        .from(pushTokens)
        .where(
          and(
            eq(pushTokens.userId, ctx.user.id),
            eq(pushTokens.platform, "web")
          )
        );

      for (const t of userTokens) {
        try {
          const parsed = JSON.parse(t.token) as { endpoint: string };
          if (parsed.endpoint === input.endpoint) {
            await ctx.db
              .delete(pushTokens)
              .where(eq(pushTokens.id, t.id));
          }
        } catch {
          // skip malformed tokens
        }
      }

      return { success: true };
    }),

  // New unified token management
  registerToken: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["web", "ios", "android"]),
        token: z.string().min(1),
        deviceName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(pushTokens)
        .values({
          userId: ctx.user.id,
          platform: input.platform,
          token: input.token,
          deviceName: input.deviceName,
        })
        .onConflictDoUpdate({
          target: [pushTokens.userId, pushTokens.token],
          set: {
            platform: input.platform,
            deviceName: input.deviceName,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  removeToken: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(pushTokens)
        .where(
          and(
            eq(pushTokens.userId, ctx.user.id),
            eq(pushTokens.token, input.token)
          )
        );
      return { success: true };
    }),

  getMyTokens: protectedProcedure.query(async ({ ctx }) => {
    const tokens = await ctx.db
      .select({
        id: pushTokens.id,
        platform: pushTokens.platform,
        deviceName: pushTokens.deviceName,
        createdAt: pushTokens.createdAt,
      })
      .from(pushTokens)
      .where(eq(pushTokens.userId, ctx.user.id));

    return tokens;
  }),
});
