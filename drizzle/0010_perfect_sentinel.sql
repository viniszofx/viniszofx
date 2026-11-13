CREATE TABLE "app_direct_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app_modules" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_org_post_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_org_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"publish_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_short_links" (
	"code" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"target" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_direct_messages" ADD CONSTRAINT "app_direct_messages_organization_id_app_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."app_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_org_post_comments" ADD CONSTRAINT "app_org_post_comments_post_id_app_org_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."app_org_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_org_posts" ADD CONSTRAINT "app_org_posts_organization_id_app_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."app_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_direct_messages_pair_idx" ON "app_direct_messages" USING btree ("organization_id","sender_id","recipient_id","created_at");--> statement-breakpoint
CREATE INDEX "app_direct_messages_unread_idx" ON "app_direct_messages" USING btree ("recipient_id","read_at");--> statement-breakpoint
CREATE INDEX "app_org_post_comments_post_idx" ON "app_org_post_comments" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "app_org_posts_org_idx" ON "app_org_posts" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "app_short_links_owner_target_unique" ON "app_short_links" USING btree ("owner_id","target");