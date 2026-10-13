import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { deleteBlogAsset } from "@/lib/blog/storage";
import { getOwnPost } from "@/lib/blog/posts";
import { db } from "@/lib/db";
import { blogAssets, blogPosts } from "@/lib/db/schema/app";
import { attachmentUrl } from "@/lib/notes/types";

type Context = { params: Promise<{ postId: string; assetId: string }> };

export async function DELETE(_request: Request, context: Context) {
  const [{ data: session }, { postId, assetId }] = await Promise.all([auth.getSession(), context.params]);
  if (!session?.user) return new Response(null, { status: 401 });
  const post = await getOwnPost(postId, session.user.id);
  if (!post) return new Response(null, { status: 404 });
  const [asset] = await db.select({ id: blogAssets.id }).from(blogAssets)
    .where(and(eq(blogAssets.id, assetId), eq(blogAssets.postId, postId), eq(blogAssets.authorId, session.user.id))).limit(1);
  if (!asset) return new Response(null, { status: 404 });
  if (post.coverAssetId === assetId || post.content.includes(attachmentUrl(assetId)) || JSON.stringify(post.document).includes(attachmentUrl(assetId)))
    return new Response("Remova o arquivo da capa ou do conteúdo antes de excluí-lo.", { status: 409 });
  await db.delete(blogAssets).where(eq(blogAssets.id, assetId));
  await db.update(blogPosts).set({ updatedAt: new Date() }).where(eq(blogPosts.id, postId));
  await deleteBlogAsset(session.user.id, postId, assetId).catch(() => {});
  return new Response(null, { status: 204 });
}
