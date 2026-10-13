import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getOwnPost, serializePost } from "@/lib/blog/posts";
import { db } from "@/lib/db";
import { blogAssets } from "@/lib/db/schema/app";
import { BlogEditor } from "@/components/blog/blog-editor";

export const metadata: Metadata = { title: "Editar post | Blog" };
type Props = { params: Promise<{ postId: string }> };

export default async function BlogEditorPage({ params }: Props) {
  const [{ data: session }, { postId }] = await Promise.all([auth.getSession(), params]);
  if (!session?.user) redirect("/login");
  const post = await getOwnPost(postId, session.user.id);
  if (!post) notFound();
  const assets = await db.select().from(blogAssets)
    .where(and(eq(blogAssets.postId, post.id), eq(blogAssets.authorId, session.user.id)));
  return <BlogEditor initial={serializePost(post)} initialAssets={assets.map((asset) => ({
    id: asset.id, name: asset.name, contentType: asset.contentType, size: asset.size,
    createdAt: asset.createdAt.toISOString(),
  }))} />;
}
