CREATE TABLE "app_message_policies" (
	"organization_id" text NOT NULL,
	"user_a" text NOT NULL,
	"user_b" text NOT NULL,
	"auto_delete_seconds" integer,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_message_policies_organization_id_user_a_user_b_pk" PRIMARY KEY("organization_id","user_a","user_b")
);
--> statement-breakpoint
CREATE TABLE "app_message_presence" (
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	CONSTRAINT "app_message_presence_organization_id_user_id_pk" PRIMARY KEY("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "app_message_reactions" (
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_message_reactions_message_id_user_id_pk" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "app_message_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"reported_id" text NOT NULL,
	"message_id" text,
	"message_body" text,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'open' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_direct_messages" ADD COLUMN "forwarded_from_name" text;--> statement-breakpoint
ALTER TABLE "app_direct_messages" ADD COLUMN "shared_user_id" text;--> statement-breakpoint
ALTER TABLE "app_direct_messages" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_message_threads" ADD COLUMN "cleared_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_message_threads" ADD COLUMN "protect_content" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_message_policies" ADD CONSTRAINT "app_message_policies_organization_id_app_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."app_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_message_presence" ADD CONSTRAINT "app_message_presence_organization_id_app_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."app_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_message_reactions" ADD CONSTRAINT "app_message_reactions_message_id_app_direct_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."app_direct_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_message_reports" ADD CONSTRAINT "app_message_reports_organization_id_app_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."app_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_message_reports_org_status_idx" ON "app_message_reports" USING btree ("organization_id","status","created_at");--> statement-breakpoint
CREATE INDEX "app_direct_messages_expires_idx" ON "app_direct_messages" USING btree ("expires_at");