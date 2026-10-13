import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema/app";
import type { BlogPostData } from "./types";

export type BlogPost = typeof blogPosts.$inferSelect;

export function serializePost(post: BlogPost): BlogPostData {
  return { id: post.id, slug: post.slug, title: post.title, excerpt: post.excerpt,
    seoTitle: post.seoTitle, seoDescription: post.seoDescription, noIndex: post.noIndex,
    adPlacements: post.adPlacements,
    content: post.content, document: post.document, coverAssetId: post.coverAssetId, coverPosition: post.coverPosition,
    status: post.status, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() ?? null };
}

export function listPublishedPosts() {
  return db.select().from(blogPosts).where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));
}

export async function getPublishedPost(slug: string) {
  const [post] = await db.select().from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published"))).limit(1);
  return post;
}

export function listOwnPosts(authorId: string) {
  return db.select().from(blogPosts).where(eq(blogPosts.authorId, authorId))
    .orderBy(desc(blogPosts.updatedAt));
}

export async function getOwnPost(id: string, authorId: string) {
  const [post] = await db.select().from(blogPosts)
    .where(and(eq(blogPosts.id, id), eq(blogPosts.authorId, authorId))).limit(1);
  return post;
}

export function postSlug(title: string, id: string) {
  const normalized = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72).replace(/-$/, "");
  return `${normalized || "post"}-${id.slice(0, 8)}`;
}
