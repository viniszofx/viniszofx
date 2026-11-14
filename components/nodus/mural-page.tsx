"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { RiAddLine as Plus, RiBarChartHorizontalLine, RiChat3Line, RiCloseLine, RiDeleteBinLine as Trash2, RiImageAddLine, RiLoader4Line, RiPencilLine as Pencil, RiSendPlaneLine } from "@remixicon/react";
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

export type PostPoll = { question: string; options: { id: string; label: string }[]; multiple: boolean; closesAt: string | null; voters: number; counts: Record<string, number>; mine: string[] };
export type OrgPost = { id: string; title: string; body: string; status: "draft" | "published"; publishAt: string | null; expiresAt: string | null; authorId: string; authorName: string; createdAt: string; updatedAt: string; comments: number; coverFileId: string | null; cover: string | null; poll: PostPoll | null };
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

const optionId = () => Math.random().toString(36).slice(2, 10);
type PollDraft = { question: string; options: { id: string; label: string }[]; multiple: boolean; closesAt: string };

function PostDialog({ post, onClose, onSaved }: { post: OrgPost | "new"; onClose: () => void; onSaved: () => void }) {
  const [value, setValue] = useState(() => post === "new" ? { title: "", body: "", status: "published", publishAt: "", expiresAt: "" } : { title: post.title, body: post.body, status: post.status, publishAt: local(post.publishAt), expiresAt: local(post.expiresAt) });
  const [cover, setCover] = useState<{ fileId: string; preview: string } | null>(() => post !== "new" && post.coverFileId && post.cover ? { fileId: post.coverFileId, preview: post.cover } : null);
  const [uploading, setUploading] = useState(false);
  const [poll, setPoll] = useState<PollDraft | null>(() => post !== "new" && post.poll ? { question: post.poll.question, options: post.poll.options, multiple: post.poll.multiple, closesAt: local(post.poll.closesAt) } : null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function pickCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/org/posts/cover", { method: "POST", body: form });
      if (!response.ok) throw new Error(await response.text() || "Não foi possível enviar a capa.");
      const { fileId } = await response.json() as { fileId: string };
      setCover({ fileId, preview: URL.createObjectURL(file) });
    } catch (cause) { notifyError("Capa não enviada", cause instanceof Error ? cause.message : ""); }
    finally { setUploading(false); }
  }
  const pollReady = !poll || (poll.question.trim() && poll.options.filter(option => option.label.trim()).length >= 2);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const pollBody = poll ? { question: poll.question, options: poll.options.filter(option => option.label.trim()), multiple: poll.multiple, closesAt: poll.closesAt ? new Date(poll.closesAt).toISOString() : "" } : null;
      const body = JSON.stringify({ ...value, publishAt: value.publishAt ? new Date(value.publishAt).toISOString() : "", expiresAt: value.expiresAt ? new Date(value.expiresAt).toISOString() : "", coverFileId: cover?.fileId ?? null, poll: pollBody });
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
      <Field label="Mensagem" className="sm:col-span-2"><Textarea rows={6} maxLength={20000} value={value.body} onChange={event => setValue({ ...value, body: event.target.value })} /></Field>
      <div className="space-y-2 sm:col-span-2">
        <p className="text-sm font-medium">Capa</p>
        <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={event => void pickCover(event)} />
        {cover ? <div className="relative overflow-hidden border"><img src={cover.preview} alt="" className="aspect-[3/1] w-full object-cover" /><div className="absolute right-2 top-2 flex gap-1"><Button type="button" size="sm" variant="secondary" onClick={() => coverInput.current?.click()}>Trocar</Button><Button type="button" size="icon-sm" variant="secondary" aria-label="Remover capa" onClick={() => setCover(null)}><RiCloseLine /></Button></div></div>
          : <button type="button" disabled={uploading} onClick={() => coverInput.current?.click()} className="flex h-24 w-full items-center justify-center gap-2 border border-dashed text-sm text-muted-foreground hover:bg-muted/40 disabled:opacity-60">{uploading ? <><RiLoader4Line className="size-4 animate-spin" />Enviando…</> : <><RiImageAddLine className="size-4" />Adicionar imagem de capa</>}</button>}
      </div>
      <div className="space-y-3 sm:col-span-2">
        {!poll ? <Button type="button" variant="outline" size="sm" onClick={() => setPoll({ question: "", options: [{ id: optionId(), label: "" }, { id: optionId(), label: "" }], multiple: false, closesAt: "" })}><RiBarChartHorizontalLine />Adicionar enquete</Button>
          : <div className="space-y-3 border p-3">
            <div className="flex items-center justify-between"><p className="text-sm font-medium">Enquete</p><Button type="button" variant="ghost" size="sm" onClick={() => setPoll(null)}>Remover enquete</Button></div>
            <Input aria-label="Pergunta" placeholder="Pergunta" maxLength={300} value={poll.question} onChange={event => setPoll({ ...poll, question: event.target.value })} />
            {poll.options.map((option, index) => <div key={option.id} className="flex gap-2"><Input aria-label={`Opção ${index + 1}`} placeholder={`Opção ${index + 1}`} maxLength={120} value={option.label} onChange={event => setPoll({ ...poll, options: poll.options.map(item => item.id === option.id ? { ...item, label: event.target.value } : item) })} />{poll.options.length > 2 && <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover opção ${index + 1}`} onClick={() => setPoll({ ...poll, options: poll.options.filter(item => item.id !== option.id) })}><RiCloseLine /></Button>}</div>)}
            {poll.options.length < 10 && <Button type="button" variant="ghost" size="sm" onClick={() => setPoll({ ...poll, options: [...poll.options, { id: optionId(), label: "" }] })}><Plus />Opção</Button>}
            <div className="grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={poll.multiple} onChange={event => setPoll({ ...poll, multiple: event.target.checked })} className="accent-primary" />Permitir várias respostas</label>
              <Field label="Encerrar votação em"><Input type="datetime-local" value={poll.closesAt} onChange={event => setPoll({ ...poll, closesAt: event.target.value })} /></Field></div>
            {post !== "new" && post.poll && post.poll.voters > 0 && <p className="text-xs text-muted-foreground">Remover uma opção apaga os votos dela.</p>}
          </div>}
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy || uploading || !value.title.trim() || !pollReady}>Salvar aviso</Button></div>
    </form>
  </DialogContent></Dialog>;
}

/** Votação: escolhe e envia; depois de votar (ou encerrada) mostra o resultado. */
function Poll({ post, canVote, onChange }: { post: OrgPost & { poll: PostPoll }; canVote: boolean; onChange: () => void }) {
  const { poll } = post;
  const [choice, setChoice] = useState<string[]>(poll.mine);
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState(false);
  const closed = !!poll.closesAt && new Date(poll.closesAt) <= new Date();
  const voted = poll.mine.length > 0;
  const results = closed || !canVote || (voted && !changing);
  const total = Object.values(poll.counts).reduce((sum, count) => sum + count, 0);
  async function vote(options: string[]) {
    setBusy(true);
    try { await send(`/api/org/posts/${post.id}/vote`, { method: "PUT", body: JSON.stringify({ options }) }); setChanging(false); onChange(); }
    catch (cause) { notifyError("Voto não registrado", cause instanceof Error ? cause.message : ""); }
    finally { setBusy(false); }
  }
  return <fieldset className="space-y-2 border p-3">
    <legend className="px-1 text-sm font-semibold">{poll.question}</legend>
    {results ? <ul className="space-y-1.5">{poll.options.map(option => {
      const count = poll.counts[option.id] ?? 0; const percent = total ? Math.round(count / total * 100) : 0; const picked = poll.mine.includes(option.id);
      return <li key={option.id} className="relative overflow-hidden border px-3 py-1.5 text-sm"><span className="absolute inset-y-0 left-0 bg-primary/15 transition-[width]" style={{ width: `${percent}%` }} aria-hidden="true" /><span className="relative flex justify-between gap-3"><span className={picked ? "font-semibold" : undefined}>{option.label}{picked && " ✓"}</span><span className="tabular-nums text-muted-foreground">{percent}% · {count}</span></span></li>;
    })}</ul>
      : <div className="space-y-1.5">{poll.options.map(option => <label key={option.id} className="flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:bg-muted/40"><input type={poll.multiple ? "checkbox" : "radio"} name={`poll-${post.id}`} checked={choice.includes(option.id)} onChange={event => setChoice(poll.multiple ? (event.target.checked ? [...choice, option.id] : choice.filter(id => id !== option.id)) : [option.id])} className="accent-primary" />{option.label}</label>)}</div>}
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span>{poll.voters} {poll.voters === 1 ? "pessoa votou" : "pessoas votaram"}{poll.multiple && " · várias respostas"}{closed ? " · encerrada" : poll.closesAt ? ` · até ${when(poll.closesAt)}` : ""}</span>
      {canVote && !closed && (results ? <span className="flex gap-1"><Button type="button" size="sm" variant="ghost" onClick={() => { setChoice(poll.mine); setChanging(true); }}>Mudar voto</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void vote([])}>Retirar voto</Button></span>
        : <span className="flex gap-1">{voted && <Button type="button" size="sm" variant="ghost" onClick={() => setChanging(false)}>Cancelar</Button>}<Button type="button" size="sm" disabled={busy || !choice.length} onClick={() => void vote(choice)}>Votar</Button></span>)}
    </div>
  </fieldset>;
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
      return <li key={post.id} className={cn(surfaceVariants(), "space-y-3 overflow-hidden p-5")}>
        {post.cover && <img src={post.cover} alt="" loading="lazy" className="-mx-5 -mt-5 mb-1 aspect-[3/1] w-[calc(100%+2.5rem)] max-w-none object-cover" />}
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-lg font-semibold">{post.title}</h2><p className="text-xs text-muted-foreground">{post.authorName} · {when(post.publishAt ?? post.createdAt)}{post.expiresAt && ` · até ${when(post.expiresAt)}`}</p></div>
          <div className="flex items-center gap-1"><Badge color={state.key === "active" ? "#16a34a" : undefined}>{state.label}</Badge>{mine && feed.canWrite && <><Button variant="ghost" size="icon-sm" aria-label={`Editar ${post.title}`} onClick={() => setEditing(post)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Excluir ${post.title}`} onClick={() => setDeleting(post)}><Trash2 /></Button></>}</div></div>
        {post.body && <p className="whitespace-pre-wrap break-words text-sm">{post.body}</p>}
        {post.poll && <Poll post={{ ...post, poll: post.poll }} canVote={state.key === "active" && feed.canWrite} onChange={() => void reload()} />}
        <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setOpen(previous => expanded ? previous.filter(id => id !== post.id) : [...previous, post.id])}><RiChat3Line />{post.comments ? `${post.comments} comentário(s)` : "Comentar"}</Button>
        {expanded && <Discussion post={post} onChange={() => void reload()} />}
      </li>;
    })}{!posts.length && <li className="text-sm text-muted-foreground">{search || filter ? "Nenhum aviso encontrado." : "Nenhum aviso no mural."}</li>}</ul>}
    {editing && <PostDialog post={editing} onClose={() => setEditing(null)} onSaved={() => void reload()} />}
    {deleting && <ConfirmDialog title="Excluir aviso?" description={`${deleting.title} e a discussão dele serão removidos para todos.`} onConfirm={async () => { await send(`/api/org/posts/${deleting.id}`, { method: "DELETE" }); await reload(); }} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
