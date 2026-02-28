import { updateProfileSchema, updateGoalsSchema } from "@open-health/shared/schemas";
import { protectedProcedure, router } from "../trpc";
import { users, userProfiles, userGoals } from "@/server/db/schema";
import { eq } from "drizzle-orm";

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
});
