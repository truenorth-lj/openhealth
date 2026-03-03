import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../src/server/db/schema";
import { isNull, eq } from "drizzle-orm";
import { generateReferralCode, REFERRAL_CODE_MAX_RETRIES, isUniqueViolation } from "../src/lib/referral-code";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const usersWithoutCode = await db
    .select({ id: users.id })
    .from(users)
    .where(isNull(users.referralCode));

  console.log(`Found ${usersWithoutCode.length} users without referral codes`);

  let updated = 0;
  for (const user of usersWithoutCode) {
    for (let attempt = 0; attempt < REFERRAL_CODE_MAX_RETRIES; attempt++) {
      const code = generateReferralCode();
      try {
        await db
          .update(users)
          .set({ referralCode: code })
          .where(eq(users.id, user.id));
        updated++;
        break;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        // collision — retry
      }
    }
  }

  console.log(`Updated ${updated} users with referral codes`);
  await client.end();
}

main().catch(console.error);
