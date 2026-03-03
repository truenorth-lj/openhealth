import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, sessions, accounts, verifications } from "./db/schema";
import { generateReferralCode, REFERRAL_CODE_MAX_RETRIES, isUniqueViolation } from "@/lib/referral-code";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  plugins: [bearer()],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "apple"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          for (let i = 0; i < REFERRAL_CODE_MAX_RETRIES; i++) {
            const code = generateReferralCode();
            try {
              await db
                .update(users)
                .set({ referralCode: code })
                .where(eq(users.id, user.id));
              return;
            } catch (error) {
              if (!isUniqueViolation(error)) throw error;
              // collision — retry
            }
          }
        },
      },
    },
  },
});
