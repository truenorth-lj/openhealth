import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

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

const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await ctx.getSession();
  if (!session || !session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session,
      user: session.user,
    },
  });
});
