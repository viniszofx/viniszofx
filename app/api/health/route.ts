import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Saúde HTTP e do banco, usada pela página de Suporte (e por monitores). */
export async function GET() {
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: true, latencyMs: Date.now() - started }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("health check failed", error);
    return Response.json({ ok: false, database: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
