CREATE TABLE "app_blog_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"author_id" text NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_blog_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"slug" text,
	"title" text DEFAULT '' NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"document" jsonb,
	"cover_asset_id" text,
	"cover_position" integer DEFAULT 50 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "app_blog_assets" ADD CONSTRAINT "app_blog_assets_post_id_app_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."app_blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_blog_assets_post_idx" ON "app_blog_assets" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "app_blog_posts_slug_unique" ON "app_blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "app_blog_posts_status_published_idx" ON "app_blog_posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "app_blog_posts_author_idx" ON "app_blog_posts" USING btree ("author_id");