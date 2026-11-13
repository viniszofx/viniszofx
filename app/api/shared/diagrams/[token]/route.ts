import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { diagrams } from "@/lib/db/schema/app";

type Context = { params: Promise<{ token: string }> };

/** Leitura pública de um diagrama pelo link. */
export async function GET(_request: Request, context: Context) {
  const { token } = await context.params;
  if (!/^[0-9a-f]{36}$/.test(token)) return new Response(null, { status: 404 });
  const [row] = await db.select({ data: diagrams.data }).from(diagrams).where(sql`${diagrams.data}->>'shareToken' = ${token}`).limit(1);
  const diagram = row?.data as { title?: string; xml?: string } | undefined;
  if (!diagram) return new Response(null, { status: 404 });
  return Response.json({ title: diagram.title ?? "Diagrama", xml: diagram.xml ?? "" }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
