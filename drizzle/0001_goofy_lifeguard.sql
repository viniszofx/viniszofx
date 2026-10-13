CREATE TABLE "app_note_attachments" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_note_attachments_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_boards" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_boards_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_clients" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_clients_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_employees" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_employees_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_migration_state" (
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_migration_state_user_id_kind_pk" PRIMARY KEY("user_id","kind")
);
--> statement-breakpoint
CREATE TABLE "app_notes" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_notes_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_reservations" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_reservations_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_trips" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_trips_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "app_vehicles" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"position" integer NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_vehicles_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
DROP TABLE "app_collections" CASCADE;