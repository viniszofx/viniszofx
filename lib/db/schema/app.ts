import { sql } from "drizzle-orm";
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
export const orders = records("app_orders");
export const tasks = records("app_tasks");
export const events = records("app_events");
export const announcements = records("app_announcements");
export const hotels = records("app_hotels");
export const mileage = records("app_mileage");
export const journeys = records("app_journeys");
export const inventoryItems = records("app_inventory_items");
export const inventoryLocations = records("app_inventory_locations");
export const inventoryMovements = records("app_inventory_movements");
export const requests = records("app_requests");
export const driveFiles = records("app_drive");
export const diagrams = records("app_diagrams");
export const settings = records("app_settings");
export const todos = records("app_todos");
export const todoLists = records("app_todo_lists");
export const whiteboards = records("app_whiteboards");
export const drawioLibraries = records("app_drawio_libraries");
export const inventories = records("app_inventories");

// Prevents old IndexedDB records from reappearing after a feature is emptied.
export const migrationState = pgTable("app_migration_state", {
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.kind] })]);

export const featureTables = {
  clients, employees, vehicles, reservations, trips, boards, notes, attachments, orders, tasks, events, announcements, hotels, mileage, journeys,
  inventory_items: inventoryItems, inventory_locations: inventoryLocations, inventory_movements: inventoryMovements, requests, drive: driveFiles, diagrams, settings, todos, todo_lists: todoLists, whiteboards, drawio_libraries: drawioLibraries, inventories,
} as const;

export const workplaceSettings = pgTable("app_workplace_settings", {
  userId: text("user_id").primaryKey(),
  name: text("name").notNull().default("Meu Workplace"),
  description: text("description").notNull().default("Notas e quadros em um só lugar."),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userProfiles = pgTable("app_user_profiles", {
  userId: text("user_id").primaryKey(),
  username: text("username").notNull().default(""),
  bio: text("bio").notNull().default(""),
  // Foto de perfil no storage da própria conta.
  avatarFileId: text("avatar_file_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("app_user_profiles_username_unique").on(table.username).where(sql`${table.username} <> ''`)]);

export const platformAdmins = pgTable("app_platform_admin", {
  slot: text("slot").primaryKey(),
  userId: text("user_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizations = pgTable("app_organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").$type<"active" | "suspended">().notNull().default("active"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizationMembers = pgTable("app_organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").$type<"member" | "external">().notNull().default("member"),
  status: text("status").$type<"active" | "blocked">().notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("app_organization_members_org_user_unique").on(table.organizationId, table.userId),
  index("app_organization_members_user_status_idx").on(table.userId, table.status),
]);

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

// Recursos compartilhados pela organização (portados do Nodus multiusuário).
export const orgPosts = pgTable("app_org_posts", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  status: text("status").$type<"draft" | "published">().notNull().default("published"),
  publishAt: timestamp("publish_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  // Capa: imagem no storage de quem a enviou.
  coverFileId: text("cover_file_id"),
  coverOwnerId: text("cover_owner_id"),
  // Enquete opcional; os votos ficam em app_org_post_votes.
  poll: jsonb("poll").$type<PostPoll | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("app_org_posts_org_idx").on(table.organizationId, table.createdAt)]);

export type PostPoll = { question: string; options: { id: string; label: string }[]; multiple: boolean; closesAt: string | null };

export const orgPostVotes = pgTable("app_org_post_votes", {
  postId: text("post_id").notNull().references(() => orgPosts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  optionId: text("option_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.postId, table.userId, table.optionId] })]);

export const orgPostComments = pgTable("app_org_post_comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => orgPosts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("app_org_post_comments_post_idx").on(table.postId, table.createdAt)]);

export const directMessages = pgTable("app_direct_messages", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
  // Resposta (citação), edição, exclusão, encaminhamento e anexos.
  replyToId: text("reply_to_id"),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  forwarded: boolean("forwarded").notNull().default(false),
  attachments: jsonb("attachments").$type<{ fileId: string; name: string; type: string; size: number; ownerId?: string }[]>().notNull().default([]),
}, (table) => [
  index("app_direct_messages_pair_idx").on(table.organizationId, table.senderId, table.recipientId, table.createdAt),
  index("app_direct_messages_unread_idx").on(table.recipientId, table.readAt),
]);

// Preferências de cada pessoa para cada conversa: arquivar, silenciar e bloquear.
export const messageThreads = pgTable("app_message_threads", {
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  otherId: text("other_id").notNull(),
  archived: boolean("archived").notNull().default(false),
  muted: boolean("muted").notNull().default(false),
  blocked: boolean("blocked").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.organizationId, table.userId, table.otherId] })]);

// Módulos desligados pela administração (Sistema › Módulos). Ausente = ligado.
export const moduleSettings = pgTable("app_modules", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shortLinks = pgTable("app_short_links", {
  code: text("code").primaryKey(),
  ownerId: text("owner_id").notNull(),
  target: text("target").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("app_short_links_owner_target_unique").on(table.ownerId, table.target)]);

// "Esqueci a senha" no modo local (sem e-mail): a administração define uma senha nova.
export const passwordRequests = pgTable("app_password_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [index("app_password_requests_open_idx").on(table.resolvedAt, table.createdAt)]);

// Leads do site (botão de conversa da página inicial) e o funil de marketing.
export const leads = pgTable("app_leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").$type<"new" | "contacted" | "qualified" | "won" | "lost">().notNull().default("new"),
  source: text("source").notNull().default(""),
  campaign: jsonb("campaign").$type<Record<string, string>>().notNull().default({}),
  notes: text("notes").notNull().default(""),
  nextContactAt: timestamp("next_contact_at", { withTimezone: true }),
  clientId: text("client_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("app_leads_status_created_idx").on(table.status, table.createdAt), index("app_leads_email_idx").on(table.email)]);
