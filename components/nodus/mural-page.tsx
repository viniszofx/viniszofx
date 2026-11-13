"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RiAddLine as Plus, RiChat3Line, RiDeleteBinLine as Trash2, RiPencilLine as Pencil, RiSendPlaneLine } from "@remixicon/react";
import { CatalogLayout, CatalogSearch } from "@/components/listing/catalog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Badge, LoadingBlock } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { announcementState, announcementStore } from "@/lib/nodus/stores";
import { matchesText } from "@/lib/records/store";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";
import { NoOrganization } from "./no-organization";

export type OrgPost = { id: string; title: string; body: string; status: "draft" | "published"; publishAt: string | null; expiresAt: string | null; authorId: string; authorName: string; createdAt: string; updatedAt: string; comments: number };
type Feed = { organization: { id: string; name: string }; me: string; canWrite: boolean; admin: boolean; posts: OrgPost[] };
type Comment = { id: string; body: string; authorName: string; createdAt: string; mine: boolean };

export function postState(post: OrgPost, now = new Date()) {
  return announcementState({ title: post.title, body: post.body, status: post.status, publishAt: post.publishAt ?? "", expiresAt: post.expiresAt ?? "", cover: [] }, now);
}
async function send(url: string, init?: RequestInit) {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!response.ok) throw new Error(await response.text() || "Não foi possível concluir.");
  return response;
}
/** Avisos do mural da organização (compartilhados entre os membros). */
export function useOrgPosts() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [error, setError] = useState("");
  const [noOrganization, setNoOrganization] = useState(false);
  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/org/posts", { cache: "no-store" });
      if (response.status === 401) { setNoOrganization(true); return; }
      if (!response.ok) throw new Error(await response.text() || "Não foi possível carregar o mural.");
      setFeed(await response.json()); setNoOrganization(false); setError("");
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }, []);
  useEffect(() => {
    const first = setTimeout(() => void reload(), 0);
    const timer = setInterval(() => void reload(), 60_000);
    window.addEventListener("focus", reload);
    return () => { clearTimeout(first); clearInterval(timer); window.removeEventListener("focus", reload); };
  }, [reload]);
  return { feed, error, reload, noOrganization };
}

