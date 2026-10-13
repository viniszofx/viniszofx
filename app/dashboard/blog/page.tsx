import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { listOwnPosts, serializePost } from "@/lib/blog/posts";
import { BlogManager } from "@/components/blog/blog-manager";

export const metadata: Metadata = { title: "Blog | Viniccius" };

export default async function BlogManagerPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");
  const posts = (await listOwnPosts(data.user.id)).map(serializePost);
  return <BlogManager initialPosts={posts} />;
}
