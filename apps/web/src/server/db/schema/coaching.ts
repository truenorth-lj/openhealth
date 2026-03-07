import {
  pgTable,
  uuid,
  text,
  date,
  integer,
  decimal,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const coachClients = pgTable(
  "coach_clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coachId: text("coach_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    clientId: text("client_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    startDate: date("start_date").notNull(),
    coachNotes: text("coach_notes"),
    calorieTarget: integer("calorie_target"),
    proteinPct: decimal("protein_pct", { precision: 4, scale: 1 }),
    carbsPct: decimal("carbs_pct", { precision: 4, scale: 1 }),
    fatPct: decimal("fat_pct", { precision: 4, scale: 1 }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("coach_clients_coach_client_idx").on(
      table.coachId,
      table.clientId
    ),
    index("coach_clients_coach_idx").on(table.coachId),
    index("coach_clients_client_idx").on(table.clientId),
  ]
);
