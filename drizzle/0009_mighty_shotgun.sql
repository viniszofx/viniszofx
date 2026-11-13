CREATE TABLE "app_drawio_libraries" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_drawio_libraries_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_inventories" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_inventories_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_todo_lists" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_todo_lists_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_todos" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_todos_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_whiteboards" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_whiteboards_user_id_id_pk" PRIMARY KEY("user_id","id")
);
