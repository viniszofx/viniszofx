import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Each dashboard feature owns its records. Nested fields and file references
// remain in the payload, while every entity has its own relational identity.
function records(name: string) {
  return pgTable(name, {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    position: integer("position").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }, (table) => [primaryKey({ columns: [table.userId, table.id] })]);
}

export const clients = records("app_clients");
export const employees = records("app_employees");
export const vehicles = records("app_vehicles");
export const reservations = records("app_reservations");
export const trips = records("app_trips");
export const boards = records("app_boards");
export const notes = records("app_notes");
export const attachments = records("app_note_attachments");

// Prevents old IndexedDB records from reappearing after a feature is emptied.
export const migrationState = pgTable("app_migration_state", {
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.kind] })]);

export const featureTables = { clients, employees, vehicles, reservations, trips, boards, notes, attachments } as const;

export const workplaceSettings = pgTable("app_workplace_settings", {
  userId: text("user_id").primaryKey(),
  name: text("name").notNull().default("Meu Workplace"),
  description: text("description").notNull().default("Notas e quadros em um só lugar."),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blogPosts = pgTable("app_blog_posts", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull(),
  slug: text("slug"),
  title: text("title").notNull().default(""),
  excerpt: text("excerpt").notNull().default(""),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  noIndex: boolean("no_index").notNull().default(false),
  adPlacements: jsonb("ad_placements").$type<{ top: boolean; middle: boolean; bottom: boolean }>().notNull().default({ top: false, middle: true, bottom: true }),
  content: text("content").notNull().default(""),
  document: jsonb("document").$type<Record<string, unknown> | null>(),
  coverAssetId: text("cover_asset_id"),
  coverPosition: integer("cover_position").notNull().default(50),
  status: text("status").$type<"draft" | "published">().notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("app_blog_posts_slug_unique").on(table.slug),
  index("app_blog_posts_status_published_idx").on(table.status, table.publishedAt),
  index("app_blog_posts_author_idx").on(table.authorId),
]);

export const blogAssets = pgTable("app_blog_assets", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("app_blog_assets_post_idx").on(table.postId)]);

export const blogAdSlots = pgTable("app_blog_ad_slots", {
  authorId: text("author_id").notNull(),
  position: text("position").$type<"top" | "middle" | "bottom">().notNull(),
  enabled: boolean("enabled").notNull().default(false),
  advertiser: text("advertiser").notNull().default(""),
  headline: text("headline").notNull().default(""),
  description: text("description").notNull().default(""),
  targetUrl: text("target_url").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.authorId, table.position] })]);
