import { auth } from "@/lib/auth/server";
import { adPositions, type AdPosition } from "@/lib/blog/ads";
import { deleteAdImage, putAdImage } from "@/lib/blog/storage";
import { db } from "@/lib/db";
import { blogAdSlots } from "@/lib/db/schema/app";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";
const imageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 6_000_000) return new Response("Imagem muito grande.", { status: 413 });
  const form = await request.formData();
  const position = form.get("position");
  const file = form.get("file");
  if (typeof position !== "string" || !adPositions.includes(position as AdPosition) ||
      !(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024 || !imageTypes.has(file.type))
    return new Response("Envie PNG, JPEG, WebP ou AVIF de até 5 MB.", { status: 400 });
  await putAdImage(session.user.id, position, file);
  const imageUrl = `/api/ads/image/${encodeURIComponent(session.user.id)}/${position}?v=${Date.now()}`;
  await db.insert(blogAdSlots).values({ authorId: session.user.id, position: position as AdPosition, imageUrl })
    .onConflictDoUpdate({ target: [blogAdSlots.authorId, blogAdSlots.position], set: { imageUrl, updatedAt: new Date() } });
  return Response.json({ imageUrl });
}

export async function DELETE(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return new Response(null, { status: 401 });
  const position = new URL(request.url).searchParams.get("position");
  if (!position || !adPositions.includes(position as AdPosition)) return new Response("Posição inválida.", { status: 400 });
  await db.update(blogAdSlots).set({ imageUrl: "", updatedAt: new Date() })
    .where(and(eq(blogAdSlots.authorId, session.user.id), eq(blogAdSlots.position, position as AdPosition)));
  await deleteAdImage(session.user.id, position);
  return new Response(null, { status: 204 });
}
