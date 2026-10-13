import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { adPositions, type AdPosition } from "@/lib/blog/ads";
import { getAdImage } from "@/lib/blog/storage";
import { db } from "@/lib/db";
import { blogAdSlots } from "@/lib/db/schema/app";

export const runtime = "nodejs";
type Context = { params: Promise<{ authorId: string; position: string }> };

export async function GET(_request: Request, context: Context) {
  const { authorId, position } = await context.params;
  if (!adPositions.includes(position as AdPosition)) return new Response(null, { status: 404 });
  const [ad] = await db.select().from(blogAdSlots).where(and(eq(blogAdSlots.authorId, authorId),
    eq(blogAdSlots.position, position as AdPosition))).limit(1);
  if (!ad?.imageUrl) return new Response(null, { status: 404 });
  if (!ad.enabled || !ad.headline || !ad.targetUrl) {
    const { data: session } = await auth.getSession();
    if (session?.user?.id !== authorId) return new Response(null, { status: 404 });
  }
  try {
    const object = await getAdImage(authorId, position);
    const body = await object.Body?.transformToByteArray();
    if (!body) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(body), { headers: { "Content-Type": object.ContentType || "application/octet-stream",
      "Content-Disposition": "inline", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") return new Response(null, { status: 404 });
    throw error;
  }
}