const local = (value: string | null) => { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const when = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function PostDialog({ post, onClose, onSaved }: { post: OrgPost | "new"; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(() => post === "new" ? { title: "", body: "", status: "published", publishAt: "", expiresAt: "" } : { title: post.title, body: post.body, status: post.status, publishAt: local(post.publishAt), expiresAt: local(post.expiresAt) });
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const body = JSON.stringify({ ...value, publishAt: value.publishAt ? new Date(value.publishAt).toISOString() : "", expiresAt: value.expiresAt ? new Date(value.expiresAt).toISOString() : "" });
      await send(post === "new" ? "/api/org/posts" : `/api/org/posts/${post.id}`, { method: post === "new" ? "POST" : "PATCH", body });
      notifySuccess(post === "new" ? "Aviso criado" : "Aviso atualizado"); onSaved(); onClose();
    } catch (cause) { notifyError("Aviso não salvo", cause instanceof Error ? cause.message : ""); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-2xl"><DialogTitle>{post === "new" ? "Novo aviso" : "Editar aviso"}</DialogTitle><DialogDescription>Rascunhos ficam só para você; publicados aparecem para toda a organização.</DialogDescription>
    <form onSubmit={event => void submit(event)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Título" required className="sm:col-span-2"><Input required autoFocus maxLength={200} value={value.title} onChange={event => setValue({ ...value, title: event.target.value })} /></Field>
      <Field label="Situação"><Select value={value.status} options={[{ value: "published", label: "Publicar" }, { value: "draft", label: "Rascunho" }]} onChange={event => setValue({ ...value, status: event.target.value })} /></Field>
      <Field label="Publicar em" hint="Vazio publica imediatamente."><Input type="datetime-local" value={value.publishAt} onChange={event => setValue({ ...value, publishAt: event.target.value })} /></Field>
      <Field label="Retirar do mural em"><Input type="datetime-local" value={value.expiresAt} onChange={event => setValue({ ...value, expiresAt: event.target.value })} /></Field>
      <Field label="Mensagem" className="sm:col-span-2"><Textarea rows={7} maxLength={20000} value={value.body} onChange={event => setValue({ ...value, body: event.target.value })} /></Field>
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy || !value.title.trim()}>Salvar aviso</Button></div>
    </form>
  </DialogContent></Dialog>;
}

function Discussion({ post, onChange }: { post: OrgPost; onChange: () => void }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const load = useCallback(async () => { try { setComments((await (await send(`/api/org/posts/${post.id}/comments`, { cache: "no-store" })).json()).comments); } catch { setComments([]); } }, [post.id]);
  useEffect(() => { const first = setTimeout(() => void load(), 0); const timer = setInterval(() => void load(), 15_000); return () => { clearTimeout(first); clearInterval(timer); }; }, [load]);
  async function add(event: FormEvent) {
    event.preventDefault(); if (!text.trim()) return;
    try { await send(`/api/org/posts/${post.id}/comments`, { method: "POST", body: JSON.stringify({ body: text }) }); setText(""); await load(); onChange(); }
    catch (cause) { notifyError("Comentário não enviado", cause instanceof Error ? cause.message : ""); }
  }
  async function remove(id: string) {
    try { await send(`/api/org/posts/${post.id}/comments?comment=${encodeURIComponent(id)}`, { method: "DELETE" }); await load(); onChange(); }
    catch (cause) { notifyError("Comentário não excluído", cause instanceof Error ? cause.message : ""); }
  }
  return <div className="space-y-3 border-t pt-3">
    {comments === null ? <p className="text-xs text-muted-foreground">Carregando discussão…</p> : !comments.length ? <p className="text-xs text-muted-foreground">Ninguém comentou ainda.</p>
      : <ul className="space-y-2">{comments.map(comment => <li key={comment.id} className="border-l-2 pl-3 text-sm"><p className="text-xs"><strong>{comment.authorName}</strong> <span className="text-muted-foreground">· {when(comment.createdAt)}</span>{comment.mine && <button type="button" className="ml-2 text-xs text-muted-foreground underline" onClick={() => void remove(comment.id)}>Excluir</button>}</p><p className="whitespace-pre-wrap break-words">{comment.body}</p></li>)}</ul>}
    <form onSubmit={event => void add(event)} className="flex items-end gap-2"><Textarea aria-label="Comentar" rows={2} maxLength={5000} placeholder="Escreva um comentário" value={text} onChange={event => setText(event.target.value)} /><Button type="submit" size="sm" disabled={!text.trim()}><RiSendPlaneLine />Enviar</Button></form>
  </div>;
}

export function MuralPage() {
  const { feed, error, reload, noOrganization } = useOrgPosts();
  const personal = announcementStore.useRecords();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<OrgPost | "new" | null>(null);
  const [deleting, setDeleting] = useState<OrgPost | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const posts = (feed?.posts ?? []).filter(post => matchesText([post.title, post.body, post.authorName], search) && (!filter || postState(post).key === filter));
  async function importPersonal() {
    setImporting(true);
    try {
      for (const item of personal.records) await send("/api/org/posts", { method: "POST", body: JSON.stringify({ title: item.title, body: item.body, status: item.status, publishAt: item.publishAt ? new Date(item.publishAt).toISOString() : "", expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : "" }) });
      announcementStore.replaceAll([], "Avisos movidos para o mural da organização");
      await reload();
    } catch (cause) { notifyError("Importação interrompida", cause instanceof Error ? cause.message : ""); }
    finally { setImporting(false); }
  }
  return <CatalogLayout section="Comunicação" title="Mural" description={`Avisos da organização${feed ? ` ${feed.organization.name}` : ""}, com publicação programada, prazo e discussão.`} action={feed?.canWrite && <Button onClick={() => setEditing("new")}><Plus />Novo aviso</Button>}>
    {feed?.canWrite && personal.records.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border border-primary/40 bg-primary/5 p-4 text-sm"><p>Você tem {personal.records.length} aviso(s) do mural antigo, que só você via.</p><Button size="sm" disabled={importing} onClick={() => void importPersonal()}>{importing ? "Movendo…" : "Mover para o mural da organização"}</Button></div>}
    {!noOrganization && <div className="flex flex-wrap items-end gap-4"><div className="min-w-60 flex-1"><CatalogSearch label="Buscar avisos" value={search} onChange={setSearch} /></div>
      {!noOrganization && <Field label="Situação" className="min-w-44"><Select value={filter} placeholder="Todos" options={[{ value: "active", label: "No mural" }, { value: "scheduled", label: "Programados" }, { value: "draft", label: "Rascunhos" }, { value: "expired", label: "Encerrados" }]} onChange={event => setFilter(event.target.value)} /></Field>}</div>}
    {noOrganization ? <NoOrganization feature="O mural" /> : error && !feed ? <p role="alert" className="text-sm text-destructive">{error}</p> : !feed ? <LoadingBlock label="Carregando mural" /> : <ul className="space-y-4">{posts.map(post => {
      const state = postState(post); const mine = post.authorId === feed.me || feed.admin; const expanded = open.includes(post.id);
      return <li key={post.id} className="space-y-3 border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-lg font-semibold">{post.title}</h2><p className="text-xs text-muted-foreground">{post.authorName} · {when(post.publishAt ?? post.createdAt)}{post.expiresAt && ` · até ${when(post.expiresAt)}`}</p></div>
          <div className="flex items-center gap-1"><Badge color={state.key === "active" ? "#16a34a" : undefined}>{state.label}</Badge>{mine && feed.canWrite && <><Button variant="ghost" size="icon-sm" aria-label={`Editar ${post.title}`} onClick={() => setEditing(post)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Excluir ${post.title}`} onClick={() => setDeleting(post)}><Trash2 /></Button></>}</div></div>
        {post.body && <p className="whitespace-pre-wrap break-words text-sm">{post.body}</p>}
        <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setOpen(previous => expanded ? previous.filter(id => id !== post.id) : [...previous, post.id])}><RiChat3Line />{post.comments ? `${post.comments} comentário(s)` : "Comentar"}</Button>
        {expanded && <Discussion post={post} onChange={() => void reload()} />}
      </li>;
    })}{!posts.length && <li className="text-sm text-muted-foreground">{search || filter ? "Nenhum aviso encontrado." : "Nenhum aviso no mural."}</li>}</ul>}
    {editing && <PostDialog post={editing} onClose={() => setEditing(null)} onSaved={() => void reload()} />}
    {deleting && <ConfirmDialog title="Excluir aviso?" description={`${deleting.title} e a discussão dele serão removidos para todos.`} onConfirm={async () => { await send(`/api/org/posts/${deleting.id}`, { method: "DELETE" }); await reload(); }} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
