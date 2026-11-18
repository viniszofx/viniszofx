CREATE TABLE "app_proposals" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_proposals_user_id_id_pk" PRIMARY KEY("user_id","id")
);
