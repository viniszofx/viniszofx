CREATE TABLE "app_org_post_votes" (
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"option_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_org_post_votes_post_id_user_id_option_id_pk" PRIMARY KEY("post_id","user_id","option_id")
);
--> statement-breakpoint
ALTER TABLE "app_org_posts" ADD COLUMN "cover_file_id" text;--> statement-breakpoint
ALTER TABLE "app_org_posts" ADD COLUMN "cover_owner_id" text;--> statement-breakpoint
ALTER TABLE "app_org_posts" ADD COLUMN "poll" jsonb;--> statement-breakpoint
ALTER TABLE "app_org_post_votes" ADD CONSTRAINT "app_org_post_votes_post_id_app_org_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."app_org_posts"("id") ON DELETE cascade ON UPDATE no action;