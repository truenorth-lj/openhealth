CREATE TABLE "posture_detection_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"threshold_degrees" numeric(4, 1) DEFAULT '8.5' NOT NULL,
	"notification_cooldown_seconds" integer DEFAULT 120 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "posture_detection_configs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "posture_detection_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"baseline_pitch" numeric(6, 3) NOT NULL,
	"threshold_degrees" numeric(4, 1) DEFAULT '8.5' NOT NULL,
	"total_duration_minutes" integer NOT NULL,
	"good_posture_minutes" integer NOT NULL,
	"bad_posture_minutes" integer NOT NULL,
	"average_deviation" numeric(6, 3),
	"max_deviation" numeric(6, 3),
	"slouch_count" integer DEFAULT 0 NOT NULL,
	"notification_count" integer DEFAULT 0 NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posture_detection_configs" ADD CONSTRAINT "posture_detection_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posture_detection_sessions" ADD CONSTRAINT "posture_detection_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posture_detection_user_started_idx" ON "posture_detection_sessions" USING btree ("user_id","started_at");