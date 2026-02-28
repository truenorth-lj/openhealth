import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 5,               // 降低最大连接数，避免耗尽 Zeabur PostgreSQL 连接限制
  idle_timeout: 20,     // 闲置 20 秒后关闭连接，避免 stale connections
  connect_timeout: 10,  // 连接超时 10 秒（默认 30 秒太久）
});

export const db = drizzle(client, { schema });
