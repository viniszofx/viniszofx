CREATE TABLE "app_collections" (
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"data" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_collections_user_id_kind_pk" PRIMARY KEY("user_id","kind")
);
