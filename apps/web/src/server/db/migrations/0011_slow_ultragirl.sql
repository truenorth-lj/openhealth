CREATE TABLE "posture_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"snooze_minutes" integer DEFAULT 10 NOT NULL,
	CONSTRAINT "posture_configs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "posture_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"max_minutes" integer NOT NULL,
	"suggested_break" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posture_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"posture_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_minutes" integer,
	"was_reminded" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posture_configs" ADD CONSTRAINT "posture_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posture_definitions" ADD CONSTRAINT "posture_definitions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posture_sessions" ADD CONSTRAINT "posture_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posture_sessions" ADD CONSTRAINT "posture_sessions_posture_id_posture_definitions_id_fk" FOREIGN KEY ("posture_id") REFERENCES "public"."posture_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posture_definitions_user_idx" ON "posture_definitions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "posture_sessions_user_started_idx" ON "posture_sessions" USING btree ("user_id","started_at");