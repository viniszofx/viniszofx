CREATE TABLE "app_blog_ad_slots" (
	"author_id" text NOT NULL,
	"position" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"advertiser" text DEFAULT '' NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"target_url" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_blog_ad_slots_author_id_position_pk" PRIMARY KEY("author_id","position")
);
