import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/blog/posts";
import { siteUrl } from "@/lib/seo/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPublishedPosts();
  return [
    { url: siteUrl(), changeFrequency: "monthly", priority: 1 },
    { url: siteUrl("/blog"), changeFrequency: "weekly", priority: 0.8 },
    ...posts.filter((post) => !post.noIndex && post.slug).map((post) => ({
      url: siteUrl(`/blog/${post.slug}`), lastModified: post.updatedAt,
      changeFrequency: "monthly" as const, priority: 0.7,
    })),
  ];
}
