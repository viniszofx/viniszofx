"use client";
import { useEffect, useState, type ReactNode } from "react";
import { RiCheckLine, RiFileLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { matchesText } from "@/lib/records/store";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";
import { cn } from "@/lib/utils";
import { chatThemes, sentBubble, themeBackground, type ChatTheme } from "./chat-theme";

export type Attachment = { fileId: string; name: string; type: string; size: number };
export type Contact = { id: string; name: string; email: string; avatar: string | null };
export type Message = {
  id: string; body: string; createdAt: string; mine: boolean; readAt: string | null; editedAt: string | null; deleted: boolean;
  forwarded: boolean; forwardedFrom: string | null; expiresAt: string | null; protected: boolean;
  attachments: Attachment[]; contact: Contact | null; reactions: { emoji: string; count: number; mine: boolean }[];
  replyTo: { id: string; mine: boolean; body: string } | null;
  /** Só no aparelho: envio em andamento ou que falhou. */
  local?: "sending" | "failed"; payload?: Record<string, unknown>;
};
export type Person = { id: string; name: string; email: string; role: string; avatar: string | null; unread: number; archived: boolean; muted: boolean; blocked: boolean; lastSeen: string | null; last: { body: string; createdAt: string; mine: boolean } | null };

export const isImage = (type: string) => /^image\/(png|jpe?g|gif|webp|avif)$/.test(type);
export const fileUrl = (messageId: string, fileId: string) => `/api/org/messages/attachments/${messageId}/${fileId}`;
export const bytes = (size: number) => size > 1048576 ? `${(size / 1048576).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "?";
const online = (lastSeen: string | null) => !!lastSeen && Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;

/** "online", "visto hoje às 14:20" ou "visto em 12/11 às 09:05"; vazio quando a pessoa escondeu. */
export function seenLabel(lastSeen: string | null) {
  if (!lastSeen) return "";
  if (online(lastSeen)) return "online";
  const date = new Date(lastSeen);
  const today = new Date().toDateString() === date.toDateString();
  return today ? `visto hoje às ${date.toLocaleTimeString("pt-BR", { timeStyle: "short" })}` : `visto em ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às ${date.toLocaleTimeString("pt-BR", { timeStyle: "short" })}`;
}

/** Foto de perfil com as iniciais quando a pessoa não tem foto; ponto verde quando está online. */
export function Face({ person, className, presence }: { person: { name: string; avatar?: string | null; lastSeen?: string | null }; className: string; presence?: boolean }) {
  const face = person.avatar ? <img src={person.avatar} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
    : <span className={`${className} grid shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary`}>{initials(person.name)}</span>;
  if (!presence || !online(person.lastSeen ?? null)) return face;
  return <span className="relative shrink-0">{face}<span aria-label="Online" className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" /></span>;
}

function Sheet({ title, description, children, onClose, wide }: { title: string; description: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return <Dialog open onOpenChange={value => { if (!value) onClose(); }}><DialogContent className={wide ? "sm:max-w-2xl" : "sm:max-w-md"}>
    <DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription>{children}
  </DialogContent></Dialog>;
}

export function PeoplePicker({ title, description, people, onPick, onClose }: { title: string; description: string; people: Person[]; onPick: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const visible = people.filter(item => matchesText([item.name, item.email], query));
  return <Sheet title={title} description={description} onClose={onClose}>
    <Input autoFocus aria-label="Buscar pessoa" placeholder="Buscar pessoa" value={query} onChange={event => setQuery(event.target.value)} />
    <ul className="max-h-80 divide-y overflow-y-auto border">{visible.map(item => <li key={item.id}><button type="button" onClick={() => onPick(item.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50"><Face person={item} className="size-8" presence /><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.name}</span><span className="block truncate text-xs text-muted-foreground">{item.email}</span></span></button></li>)}
      {!visible.length && <li className="p-3 text-sm text-muted-foreground">Ninguém encontrado.</li>}</ul>
  </Sheet>;
}

type Profile = { id: string; name: string; email: string; role: string; username: string; bio: string; avatar: string | null; lastSeen: string | null };

/** Perfil da pessoa, aberto pela conversa ou por um cartão de contato. */
export function ProfileDialog({ userId, onClose, onMessage, onShared }: { userId: string; onClose: () => void; onMessage?: () => void; onShared?: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    fetch(`/api/org/messages/people/${encodeURIComponent(userId)}`, { cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error((await response.text()) || "Não foi possível abrir o perfil."); return response.json(); })
      .then(data => { if (alive) setProfile(data); }).catch(cause => { if (alive) setError(cause instanceof Error ? cause.message : "Não foi possível abrir o perfil."); });
    return () => { alive = false; };
  }, [userId]);
  return <Sheet title="Perfil" description="Pessoa da sua organização." onClose={onClose}>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !profile ? <div className="flex flex-col items-center gap-3 py-2"><Skeleton className="size-24 rounded-full" /><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-52" /></div> :
      <div className="flex flex-col items-center gap-1 text-center">
        <Face person={profile} className="size-24 text-2xl" />
        <p className="mt-2 text-lg font-semibold">{profile.name}</p>
        {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
        {seenLabel(profile.lastSeen) && <p className="text-xs text-muted-foreground">{seenLabel(profile.lastSeen)}</p>}
        {profile.bio && <p className="mt-2 max-w-sm text-sm whitespace-pre-wrap">{profile.bio}</p>}
        <dl className="mt-3 grid w-full gap-1 border-t pt-3 text-left text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">E-mail</dt><dd className="truncate">{profile.email}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Acesso</dt><dd>{profile.role === "external" ? "Externo (somente leitura)" : "Membro"}</dd></div>
        </dl>
        {(onMessage || onShared) && <div className="mt-3 flex w-full flex-wrap justify-end gap-2">{onShared && <Button variant="outline" onClick={onShared}>Mídia e arquivos</Button>}{onMessage && <Button onClick={onMessage}>Enviar mensagem</Button>}</div>}
      </div>}
  </Sheet>;
}

/** Fotos e arquivos trocados na conversa. */
export function SharedDialog({ peerId, name, onClose, onPhoto }: { peerId: string; name: string; onClose: () => void; onPhoto: (photo: { src: string; name: string; protected: boolean }) => void }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"media" | "files">("media");
  useEffect(() => {
    let alive = true;
    fetch(`/api/org/messages?with=${encodeURIComponent(peerId)}&shared=1`, { cache: "no-store" })
      .then(async response => { if (!response.ok) throw new Error("Não foi possível carregar a mídia da conversa."); return response.json(); })
      .then(data => { if (alive) setMessages(data.messages); }).catch(cause => { if (alive) setError(cause instanceof Error ? cause.message : ""); });
    return () => { alive = false; };
  }, [peerId]);
  const items = (messages ?? []).flatMap(message => message.attachments.map(item => ({ ...item, message })));
  const media = items.filter(item => isImage(item.type));
  const files = items.filter(item => !isImage(item.type));
  return <Sheet wide title="Mídia e arquivos" description={`Tudo o que foi trocado com ${name}.`} onClose={onClose}>
    <div className="flex gap-1 text-xs" role="tablist">{([["media", `Fotos (${media.length})`], ["files", `Arquivos (${files.length})`]] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={cn("rounded-full px-3 py-1", tab === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{label}</button>)}</div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !messages ? <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="aspect-square" />)}</div>
      : tab === "media" ? (media.length ? <ul className="grid max-h-[60dvh] grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-4">{media.map(item => <li key={`${item.message.id}-${item.fileId}`}><button type="button" aria-label={`Ver ${item.name}`} onClick={() => onPhoto({ src: fileUrl(item.message.id, item.fileId), name: item.name, protected: item.message.protected })} className="block aspect-square w-full overflow-hidden bg-muted"><img src={fileUrl(item.message.id, item.fileId)} alt={item.name} loading="lazy" className="size-full object-cover" /></button></li>)}</ul> : <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma foto nesta conversa.</p>)
      : files.length ? <ul className="max-h-[60dvh] divide-y overflow-y-auto border">{files.map(item => <li key={`${item.message.id}-${item.fileId}`}>
        {item.message.protected ? <p className="flex items-center gap-3 px-3 py-2.5 text-sm"><RiFileLine className="size-5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block truncate">{item.name}</span><span className="text-xs text-muted-foreground">Protegido por quem enviou</span></span></p>
          : <a href={fileUrl(item.message.id, item.fileId)} download={item.name} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50"><RiFileLine className="size-5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block truncate">{item.name}</span><span className="text-xs text-muted-foreground">{bytes(item.size)} · {new Date(item.message.createdAt).toLocaleDateString("pt-BR")}</span></span></a>}
      </li>)}</ul> : <p className="py-8 text-center text-sm text-muted-foreground">Nenhum arquivo nesta conversa.</p>}
  </Sheet>;
}

const reasons = [["assedio", "Assédio"], ["ofensa", "Ofensa ou discriminação"], ["spam", "Spam"], ["conteudo-improprio", "Conteúdo impróprio"], ["outro", "Outro motivo"]] as const;
const reasonLabel = (value: string) => reasons.find(([key]) => key === value)?.[1] ?? value;

/** Denunciar a conversa ou uma mensagem. */
export function ReportDialog({ peerId, name, message, onClose }: { peerId: string; name: string; message?: Message | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    try {
      const response = await fetch("/api/org/messages/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ with: peerId, messageId: message?.id, reason, details }) });
      if (!response.ok) throw new Error((await response.text()) || "Não foi possível enviar a denúncia.");
      notifySuccess("Denúncia enviada", "A administração vai revisar."); onClose();
    } catch (cause) { notifyError("Denúncia não enviada", cause instanceof Error ? cause.message : ""); }
    finally { setBusy(false); }
  }
  return <Sheet title={message ? "Denunciar mensagem" : `Denunciar conversa com ${name}`} description="A administração da organização recebe a denúncia. A outra pessoa não é avisada." onClose={onClose}>
    {message?.body && <blockquote className="border-l-2 border-primary bg-muted/50 px-3 py-2 text-sm line-clamp-3">{message.body}</blockquote>}
    <fieldset className="grid gap-1.5"><legend className="mb-1 text-sm font-medium">Motivo</legend>{reasons.map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="accent-primary" />{label}</label>)}</fieldset>
    <label className="grid gap-1.5 text-sm"><span className="font-medium">Detalhes <span className="font-normal text-muted-foreground">(opcional)</span></span><textarea value={details} onChange={event => setDetails(event.target.value)} maxLength={1000} rows={3} className="resize-none border bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" /></label>
    <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button variant="destructive" disabled={!reason || busy} onClick={() => void send()}>{busy ? "Enviando…" : "Denunciar"}</Button></div>
  </Sheet>;
}

type Report = { id: string; reason: string; details: string | null; messageBody: string | null; status: "open" | "reviewed" | "dismissed"; createdAt: string; reporterName: string; reportedName: string; reviewerName: string | null; reviewedAt: string | null };
const statusLabels: Record<Report["status"], string> = { open: "Aberta", reviewed: "Revisada", dismissed: "Descartada" };

/** Denúncias da organização, para a administração revisar. */
export function ReportsDialog({ onClose }: { onClose: () => void }) {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"open" | "all">("open");
  async function load() {
    try {
      const response = await fetch("/api/org/messages/reports", { cache: "no-store" });
      if (!response.ok) throw new Error((await response.text()) || "Não foi possível carregar as denúncias.");
      setReports((await response.json()).reports); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : ""); }
  }
  useEffect(() => { const first = setTimeout(() => void load(), 0); return () => clearTimeout(first); }, []);
  async function mark(id: string, status: Report["status"]) {
    const response = await fetch(`/api/org/messages/reports/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) return notifyError("Denúncia não atualizada", (await response.text()) || "");
    void load();
  }
  const visible = (reports ?? []).filter(report => filter === "all" || report.status === "open");
  return <Sheet wide title="Denúncias" description="Conversas e mensagens denunciadas na organização." onClose={onClose}>
    <div className="flex gap-1 text-xs" role="tablist">{([["open", `Abertas (${(reports ?? []).filter(item => item.status === "open").length})`], ["all", "Todas"]] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={cn("rounded-full px-3 py-1", filter === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{label}</button>)}</div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !reports ? <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      : !visible.length ? <p className="py-8 text-center text-sm text-muted-foreground">{filter === "open" ? "Nenhuma denúncia aberta." : "Nenhuma denúncia."}</p>
      : <ul className="max-h-[60dvh] space-y-2 overflow-y-auto">{visible.map(report => <li key={report.id} className="space-y-1.5 border p-3 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-semibold">{reasonLabel(report.reason)}</p><span className="text-xs text-muted-foreground">{statusLabels[report.status]} · {new Date(report.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span></div>
        <p className="text-muted-foreground"><strong className="font-medium text-foreground">{report.reporterName}</strong> denunciou <strong className="font-medium text-foreground">{report.reportedName}</strong></p>
        {report.messageBody && <blockquote className="border-l-2 border-primary bg-muted/50 px-3 py-1.5 whitespace-pre-wrap">{report.messageBody}</blockquote>}
        {report.details && <p className="whitespace-pre-wrap">{report.details}</p>}
        {report.reviewerName && <p className="text-xs text-muted-foreground">{statusLabels[report.status]} por {report.reviewerName}</p>}
        <div className="flex flex-wrap justify-end gap-2 pt-1">{report.status === "open" ? <><Button size="sm" variant="outline" onClick={() => void mark(report.id, "dismissed")}>Descartar</Button><Button size="sm" onClick={() => void mark(report.id, "reviewed")}>Marcar como revisada</Button></> : <Button size="sm" variant="outline" onClick={() => void mark(report.id, "open")}>Reabrir</Button>}</div>
      </li>)}</ul>}
  </Sheet>;
}

export const autoDeleteChoices: [number | null, string][] = [[null, "Desligada"], [86400, "1 dia"], [604800, "1 semana"], [2592000, "1 mês"]];
export const autoDeleteLabel = (seconds: number | null) => autoDeleteChoices.find(([value]) => value === seconds)?.[1] ?? "Desligada";

/** Autoexclusão: vale para as duas pessoas e para as mensagens enviadas depois de ligar. */
export function AutoDeleteDialog({ current, onPick, onClose }: { current: number | null; onPick: (seconds: number | null) => void; onClose: () => void }) {
  return <Sheet title="Autoexclusão" description="As mensagens novas somem sozinhas depois do prazo, para as duas pessoas. As que já foram enviadas não mudam." onClose={onClose}>
    <ul className="divide-y border">{autoDeleteChoices.map(([value, label]) => <li key={label}><button type="button" onClick={() => onPick(value)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-muted/50">{label}{current === value && <RiCheckLine className="size-4 text-primary" aria-label="Atual" />}</button></li>)}</ul>
  </Sheet>;
}

/** Tema da conversa (fica neste aparelho). */
export function ThemeDialog({ current, onPick, onClose }: { current: ChatTheme; onPick: (theme: ChatTheme) => void; onClose: () => void }) {
  return <Sheet title="Tema da conversa" description="Fundo e cor dos balões. Vale só neste aparelho." onClose={onClose}>
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">{chatThemes.map(theme => <li key={theme.name}><button type="button" aria-pressed={current === theme.name} onClick={() => onPick(theme.name)} className={cn("w-full overflow-hidden border text-left outline-none focus-visible:ring-2 focus-visible:ring-ring", current === theme.name && "ring-2 ring-primary")}>
      <span className="flex h-20 flex-col justify-end gap-1 bg-background p-2" style={themeBackground(theme.name)}>
        <span className="self-start rounded-xl rounded-bl-sm bg-muted px-2 py-0.5 text-[10px]">Oi!</span>
        <span className={cn("self-end rounded-xl rounded-br-sm px-2 py-0.5 text-[10px]", !theme.sent && "bg-primary text-primary-foreground")} style={sentBubble(theme.name)}>Tudo certo</span>
      </span>
      <span className="block border-t px-2 py-1.5 text-xs font-medium">{theme.label}</span>
    </button></li>)}</ul>
  </Sheet>;
}
