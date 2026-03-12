CREATE TYPE "public"."sleep_detection_method" AS ENUM('accelerometer', 'microphone', 'both');--> statement-breakpoint
CREATE TYPE "public"."sleep_phase" AS ENUM('awake', 'light', 'deep', 'rem');--> statement-breakpoint
CREATE TABLE "sleep_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"goal_hours" numeric(3, 1) DEFAULT '8.0' NOT NULL,
	"alarm_window_minutes" integer DEFAULT 30 NOT NULL,
	CONSTRAINT "sleep_goals_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sleep_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"phase" "sleep_phase" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sleep_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"sleep_onset" timestamp with time zone NOT NULL,
	"wake_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"quality" integer NOT NULL,
	"detection_method" "sleep_detection_method" NOT NULL,
	"movement_samples" jsonb,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sleep_goals" ADD CONSTRAINT "sleep_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sleep_phases" ADD CONSTRAINT "sleep_phases_session_id_sleep_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sleep_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sleep_sessions" ADD CONSTRAINT "sleep_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sleep_phases_session_idx" ON "sleep_phases" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sleep_sessions_user_start_idx" ON "sleep_sessions" USING btree ("user_id","start_time");