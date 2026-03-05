CREATE TABLE "referral_payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount_ntd" integer NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"referral_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"amount_ntd" integer,
	"free_days" integer,
	"subscription_month" text,
	"stripe_invoice_id" text,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "tdee_user_date_desc_idx";--> statement-breakpoint
DROP INDEX "foods_name_search_idx";--> statement-breakpoint
ALTER TABLE "referral_payouts" ADD CONSTRAINT "referral_payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_referral_payouts_user" ON "referral_payouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_referral_rewards_user" ON "referral_rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_referral_rewards_referral" ON "referral_rewards" USING btree ("referral_id");--> statement-breakpoint
CREATE INDEX "idx_referral_rewards_status" ON "referral_rewards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "foods_name_search_idx" ON "foods" USING gin (to_tsvector('simple', "name" || ' ' || coalesce("brand", '')));--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_name_unique" UNIQUE("name");