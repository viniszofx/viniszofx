import { useState } from "react";
import { RiCheckLine, RiDeleteBinLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

export type ThreadReply = { id: string; text: string; authorName?: string; createdAt?: string; pending?: boolean; canDelete: boolean };
export type Thread = {
  id: string;
  page: number;
  quote?: string;
  text: string;
  authorName?: string;
  createdAt?: string;
  replies: ThreadReply[];
  pending?: boolean;
  canReply: boolean;
  canResolve: boolean;
  canDelete: boolean;
};

const relative = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
function since(value?: string) {
  if (!value) return "";
  const seconds = (new Date(value).getTime() - Date.now()) / 1000;
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, "second"], [60, "minute"], [24, "hour"], [7, "day"], [4.35, "week"], [12, "month"]];
  let amount = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(amount) < size) return unit === "second" ? "agora" : relative.format(Math.round(amount), unit);
    amount /= size;
  }
  return relative.format(Math.round(amount), "year");
}

function Avatar({ name }: { name?: string }) {
  const initials = (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
  return <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{initials}</span>;
}

function Byline({ name, createdAt, note }: { name?: string; createdAt?: string; note?: string }) {
  return <div className="min-w-0 flex-1 leading-tight"><p className="truncate text-sm font-medium">{name || "Autor não informado"}</p><p className="text-xs text-muted-foreground">{note ?? since(createdAt)}</p></div>;
}

// Painel de comentários no estilo do Google Docs: um cartão por conversa, com respostas, Resolver (dono) e Excluir.
// Tudo fica gravado no próprio PDF, no formato padrão de anotações, e aparece em qualquer leitor.
export function PdfCommentsPanel({ threads, activeId, draft, busy, emptyHint, onFocus, onResolve, onDelete, onReply, onDraftChange, onDraftSubmit, onDraftCancel }: {
  threads: Thread[];
  activeId: string | null;
  draft: { page: number; quote?: string; text: string } | null;
  busy: boolean;
  emptyHint: string;
  onFocus: (id: string) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onReply: (id: string, text: string) => Promise<void>;
  onDraftChange: (text: string) => void;
  onDraftSubmit: () => void;
  onDraftCancel: () => void;
}) {
  const [replies, setReplies] = useState<Record<string, string>>({});
  async function sendReply(id: string) {
    const text = replies[id]?.trim();
    if (!text) return;
    await onReply(id, text);
    setReplies((current) => ({ ...current, [id]: "" }));
  }
  return (
    <div className="grid min-w-0 grid-cols-1 gap-2 p-3">
      {draft && (
        <section aria-label="Novo comentário" className="grid min-w-0 gap-2 rounded-lg border border-primary bg-card p-3 shadow-md">
          <p className="text-xs text-muted-foreground">Página {draft.page}</p>
          {draft.quote && <p className="line-clamp-3 border-l-2 border-amber-400 pl-2 text-xs text-muted-foreground">{draft.quote}</p>}
          <textarea autoFocus aria-label="Texto do comentário" value={draft.text} placeholder="Comente ou marque alguém"
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onDraftCancel();
              else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) onDraftSubmit();
            }}
            className="min-h-20 w-full resize-y rounded-md border bg-background p-2 text-base sm:text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="flex justify-end gap-1">
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onDraftCancel}>Cancelar</Button>
            <Button type="button" size="sm" disabled={busy || !draft.text.trim()} onClick={onDraftSubmit}>{busy ? "Enviando…" : "Comentar"}</Button>
          </div>
        </section>
      )}
      {!threads.length && !draft && <p className="text-sm text-muted-foreground">{emptyHint}</p>}
      {threads.map((thread) => {
        const active = activeId === thread.id;
        return (
          <article key={thread.id} id={`comment-${thread.id}`} onClick={() => onFocus(thread.id)}
            className={`grid min-w-0 cursor-pointer gap-2 rounded-lg border bg-card p-3 text-sm transition-shadow ${active ? "border-primary shadow-md" : "hover:shadow-sm"}`}>
            <div className="flex items-start gap-2">
              <Avatar name={thread.authorName} />
              <Byline name={thread.authorName} createdAt={thread.createdAt} note={thread.pending ? "Não salvo" : thread.createdAt ? undefined : `Página ${thread.page}`} />
              {thread.canResolve && <Button type="button" variant="ghost" size="icon-sm" aria-label="Resolver" title="Resolver: a conversa some para todos" disabled={busy} onClick={(event) => { event.stopPropagation(); onResolve(thread.id); }}><RiCheckLine className="text-primary" /></Button>}
              {thread.canDelete && <Button type="button" variant="ghost" size="icon-sm" aria-label="Excluir comentário" title="Excluir comentário" disabled={busy} onClick={(event) => { event.stopPropagation(); onDelete(thread.id); }}><RiDeleteBinLine /></Button>}
            </div>
            {thread.quote && <p className="line-clamp-3 border-l-2 border-amber-400 pl-2 text-xs text-muted-foreground">{thread.quote}</p>}
            <p className="wrap-break-word whitespace-pre-wrap">{thread.text}</p>
            {thread.replies.map((reply) => (
              <div key={reply.id} className="grid gap-1 border-t pt-2">
                <div className="flex items-start gap-2">
                  <Avatar name={reply.authorName} />
                  <Byline name={reply.authorName} createdAt={reply.createdAt} note={reply.pending ? "Não salvo" : undefined} />
                  {reply.canDelete && <Button type="button" variant="ghost" size="icon-sm" aria-label="Excluir resposta" title="Excluir resposta" disabled={busy} onClick={(event) => { event.stopPropagation(); onDelete(reply.id); }}><RiDeleteBinLine /></Button>}
                </div>
                <p className="wrap-break-word whitespace-pre-wrap">{reply.text}</p>
              </div>
            ))}
            {thread.canReply && active && (
              <div className="flex min-w-0 gap-1 border-t pt-2" onClick={(event) => event.stopPropagation()}>
                <input aria-label="Responder" placeholder="Responder" value={replies[thread.id] ?? ""} disabled={busy}
                  onChange={(event) => setReplies((current) => ({ ...current, [thread.id]: event.target.value }))}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void sendReply(thread.id); } }}
                  className="h-8 w-0 min-w-0 flex-1 rounded-full border bg-background px-3 text-base sm:text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                <Button type="button" size="sm" disabled={busy || !replies[thread.id]?.trim()} onClick={() => void sendReply(thread.id)}>Enviar</Button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
