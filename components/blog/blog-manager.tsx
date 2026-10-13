"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RiAddLine as Plus, RiArticleLine as Article, RiDeleteBinLine as Trash, RiExternalLinkLine as External, RiAdvertisementLine as Advertisement } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { blogAssetUrl, type BlogPostData } from "@/lib/blog/types";

export function BlogManager({ initialPosts }: { initialPosts: BlogPostData[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<BlogPostData | null>(null);
  const [error, setError] = useState("");
  const changed = useRef(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/blog/posts", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Falha ao atualizar a lista.");
      return response.json() as Promise<BlogPostData[]>;
    }).then((fresh) => { if (active && !changed.current) setPosts(fresh); }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function create() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/blog/posts", { method: "POST" });
      if (!response.ok) throw new Error(await response.text() || "Não foi possível criar o post.");
      const { id } = await response.json() as { id: string };
      router.push(`/dashboard/blog/${id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar o post."); setBusy(false); }
  }

  async function remove() {
    if (!deleting) return;
    const response = await fetch(`/api/blog/posts/${deleting.id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(await response.text() || "Não foi possível excluir o post.");
    changed.current = true;
    setPosts((previous) => previous.filter((item) => item.id !== deleting.id));
  }

  const visible = posts.filter((post) => `${post.title} ${post.excerpt}`.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")));
  return <main className="flex w-full flex-col gap-6 px-4 pb-12 pt-6 sm:px-7">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5"><div><p className="mb-2 text-xs text-muted-foreground">Console / Conteúdo</p><h1 className="text-2xl font-semibold">Blog</h1><p className="mt-1 text-sm text-muted-foreground">Posts e mídias da publicação.</p></div><div className="flex flex-wrap gap-2"><Button nativeButton={false} render={<Link href="/dashboard/ads" />} variant="outline" size="sm"><Advertisement />Publicidade</Button><Button nativeButton={false} render={<Link href="/blog" target="_blank" />} variant="outline" size="sm"><External />Ver blog</Button><Button disabled={busy} onClick={() => void create()} size="sm"><Plus />{busy ? "Criando…" : "Novo post"}</Button></div></div>
    <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Publicações <span className="ml-1 font-normal text-muted-foreground">{posts.length}</span></h2><input type="search" aria-label="Buscar posts" placeholder="Buscar posts…" value={query} onChange={(event) => setQuery(event.target.value)} className="h-8 w-full max-w-xs border bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {visible.length ? <div className="border border-b-0 bg-card">{visible.map((post) => <article key={post.id} className="flex min-w-0 border-b">
      <Link href={`/dashboard/blog/${post.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-3 outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden border bg-muted">{post.coverAssetId ? <Image src={blogAssetUrl(post.coverAssetId)} alt="" fill sizes="44px" unoptimized className="object-cover" /> : <Article className="size-5 text-muted-foreground" />}</div>
        <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-medium">{post.title || "Sem título"}</h3><p className="mt-0.5 truncate text-xs text-muted-foreground">{post.excerpt || "Sem resumo"}</p></div><span className={post.status === "published" ? "hidden text-xs text-primary sm:block" : "hidden text-xs text-muted-foreground sm:block"}>{post.status === "published" ? "Publicado" : "Rascunho"}</span><time dateTime={post.updatedAt} className="hidden w-20 text-right text-xs text-muted-foreground md:block">{new Date(post.updatedAt).toLocaleDateString("pt-BR")}</time>
      </Link><div className="flex items-center border-l px-2"><Button variant="ghost" size="icon-sm" aria-label={`Excluir ${post.title || "post sem título"}`} onClick={() => setDeleting(post)}><Trash /></Button></div>
    </article>)}</div> : <div className="border bg-card px-5 py-8"><h2 className="text-sm font-medium">{posts.length ? "Nenhum post encontrado" : "Nenhuma publicação"}</h2><p className="mt-1 text-xs text-muted-foreground">{posts.length ? "Tente outra busca." : "Crie um post para começar."}</p></div>}
    {deleting && <ConfirmDialog title="Excluir post?" description={`“${deleting.title || "Sem título"}” e seus arquivos serão removidos. Esta ação não pode ser desfeita.`} onConfirm={remove} onClose={() => setDeleting(null)} />}
  </main>;
}
