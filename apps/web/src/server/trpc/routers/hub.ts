import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { hubConfig } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { HubUserConfig } from "@open-health/shared/hub";

const hubItemConfigSchema = z.object({
  visible: z.boolean(),
  order: z.number().int().optional(),
});

const hubUserConfigSchema = z.record(z.string(), hubItemConfigSchema);

export const hubRouter = router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const row = await ctx.db
      .select({ config: hubConfig.config })
      .from(hubConfig)
      .where(eq(hubConfig.userId, ctx.user.id))
      .then((r) => r[0]);

    return (row?.config as HubUserConfig) ?? null;
  }),

  updateConfig: protectedProcedure
    .input(hubUserConfigSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(hubConfig)
        .values({
          userId: ctx.user.id,
          config: input,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: hubConfig.userId,
          set: {
            config: input,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),
});
