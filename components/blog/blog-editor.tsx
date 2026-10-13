"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiArrowLeftLine as ArrowLeft, RiAttachmentLine as Paperclip, RiExternalLinkLine as External, RiLoader4Line as Loader } from "@remixicon/react";
import type { Editor, JSONContent } from "@tiptap/react";
import { AttachmentProvider } from "@/components/editor/attachment-provider";
import { NoteAttachments } from "@/components/notes/note-attachments";
import { NoteCover } from "@/components/notes/note-cover";
import { NotesSkeleton } from "@/components/notes/notes-skeleton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { BlogAssetData, BlogPostData } from "@/lib/blog/types";
import { attachmentId } from "@/lib/notes/types";
import { resolveBlogAsset } from "./blog-body";
import { useBlogAssets } from "./use-blog-assets";

const RichTextEditor = dynamic(() => import("@/components/notes/editor/rich-text-editor").then((module) => module.RichTextEditor), {
  ssr: false, loading: () => <NotesSkeleton label="Carregando editor…" />,
});

export function BlogEditor({ initial, initialAssets }: { initial: BlogPostData; initialAssets: BlogAssetData[] }) {
  const router = useRouter();
  const [post, setPost] = useState(initial);
  const current = useRef(initial);
  const revision = useRef(0);
  const editor = useRef<Editor | null>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const coverUpload = useRef(false);
  const [editorRevision, setEditorRevision] = useState(0);
  const [filesOpen, setFilesOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(changes: Partial<BlogPostData>) {
    current.current = { ...current.current, ...changes };
    revision.current++;
    setPost(current.current);
    setDirty(true);
    setMessage("");
  }

  async function save(status: "draft" | "published" = current.current.status) {
    if (busy) throw new Error("Aguarde a operação atual.");
    const snapshot = current.current;
    if (status === "published" && (!snapshot.title.trim() || !snapshot.content.trim())) {
      const problem = "Informe título e conteúdo antes de publicar.";
      setError(problem); throw new Error(problem);
    }
    const saveRevision = revision.current;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/blog/posts/${snapshot.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: snapshot.title, excerpt: snapshot.excerpt, seoTitle: snapshot.seoTitle,
          seoDescription: snapshot.seoDescription, noIndex: snapshot.noIndex, adPlacements: snapshot.adPlacements, content: snapshot.content,
          document: snapshot.document, coverAssetId: snapshot.coverAssetId, coverPosition: snapshot.coverPosition, status }),
      });
      if (!response.ok) throw new Error(await response.text() || "Não foi possível salvar o post.");
      const stored = await response.json() as BlogPostData;
      if (revision.current === saveRevision) { current.current = stored; setPost(stored); setDirty(false); }
      else {
        current.current = { ...current.current, slug: stored.slug, status: stored.status,
          publishedAt: stored.publishedAt, updatedAt: stored.updatedAt };
        setPost(current.current);
      }
      setMessage(status === "published" ? "Post publicado." : snapshot.status === "published" ? "Post salvo." : "Rascunho salvo.");
      return stored;
    } catch (cause) {
      const problem = cause instanceof Error ? cause.message : "Não foi possível salvar o post.";
      setError(problem); throw cause;
    } finally { setBusy(false); }
  }

  const onReady = useCallback((instance: Editor | null) => { editor.current = instance; }, []);
  function embed(markdown: string) {
    if (editor.current) {
      const linked = /^(!?)\[([\s\S]*)\]\(([^)]+)\)$/.exec(markdown);
      if (linked && attachmentId(linked[3])) {
        const name = linked[2].replace(/\\([\\[\]])/g, "$1");
        editor.current.chain().focus().insertContent([
          linked[1] ? { type: "image", attrs: { src: linked[3], alt: name } }
            : { type: "noteFile", attrs: { href: linked[3], name } },
          { type: "paragraph" },
        ]).run();
      } else editor.current.chain().focus().insertContent(`\n\n${markdown}\n\n`, { contentType: "markdown" }).run();
    } else { update({ content: `${current.current.content}\n\n${markdown}\n`, document: null }); setEditorRevision((value) => value + 1); }
  }

  const files = useBlogAssets({ postId: post.id, initial: initialAssets, onEmbed: embed,
    onUploaded: (file) => { if (coverUpload.current) update({ coverAssetId: file.id, coverPosition: 50 }); },
    onRemoved: (file) => { if (current.current.coverAssetId === file.id) update({ coverAssetId: null }); },
    beforeRemove: async () => { if (dirty) await save(); },
  });

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function back() {
    try { if (dirty) await save(); router.push("/dashboard/blog"); }
    catch { /* The visible error keeps the editor open. */ }
  }

  const publicationUrl = post.slug ? `/blog/${post.slug}` : "";
  return <AttachmentProvider resolve={resolveBlogAsset}><main className="min-w-0 bg-background">
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6 md:top-[57px]">
      <Button variant="ghost" size="sm" disabled={busy || files.busy} onClick={() => void back()}><ArrowLeft />Blog</Button>
      <div className="flex flex-wrap items-center gap-2"><span className={post.status === "published" ? "bg-primary/10 px-3 py-2 text-xs font-semibold text-primary" : "bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground"}>{post.status === "published" ? "Publicado" : "Rascunho"}</span>
        {publicationUrl && post.status === "published" && <Button nativeButton={false} render={<Link href={publicationUrl} target="_blank" />} variant="outline" size="sm"><External />Ver post</Button>}
        <Button variant="outline" size="sm" disabled={busy || files.busy} onClick={() => setFilesOpen(true)}><Paperclip />Arquivos</Button>
        <Button variant="outline" size="sm" disabled={busy || files.busy || !dirty} onClick={() => void save().catch(() => {})}>{busy ? <Loader className="animate-spin" /> : null}Salvar</Button>
        <Button size="sm" disabled={busy || files.busy} onClick={() => void save(post.status === "published" ? "draft" : "published").catch(() => {})}>{post.status === "published" ? "Voltar a rascunho" : "Publicar"}</Button>
      </div>
    </header>
    <div onPasteCapture={(event) => {
      const images = Array.from(event.clipboardData.items).filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile()).filter((file): file is File => !!file);
      if (images.length) { event.preventDefault(); event.stopPropagation(); if (!files.busy) void files.upload(images); }
    }}>
      <NoteCover files={files} id={post.coverAssetId} position={post.coverPosition} disabled={busy || files.busy} ownerLabel="publicação"
        onSelect={(id) => update({ coverAssetId: id })} onPosition={(position) => update({ coverPosition: position })}
        onUpload={(file) => { coverUpload.current = true; void files.upload([file], false).finally(() => { coverUpload.current = false; }); }} />
      <div className="mx-auto grid w-full max-w-[1500px] lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="grid min-w-0 w-full max-w-4xl gap-5 py-8 pl-12 pr-5 sm:px-10 sm:py-12 lg:mx-auto">
        <label className="sr-only" htmlFor="blog-title">Título do post</label><input id="blog-title" autoFocus placeholder="Título do post" value={post.title} maxLength={150} onChange={(event) => update({ title: event.target.value })} className="w-full border-0 bg-transparent py-2 font-heading text-2xl font-semibold outline-none placeholder:text-muted-foreground sm:text-4xl" />
        <label className="sr-only" htmlFor="blog-excerpt">Resumo do post</label><textarea id="blog-excerpt" placeholder="Escreva um resumo para a listagem do blog…" value={post.excerpt} maxLength={300} rows={2} onChange={(event) => update({ excerpt: event.target.value })} className="w-full resize-y border-b bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-primary" />
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{busy ? "Salvando…" : dirty ? "Alterações não salvas" : message || "Todas as alterações foram salvas"}</p>
        <RichTextEditor key={editorRevision} value={post.content} document={post.document} editable extendedMarkdown documentMode showActions={false} onReady={onReady}
          ariaLabel="Conteúdo do post" onChange={(content) => update({ content })}
          onDocumentChange={(document) => update({ document: document as JSONContent })}
          onInsertFile={(kind) => { if (uploadInput.current) { uploadInput.current.accept = kind === "image" ? "image/png,image/jpeg,image/webp,image/gif,image/avif" : ""; uploadInput.current.click(); } }} />
        {(error || files.error) && <p role="alert" className="text-sm text-destructive">{error || files.error}</p>}
      </div>
      <aside aria-label="Configurações da publicação" className="border-t bg-sidebar px-5 py-6 lg:sticky lg:top-[116px] lg:h-[calc(100svh-116px)] lg:overflow-y-auto lg:border-l lg:border-t-0">
        <h2 className="text-sm font-semibold">Configurações do post</h2>
        <p className="mt-1 text-xs text-muted-foreground">Ajustes desta publicação.</p>
        <section className="mt-6 border-t pt-5" aria-labelledby="post-seo-heading"><h3 id="post-seo-heading" className="text-xs font-semibold">SEO e indexação</h3><div className="mt-4 grid gap-4">
          <label className="grid gap-1.5 text-xs font-medium" htmlFor="blog-seo-title">Título nos buscadores<input id="blog-seo-title" value={post.seoTitle} maxLength={150} onChange={(event) => update({ seoTitle: event.target.value })} placeholder={post.title || "Título da publicação"} className="h-9 w-full border bg-background px-2.5 text-xs font-normal outline-none focus-visible:border-primary" /></label>
          <label className="grid gap-1.5 text-xs font-medium" htmlFor="blog-seo-description">Descrição nos buscadores<textarea id="blog-seo-description" value={post.seoDescription} maxLength={300} rows={3} onChange={(event) => update({ seoDescription: event.target.value })} placeholder={post.excerpt || "Resumo da publicação"} className="w-full resize-y border bg-background px-2.5 py-2 text-xs font-normal outline-none focus-visible:border-primary" /></label>
          <p className="text-[11px] leading-4 text-muted-foreground">Se vazios, usa o título e o resumo do post.</p>
          <label className="flex items-start gap-2 text-xs leading-5"><input className="mt-1" type="checkbox" checked={post.noIndex} onChange={(event) => update({ noIndex: event.target.checked })} />Não indexar este post</label>
        </div></section>
        <section className="mt-6 border-t pt-5" aria-labelledby="post-ads-heading"><div className="flex items-center justify-between gap-2"><h3 id="post-ads-heading" className="text-xs font-semibold">Publicidade</h3><Link href="/dashboard/ads" className="text-xs text-primary hover:underline">Gerenciar</Link></div><p className="mt-2 text-[11px] leading-4 text-muted-foreground">Selecione onde campanhas ativas podem aparecer neste post.</p><div className="mt-4 grid gap-3">{([ ["top", "Após a capa"], ["middle", "No meio do conteúdo"], ["bottom", "Ao final do artigo"] ] as const).map(([position, label]) => <label key={position} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={post.adPlacements[position]} onChange={(event) => update({ adPlacements: { ...post.adPlacements, [position]: event.target.checked } })} />{label}</label>)}</div></section>
      </aside>
      </div>
    </div>
    <input ref={uploadInput} className="hidden" aria-label="Adicionar arquivo no corpo" type="file" multiple onChange={(event) => { void files.upload(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <Dialog open={filesOpen} onOpenChange={setFilesOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl"><DialogTitle>Arquivos da publicação</DialogTitle><DialogDescription>Arquivos enviados para o bucket post no Neon. Até 20 MB por arquivo.</DialogDescription><NoteAttachments files={files} disabled={busy || files.busy} ownerLabel="publicação" onEmbed={(markdown) => { embed(markdown); setFilesOpen(false); }} /></DialogContent></Dialog>
  </main></AttachmentProvider>;
}
