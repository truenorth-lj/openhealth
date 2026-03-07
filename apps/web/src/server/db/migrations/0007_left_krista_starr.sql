CREATE TABLE "water_reminder_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"start_time" text DEFAULT '08:00' NOT NULL,
	"end_time" text DEFAULT '22:00' NOT NULL,
	"interval_minutes" integer DEFAULT 120 NOT NULL,
	"stop_when_goal_reached" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "water_reminder_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "water_reminder_settings" ADD CONSTRAINT "water_reminder_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;