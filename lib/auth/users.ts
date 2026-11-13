import "server-only";
import { db, isLocalAuth } from "@/lib/db";
import { authUsers, localAuthUser } from "@/lib/db/schema/auth";

export async function hasAuthUsers() {
  if (isLocalAuth) {
    const rows = await db.select({ id: localAuthUser.id }).from(localAuthUser).limit(1);
    return rows.length > 0;
  }
  const rows = await db.select({ id: authUsers.id }).from(authUsers).limit(1);
  return rows.length > 0;
}
