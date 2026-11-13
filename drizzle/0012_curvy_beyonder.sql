CREATE TABLE "app_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"campaign" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"next_contact_at" timestamp with time zone,
	"client_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "app_leads_status_created_idx" ON "app_leads" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "app_leads_email_idx" ON "app_leads" USING btree ("email");