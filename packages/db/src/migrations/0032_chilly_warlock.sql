CREATE TABLE "coach_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_client_id" uuid NOT NULL,
	"coach_id" text NOT NULL,
	"client_id" text NOT NULL,
	"content" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_coach_client_id_coach_clients_id_fk" FOREIGN KEY ("coach_client_id") REFERENCES "public"."coach_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coach_messages_client_created_idx" ON "coach_messages" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "coach_messages_coach_client_idx" ON "coach_messages" USING btree ("coach_client_id","created_at");--> statement-breakpoint
CREATE INDEX "coach_messages_client_unread_idx" ON "coach_messages" USING btree ("client_id") WHERE read_at IS NULL;