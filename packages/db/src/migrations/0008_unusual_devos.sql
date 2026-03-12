CREATE TABLE "coach_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"client_id" text NOT NULL,
	"start_date" date NOT NULL,
	"coach_notes" text,
	"calorie_target" integer,
	"protein_pct" numeric(4, 1),
	"carbs_pct" numeric(4, 1),
	"fat_pct" numeric(4, 1),
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_clients" ADD CONSTRAINT "coach_clients_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_clients" ADD CONSTRAINT "coach_clients_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coach_clients_coach_client_idx" ON "coach_clients" USING btree ("coach_id","client_id");--> statement-breakpoint
CREATE INDEX "coach_clients_coach_idx" ON "coach_clients" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_clients_client_idx" ON "coach_clients" USING btree ("client_id");