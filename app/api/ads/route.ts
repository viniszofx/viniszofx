import { auth } from "@/lib/auth/server";
import { adPositions, listAdSlots, type AdPosition } from "@/lib/blog/ads";
import { db } from "@/lib/db";
import { blogAdSlots } from "@/lib/db/schema/app";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  return Response.json(await listAdSlots(session.user.id), { headers: { "Cache-Control": "private, no-store" } });
}

function validUrl(value: string) {
  if (!value) return true;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}

export async function PUT(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 10_000) return new Response("Dados muito grandes.", { status: 413 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return new Response("JSON inválido.", { status: 400 }); }
  const { position, enabled, advertiser, headline, description, targetUrl } = body;
  if (!adPositions.includes(position as AdPosition) || typeof enabled !== "boolean" ||
      typeof advertiser !== "string" || advertiser.length > 80 || typeof headline !== "string" || headline.length > 120 ||
      typeof description !== "string" || description.length > 300 || typeof targetUrl !== "string" || targetUrl.length > 2048 ||
      !validUrl(targetUrl))
    return new Response("Dados da publicidade inválidos.", { status: 400 });
  if (enabled && (!headline.trim() || !targetUrl.trim())) return new Response("Informe título e link antes de ativar.", { status: 400 });
  await db.insert(blogAdSlots).values({ authorId: session.user.id, position: position as AdPosition, enabled,
    advertiser: advertiser.trim(), headline: headline.trim(), description: description.trim(),
    targetUrl: targetUrl.trim() }).onConflictDoUpdate({
    target: [blogAdSlots.authorId, blogAdSlots.position],
    set: { enabled, advertiser: advertiser.trim(), headline: headline.trim(), description: description.trim(),
      targetUrl: targetUrl.trim(), updatedAt: new Date() },
  });
  return Response.json((await listAdSlots(session.user.id)).find((ad) => ad.position === position));
}
