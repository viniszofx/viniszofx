CREATE TABLE IF NOT EXISTS "app_user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "app_user_profiles_username_unique" ON "app_user_profiles" USING btree ("username") WHERE "username" <> '';
