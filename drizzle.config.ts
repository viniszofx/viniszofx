import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/app.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  tablesFilter: ["app_*"],
  dbCredentials: { url: process.env.DATABASE_URL! },
});
