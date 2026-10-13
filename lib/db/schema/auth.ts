import { pgSchema, text } from "drizzle-orm/pg-core";

// Neon Auth owns this table. Keep it out of Drizzle Kit's migration schema.
const neonAuth = pgSchema("neon_auth");
export const authUsers = neonAuth.table("user", { id: text("id").primaryKey() });
