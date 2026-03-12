import { createDb } from "@open-health/db/client";

export const db = createDb(process.env.DATABASE_URL!);
