import { initTRPC, TRPCError } from "@trpc/server";
import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { resolveEffectivePlan, ProRequiredError } from "@/server/services/plan";
import type { Plan } from "@open-health/shared/types";

export const createTRPCContext = async () => {
  const reqHeaders = await headers();
  let cachedSession: Awaited<ReturnType<typeof auth.api.getSession>> | undefined;

  const getSession = async () => {
    if (cachedSession === undefined) {
      cachedSession = await auth.api.getSession({ headers: reqHeaders });
    }
    return cachedSession;
  };

  return {
    db,
    getSession,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        proRequired:
          error.cause instanceof ProRequiredError
            ? { feature: error.cause.feature }
            : undefined,
      },
    };
  },
});

export const router = t.router;

// Report unexpected errors to Sentry (skip expected client errors like UNAUTHORIZED)
const sentryMiddleware = t.middleware(async ({ next, path, type }) => {
  const result = await next();
  if (!result.ok) {
    const error = result.error;
    const isExpected =
      error.code === "UNAUTHORIZED" ||
      error.code === "FORBIDDEN" ||
      error.code === "BAD_REQUEST" ||
      error.code === "NOT_FOUND";
    if (!isExpected) {
      const cause = error.cause;
      const toCapture = cause instanceof Error ? cause : error;
      Sentry.captureException(toCapture, {
        tags: { "trpc.path": path, "trpc.type": type },
      });
    }
  }
  return result;
});

// Base procedure that converts ProRequiredError → TRPCError FORBIDDEN
const proGateMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof ProRequiredError) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: error.message,
        cause: error,
      });
    }
    throw error;
  }
});

export const publicProcedure = t.procedure.use(sentryMiddleware).use(proGateMiddleware);

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const session = await ctx.getSession();
  if (!session || !session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const userRow = await ctx.db
    .select({
      plan: users.plan,
      planExpiresAt: users.planExpiresAt,
      trialExpiresAt: users.trialExpiresAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .then((r) => r[0]);

  const userPlan: Plan = userRow ? resolveEffectivePlan(userRow) : "free";

  return next({
    ctx: {
      ...ctx,
      session,
      user: session.user,
      userPlan,
    },
  });
});
