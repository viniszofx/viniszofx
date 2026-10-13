import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { deleteBlogAsset, putBlogAsset } from "@/lib/blog/storage";
import { getOwnPost } from "@/lib/blog/posts";
import { db } from "@/lib/db";
import { blogAssets } from "@/lib/db/schema/app";

export const runtime = "nodejs";
const maxFileSize = 20 * 1024 * 1024;
const inlineImages = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);
type Context = { params: Promise<{ postId: string }> };

async function scopeFor(context: Context) {
  const [{ data: session }, { postId }] = await Promise.all([auth.getSession(), context.params]);
  if (!session?.user) return null;
  const post = await getOwnPost(postId, session.user.id);
  return post ? { userId: session.user.id, postId } : null;
}

export async function GET(_request: Request, context: Context) {
  const scope = await scopeFor(context);
  if (!scope) return new Response(null, { status: 404 });
  const assets = await db.select().from(blogAssets)
    .where(and(eq(blogAssets.postId, scope.postId), eq(blogAssets.authorId, scope.userId)));
  return Response.json(assets, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request, context: Context) {
  const scope = await scopeFor(context);
  if (!scope) return new Response(null, { status: 404 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > maxFileSize)
    return new Response("Selecione um arquivo de até 20 MB.", { status: 400 });
  const id = randomUUID();
  const contentType = inlineImages.has(file.type) ? file.type : "application/octet-stream";
  const stored = new File([file], file.name, { type: contentType });
  await putBlogAsset(scope.userId, scope.postId, id, stored);
  try {
    const [asset] = await db.insert(blogAssets).values({
      id, postId: scope.postId, authorId: scope.userId,
      name: file.name.slice(0, 255) || "arquivo", contentType, size: file.size,
    }).returning();
    return Response.json(asset, { status: 201 });
  } catch (error) {
    await deleteBlogAsset(scope.userId, scope.postId, id).catch(() => {});
    throw error;
  }
}
