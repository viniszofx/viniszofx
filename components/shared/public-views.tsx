"use client";
import { useEffect, useRef, useState } from "react";
import { RiCheckboxLine, RiFlag2Line, RiTimeLine } from "@remixicon/react";
import { labelColor } from "@/components/boards/card-extras";

type PublicCard = { id: string; title: string; description: string; completed: boolean; color: string; labels: { id: string; name: string; color: string }[]; due: string; priority: string; checklist: { done: number; total: number } | null };
type PublicBoard = { title: string; description: string; color: string; lists: { id: string; title: string; color: string; cards: PublicCard[] }[] };

function usePublic<T>(url: string) {
  const [state, setState] = useState<{ data?: T; error?: boolean }>({});
  useEffect(() => {
    let alive = true;
    fetch(url, { cache: "no-store" }).then(response => response.ok ? response.json() : Promise.reject()).then(data => { if (alive) setState({ data }); }).catch(() => { if (alive) setState({ error: true }); });
    return () => { alive = false; };
  }, [url]);
  return state;
}

/** Quadro aberto por link público: somente leitura, sem anexos nem comentários. */
export function PublicBoardPage({ token }: { token: string }) {
  const { data, error } = usePublic<PublicBoard>(`/api/shared/boards/${token}`);
  if (error) return <main className="p-8 text-sm">Este link não existe mais ou foi removido.</main>;
  if (!data) return <main className="p-8 text-sm" role="status">Carregando quadro…</main>;
  return <main className="flex min-h-svh flex-col gap-6 px-4 py-6 sm:px-6" style={data.color ? { backgroundColor: `color-mix(in srgb, ${data.color} 20%, var(--background))` } : undefined}>
    <header><p className="text-xs text-muted-foreground">Quadro compartilhado · somente leitura</p><h1 className="mt-1 text-3xl font-semibold">{data.title}</h1>{data.description && <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">{data.description}</p>}</header>
    <div className="flex min-w-0 items-start gap-4 overflow-x-auto pb-4">{data.lists.map(list => <section key={list.id} aria-label={`Lista ${list.title}`} className="w-72 shrink-0 border bg-card p-3" style={list.color ? { borderTop: `3px solid ${list.color}` } : undefined}>
      <h2 className="mb-3 text-sm font-semibold">{list.title} <span className="text-xs text-muted-foreground">{list.cards.length}</span></h2>
      <div className="flex flex-col gap-3">{list.cards.map(card => <article key={card.id} className="border bg-background p-3" style={card.color ? { borderLeft: `4px solid ${card.color}` } : undefined}>
        <p className={`break-words text-sm font-medium ${card.completed ? "text-muted-foreground line-through" : ""}`}>{card.title}</p>
        {!!card.labels.length && <div className="mt-2 flex flex-wrap gap-1">{card.labels.map(label => <span key={label.id} className="px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ background: labelColor(label.color) }}>{label.name}</span>)}</div>}
        {card.description && <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">{card.description}</p>}
        {(card.due || card.priority || card.checklist) && <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">{card.priority === "high" && <span className="inline-flex items-center gap-1 text-destructive"><RiFlag2Line className="size-3" />Alta</span>}{card.due && <span className="inline-flex items-center gap-1"><RiTimeLine className="size-3" />{new Date(`${card.due}T12:00:00`).toLocaleDateString("pt-BR")}</span>}{card.checklist && <span className="inline-flex items-center gap-1"><RiCheckboxLine className="size-3" />{card.checklist.done}/{card.checklist.total}</span>}</div>}
      </article>)}</div>
    </section>)}</div>
  </main>;
}

const editorUrl = process.env.NEXT_PUBLIC_DRAWIO_URL || "https://embed.diagrams.net";

/** Diagrama aberto por link público, no visualizador do draw.io (sem edição). */
export function PublicDiagramPage({ token }: { token: string }) {
  const { data, error } = usePublic<{ title: string; xml: string }>(`/api/shared/diagrams/${token}`);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!data) return;
    const origin = new URL(editorUrl).origin;
    function receive(event: MessageEvent) {
      if (event.origin !== origin || event.source !== frame.current?.contentWindow || typeof event.data !== "string") return;
      try { if (JSON.parse(event.data).event === "init") frame.current?.contentWindow?.postMessage(JSON.stringify({ action: "load", xml: data!.xml }), origin); } catch { /* mensagem de outro tipo */ }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [data]);
  if (error) return <main className="p-8 text-sm">Este link não existe mais ou foi removido.</main>;
  if (!data) return <main className="p-8 text-sm" role="status">Carregando diagrama…</main>;
  return <main className="flex h-svh flex-col">
    <header className="border-b px-4 py-2"><p className="text-xs text-muted-foreground">Diagrama compartilhado · somente leitura</p><h1 className="font-semibold">{data.title}</h1></header>
    <iframe ref={frame} title={data.title} className="min-h-0 w-full flex-1 border-0" src={`${editorUrl}/?${new URLSearchParams({ embed: "1", proto: "json", chrome: "0", spin: "1", lang: "pt", ui: "min" })}`} />
  </main>;
}
