import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema/app";
import { requirePlatformAdmin } from "@/lib/organizations/guard";

/** Leads do site, do mais recente para o mais antigo. */
export async function GET() {
  const access = await requirePlatformAdmin();
  if (access.response) return access.response;
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(2000);
  return Response.json(rows, { headers: { "Cache-Control": "private, no-store" } });
}
