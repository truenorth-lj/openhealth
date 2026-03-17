CREATE TABLE "custom_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'custom' NOT NULL,
	"note" text,
	"time" text NOT NULL,
	"repeat_days" jsonb DEFAULT '[0,1,2,3,4,5,6]'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_reminders" ADD CONSTRAINT "custom_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_reminders_user_idx" ON "custom_reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "custom_reminders_user_enabled_idx" ON "custom_reminders" USING btree ("user_id","enabled");