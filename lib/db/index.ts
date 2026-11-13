import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as appSchema from "@/lib/db/schema/app";
import { localAuthSchema } from "@/lib/db/schema/auth";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");

export const isLocalAuth = process.env.AUTH_MODE === "local";
const schema = { ...appSchema, ...localAuthSchema };
let database: NodePgDatabase<typeof schema>;
let hostedDatabase: NeonHttpDatabase<typeof schema> | undefined;

if (isLocalAuth) {
  const client = new Pool({ connectionString: databaseUrl });
  database = drizzlePostgres(client, { schema });
} else {
  hostedDatabase = drizzle({ client: neon(databaseUrl), schema });
  database = hostedDatabase as unknown as NodePgDatabase<typeof schema>;
}

export const db = database;

export function batch(queries: Parameters<NeonHttpDatabase<typeof schema>["batch"]>[0]) {
  if (!hostedDatabase) throw new Error("batch só está disponível no modo Neon.");
  return hostedDatabase.batch(queries);
}
