import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RiArrowRightLine as ArrowRight, RiArticleLine as Article } from "@remixicon/react";
import { listPublishedPosts } from "@/lib/blog/posts";
import { blogAssetUrl } from "@/lib/blog/types";

export const metadata: Metadata = { title: "Blog | Vinicius Souza", description: "Artigos, ideias e experiências sobre desenvolvimento de software.", alternates: { canonical: "/blog" } };

export default async function BlogPage() {
  const posts = await listPublishedPosts();
  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
    <header className="mb-10 border-b pb-8"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Publicações</p><h1 className="font-heading text-4xl font-semibold sm:text-5xl">Blog</h1><p className="mt-4 max-w-2xl text-muted-foreground">Notas sobre software, projetos e o trabalho de construir produtos digitais.</p></header>
    {posts.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((post) =>
      <article key={post.id} className="group flex min-w-0 flex-col overflow-hidden border bg-card">
        <Link href={`/blog/${post.slug}`} className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-muted/50">
            {post.coverAssetId ? <Image src={blogAssetUrl(post.coverAssetId)} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized className="object-cover transition-transform group-hover:scale-[1.03]" style={{ objectPosition: `center ${post.coverPosition}%` }} /> : <Article className="size-10 text-primary/50" aria-hidden="true" />}
          </div>
          <div className="flex flex-1 flex-col p-5"><time dateTime={post.publishedAt?.toISOString()} className="text-xs text-muted-foreground">{post.publishedAt?.toLocaleDateString("pt-BR")}</time><h2 className="mt-3 font-heading text-xl font-semibold group-hover:text-primary">{post.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt || post.content.slice(0, 180)}</p><span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary">Ler artigo <ArrowRight className="size-4" /></span></div>
        </Link>
      </article>)}</div> : <div className="border bg-card px-6 py-16 text-center"><Article className="mx-auto size-9 text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-xl font-semibold">Nenhum artigo publicado ainda</h2><p className="mt-2 text-sm text-muted-foreground">Volte em breve para novas publicações.</p></div>}
  </main>;
}
