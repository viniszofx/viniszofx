ALTER TABLE "app_blog_posts" ADD COLUMN "seo_title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_blog_posts" ADD COLUMN "seo_description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_blog_posts" ADD COLUMN "no_index" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "app_blog_posts" ADD COLUMN "ad_placements" jsonb DEFAULT '{"top":false,"middle":true,"bottom":true}'::jsonb NOT NULL;