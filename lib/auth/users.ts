import "server-only";
import { db } from "@/lib/db";
import { authUsers } from "@/lib/db/schema/auth";

export async function hasAuthUsers() {
  const rows = await db.select({ id: authUsers.id }).from(authUsers).limit(1);
  return rows.length > 0;
}
