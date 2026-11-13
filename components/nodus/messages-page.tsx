"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { RiArrowLeftSLine, RiSendPlaneLine } from "@remixicon/react";
import { CatalogLayout, CatalogSearch } from "@/components/listing/catalog";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/ui/feedback";
import { Textarea } from "@/components/ui/field";
import { matchesText } from "@/lib/records/store";
import { notifyError } from "@/lib/ui/notifications";
import { NoOrganization } from "./no-organization";

type Person = { id: string; name: string; email: string; role: string; unread: number; last: { body: string; createdAt: string; mine: boolean } | null };
type Message = { id: string; body: string; createdAt: string; mine: boolean; readAt: string | null };

const time = (value: string) => {
  const date = new Date(value); const today = new Date().toDateString() === date.toDateString();
  return date.toLocaleString("pt-BR", today ? { timeStyle: "short" } : { dateStyle: "short", timeStyle: "short" });
};
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "?";

/** Mensagens diretas entre membros da organização (Nodus: Comunicação › Mensagens). Atualiza a cada poucos segundos. */
export function MessagesPage() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [selected, setSelected] = useState("");
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [threadError, setThreadError] = useState("");
  const [sending, setSending] = useState(false);
  const [noOrganization, setNoOrganization] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);
  const threadRequest = useRef(0);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  const responseError = async (response: Response) => {
    const value = await response.text();
    if (response.status === 401) return "Entre em uma organização para acessar as mensagens.";
    if (response.status === 403) return "Sua conta tem acesso somente para leitura.";
    if (response.status === 404) return "Essa pessoa não está mais disponível nesta organização.";
    return value || "Não foi possível concluir a solicitação. Tente novamente.";
  };
  const loadPeople = useCallback(async () => {
    try {
      const response = await fetch("/api/org/messages", { cache: "no-store" });
      if (response.status === 401) { setNoOrganization(true); return; }
      setNoOrganization(false);
      if (!response.ok) throw new Error(await responseError(response));
      setPeople((await response.json()).people); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar as conversas."); }
  }, []);
  const loadThread = useCallback(async (id: string) => {
    const request = ++threadRequest.current;
    try {
      const response = await fetch(`/api/org/messages?with=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      if (threadRequest.current !== request || selectedRef.current !== id) return;
      setMessages(data.messages); setThreadError("");
      void loadPeople();
    } catch (cause) {
      if (threadRequest.current !== request || selectedRef.current !== id) return;
      setThreadError(cause instanceof Error ? cause.message : "Não foi possível carregar a conversa.");
      setMessages(current => current ?? []);
    }
  }, [loadPeople]);
  useEffect(() => {
    const first = setTimeout(() => void loadPeople(), 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void loadPeople(); }, 15_000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [loadPeople]);
  useEffect(() => {
    if (!selected) return;
    const first = setTimeout(() => void loadThread(selected), 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void loadThread(selected); }, 8_000);
    return () => { clearTimeout(first); clearInterval(timer); threadRequest.current++; };
  }, [selected, loadThread]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [messages?.length]);
  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const body = text.trim(); if (!body || !selected) return;
    if (sending) return;
    setSending(true); setThreadError(""); setText("");
    try {
      const response = await fetch("/api/org/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: selected, body }) });
      if (!response.ok) throw new Error(await responseError(response));
      await Promise.all([loadThread(selected), loadPeople()]);
    } catch (cause) { setText(body); notifyError("Mensagem não enviada", cause instanceof Error ? cause.message : "Tente novamente."); }
    finally { setSending(false); }
  }
  const person = people?.find(item => item.id === selected);
  const visible = (people ?? []).filter(item => matchesText([item.name, item.email], search));
  return <CatalogLayout section="Comunicação" title="Mensagens" description="Conversas diretas com as pessoas da sua organização.">
    {noOrganization ? <NoOrganization feature="Mensagens" /> : error && !people ? <div role="alert" className="grid min-h-48 place-content-center gap-3 text-center"><p className="text-sm text-destructive">Não foi possível carregar as conversas.</p><p className="max-w-md text-sm text-muted-foreground">{error}</p><Button variant="outline" onClick={() => void loadPeople()}>Tentar novamente</Button></div> : !people ? <LoadingBlock label="Carregando conversas" /> :
    <div className="grid min-h-[60dvh] border md:grid-cols-[18rem_minmax(0,1fr)]">
      {error && <p role="status" className="col-span-full border-b bg-muted/40 px-3 py-2 text-sm text-muted-foreground">A atualização das conversas falhou. {error}</p>}
      <aside aria-label="Conversas" className={`min-w-0 border-r ${selected ? "max-md:hidden" : ""}`}>
        <div className="border-b p-3"><CatalogSearch label="Buscar pessoas" value={search} onChange={setSearch} /></div>
        <ul className="divide-y">{visible.map(item => <li key={item.id}><button type="button" aria-current={selected === item.id ? "true" : undefined} onClick={() => { setSelected(item.id); setMessages(null); setThreadError(""); }} className={`flex w-full items-center gap-3 px-3 py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-muted ${selected === item.id ? "bg-muted" : ""}`}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{initials(item.name)}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.name}</span><span className="block truncate text-xs text-muted-foreground">{item.last ? `${item.last.mine ? "Você: " : ""}${item.last.body}` : item.role === "external" ? "Externo" : "Membro"}</span></span>
          {item.unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{item.unread}</span>}
        </button></li>)}{!visible.length && <li className="p-4 text-sm text-muted-foreground">{people.length ? "Ninguém encontrado." : "Ainda não há outras pessoas na organização."}</li>}</ul>
      </aside>
      <section aria-label={person ? `Conversa com ${person.name}` : "Conversa"} className={`flex min-w-0 flex-col ${selected ? "" : "max-md:hidden"}`}>
        {!person ? <p className="m-auto p-6 text-sm text-muted-foreground">Escolha uma pessoa para conversar.</p> : <>
          <header className="flex items-center gap-2 border-b px-3 py-2"><Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Voltar às conversas" onClick={() => setSelected("")}><RiArrowLeftSLine /></Button><div className="min-w-0"><h2 className="truncate font-semibold">{person.name}</h2><p className="truncate text-xs text-muted-foreground">{person.email}</p></div></header>
          <div className="max-h-[55dvh] min-h-64 flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite">
            {messages === null ? <LoadingBlock label="Carregando conversa" /> : threadError && !messages.length ? <div role="alert" className="grid flex-1 content-center justify-items-center gap-3 text-center"><p className="text-sm text-destructive">{threadError}</p><Button variant="outline" onClick={() => void loadThread(selected)}>Tentar novamente</Button></div> : !messages.length ? <p className="text-center text-sm text-muted-foreground">Nenhuma mensagem ainda. Diga olá!</p>
              : messages.map(message => <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[80%] px-3 py-2 text-sm ${message.mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><p className={`mt-1 text-[10px] ${message.mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{time(message.createdAt)}{message.mine && (message.readAt ? " · lida" : " · enviada")}</p></div></div>)}
            <div ref={bottom} />
          </div>
          {threadError && messages?.length ? <p role="status" className="px-3 py-1 text-xs text-destructive">Falha ao atualizar. <button className="underline" onClick={() => void loadThread(selected)}>Tentar novamente</button></p> : null}
          <form onSubmit={event => void sendMessage(event)} className="flex items-end gap-2 border-t p-3"><Textarea aria-label="Mensagem" rows={2} maxLength={5000} placeholder="Escreva uma mensagem (Enter envia, Shift+Enter quebra a linha)" value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><Button type="submit" disabled={!text.trim() || sending}><RiSendPlaneLine />{sending ? "Enviando…" : "Enviar"}</Button></form>
        </>}
      </section>
    </div>}
  </CatalogLayout>;
}
