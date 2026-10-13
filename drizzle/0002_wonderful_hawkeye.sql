CREATE TABLE "app_workplace_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Meu Workplace' NOT NULL,
	"description" text DEFAULT 'Notas e quadros em um só lugar.' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
