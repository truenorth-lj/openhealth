CREATE TABLE "water_milestone_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"time" text NOT NULL,
	"target_ml" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "water_reminder_settings" ADD COLUMN "reminder_mode" text DEFAULT 'interval' NOT NULL;--> statement-breakpoint
ALTER TABLE "water_milestone_checkpoints" ADD CONSTRAINT "water_milestone_checkpoints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "water_milestone_checkpoints_user_idx" ON "water_milestone_checkpoints" USING btree ("user_id");