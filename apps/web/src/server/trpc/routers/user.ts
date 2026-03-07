import { z } from "zod";
import { updateProfileSchema, updateGoalsSchema } from "@open-health/shared/schemas";
import { protectedProcedure, router } from "../trpc";
import { users, userProfiles, userGoals, nutrientDefinitions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getAiUsage } from "@/server/services/plan";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, ctx.user.id),
    });
    return profile ?? null;
  }),

  getGoals: protectedProcedure.query(async ({ ctx }) => {
    const goals = await ctx.db.query.userGoals.findFirst({
      where: eq(userGoals.userId, ctx.user.id),
    });
    return goals ?? null;
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));

      await ctx.db
        .insert(userProfiles)
        .values({
          userId: ctx.user.id,
          sex: input.sex,
          heightCm: input.heightCm ? String(input.heightCm) : null,
          dateOfBirth: input.dateOfBirth,
          activityLevel: input.activityLevel,
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            sex: input.sex,
            heightCm: input.heightCm ? String(input.heightCm) : null,
            dateOfBirth: input.dateOfBirth,
            activityLevel: input.activityLevel,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  getPlanInfo: protectedProcedure.query(async ({ ctx }) => {
    const [ocr, estimate, chat] = await Promise.all([
      getAiUsage(ctx.user.id, "ocr", ctx.userPlan),
      getAiUsage(ctx.user.id, "estimate", ctx.userPlan),
      getAiUsage(ctx.user.id, "chat", ctx.userPlan),
    ]);

    return {
      plan: ctx.userPlan,
      aiUsage: { ocr, estimate, chat },
    };
  }),

  updateGoals: protectedProcedure
    .input(updateGoalsSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userGoals)
        .values({
          userId: ctx.user.id,
          calorieTarget: input.calorieTarget,
          proteinG: input.proteinG != null ? String(input.proteinG) : null,
          carbsG: input.carbsG != null ? String(input.carbsG) : null,
          fatG: input.fatG != null ? String(input.fatG) : null,
          fiberG: input.fiberG != null ? String(input.fiberG) : null,
        })
        .onConflictDoUpdate({
          target: userGoals.userId,
          set: {
            calorieTarget: input.calorieTarget,
            proteinG: input.proteinG != null ? String(input.proteinG) : null,
            carbsG: input.carbsG != null ? String(input.carbsG) : null,
            fatG: input.fatG != null ? String(input.fatG) : null,
            fiberG: input.fiberG != null ? String(input.fiberG) : null,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  getNutrientDefinitions: protectedProcedure.query(async ({ ctx }) => {
    const defs = await ctx.db
      .select({
        id: nutrientDefinitions.id,
        name: nutrientDefinitions.name,
        unit: nutrientDefinitions.unit,
        category: nutrientDefinitions.category,
        dailyValue: nutrientDefinitions.dailyValue,
        displayOrder: nutrientDefinitions.displayOrder,
      })
      .from(nutrientDefinitions)
      .orderBy(nutrientDefinitions.displayOrder, nutrientDefinitions.id);

    return defs;
  }),

  updateTrackedNutrients: protectedProcedure
    .input(z.object({ nutrientIds: z.array(z.number()).max(20) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userGoals)
        .values({
          userId: ctx.user.id,
          trackedNutrientIds: input.nutrientIds.length > 0 ? input.nutrientIds : null,
        })
        .onConflictDoUpdate({
          target: userGoals.userId,
          set: {
            trackedNutrientIds: input.nutrientIds.length > 0 ? input.nutrientIds : null,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),
});
