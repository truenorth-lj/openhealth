import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { exercises } from "./exercise";

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    templateId: uuid("template_id").references(() => workoutTemplates.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationSec: integer("duration_sec"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("workouts_user_started_idx").on(table.userId, table.startedAt),
  ]
);

export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workoutId: uuid("workout_id")
      .references(() => workouts.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id)
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    note: text("note"),
  },
  (table) => [
    index("workout_exercises_workout_idx").on(
      table.workoutId,
      table.sortOrder
    ),
  ]
);

export const workoutSets = pgTable(
  "workout_sets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workoutExerciseId: uuid("workout_exercise_id")
      .references(() => workoutExercises.id, { onDelete: "cascade" })
      .notNull(),
    setNumber: integer("set_number").notNull(),
    weightKg: decimal("weight_kg", { precision: 6, scale: 2 }),
    reps: integer("reps"),
    durationSec: integer("duration_sec"),
    rpe: decimal("rpe", { precision: 3, scale: 1 }),
    isWarmup: boolean("is_warmup").default(false).notNull(),
    isDropset: boolean("is_dropset").default(false).notNull(),
    isPersonalRecord: boolean("is_personal_record").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("workout_sets_exercise_idx").on(
      table.workoutExerciseId,
      table.setNumber
    ),
  ]
);

export const workoutTemplates = pgTable(
  "workout_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("workout_templates_user_idx").on(table.userId)]
);

export const workoutTemplateExercises = pgTable(
  "workout_template_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .references(() => workoutTemplates.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id)
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    defaultSets: integer("default_sets").default(3).notNull(),
    defaultReps: integer("default_reps"),
    defaultWeightKg: decimal("default_weight_kg", { precision: 6, scale: 2 }),
  },
  (table) => [
    index("workout_template_exercises_template_idx").on(
      table.templateId,
      table.sortOrder
    ),
  ]
);

export const personalRecords = pgTable(
  "personal_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: uuid("exercise_id")
      .references(() => exercises.id)
      .notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'weight', '1rm', 'volume', 'reps'
    value: decimal("value", { precision: 10, scale: 2 }).notNull(),
    workoutSetId: uuid("workout_set_id").references(() => workoutSets.id, {
      onDelete: "set null",
    }),
    achievedAt: timestamp("achieved_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("personal_records_user_exercise_type_idx").on(
      table.userId,
      table.exerciseId,
      table.type
    ),
  ]
);
