import { asc, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { passwordRequests } from "@/lib/db/schema/app";
import { requirePlatformAdmin } from "@/lib/organizations/guard";
import { userNames } from "@/lib/organizations/current";

/** Pedidos de nova senha em aberto. */
export async function GET() {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  const rows = await db.select().from(passwordRequests).where(isNull(passwordRequests.resolvedAt)).orderBy(asc(passwordRequests.createdAt));
  const names = await userNames(rows.map(row => row.userId));
  return Response.json(rows.map(row => ({ ...row, name: names.get(row.userId) ?? row.email })), { headers: { "Cache-Control": "private, no-store" } });
}
