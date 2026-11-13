CREATE TABLE IF NOT EXISTS "app_platform_admin" (
	"slot" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_platform_admin_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE IF NOT EXISTS "app_organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_organizations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "app_organizations_status_check" CHECK ("status" IN ('active', 'suspended'))
);

CREATE TABLE IF NOT EXISTS "app_organization_members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL REFERENCES "app_organizations"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_organization_members_role_check" CHECK ("role" IN ('member', 'external')),
	CONSTRAINT "app_organization_members_status_check" CHECK ("status" IN ('active', 'blocked')),
	CONSTRAINT "app_organization_members_org_user_unique" UNIQUE("organization_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "app_organization_members_user_status_idx" ON "app_organization_members" ("user_id", "status");
