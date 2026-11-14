CREATE TABLE "app_message_threads" (
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"other_id" text NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"muted" boolean DEFAULT false NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_message_threads_organization_id_user_id_other_id_pk" PRIMARY KEY("organization_id","user_id","other_id")
);
--> statement-breakpoint
ALTER TABLE "app_direct_messages" ADD COLUMN "reply_to_id" text;--> statement-breakpoint
ALTER TABLE "app_direct_messages" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_direct_messages" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_direct_messages" ADD COLUMN "forwarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_direct_messages" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "app_message_threads" ADD CONSTRAINT "app_message_threads_organization_id_app_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."app_organizations"("id") ON DELETE cascade ON UPDATE no action;