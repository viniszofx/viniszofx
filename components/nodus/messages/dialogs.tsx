"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";
import { cn } from "@/lib/utils";
import { Avatar, type ChatPerson } from "./people";

export type Attachment = { fileId: string; name: string; type: string; size: number };
export type Contact = { id: string; name: string; email: string; avatar: string | null };
export type Message = {
  id: string; body: string; createdAt: string; mine: boolean; readAt: string | null; editedAt: string | null; deleted: boolean;
  forwarded: boolean; forwardedFrom: string | null; expiresAt: string | null; protected: boolean;
  attachments: Attachment[]; contact: Contact | null; reactions: { emoji: string; count: number; mine: boolean }[];
  replyTo: { id: string; mine: boolean; body: string } | null;
  /** Só no aparelho: aguardando sinal, enviando ou falhou. */
  local?: "waiting" | "sending" | "failed"; payload?: Record<string, unknown>; error?: string;
};
export type Person = ChatPerson & { email: string; role: string; unread: number; archived: boolean; muted: boolean; blocked: boolean; self: boolean; last: { body: string; createdAt: string; mine: boolean } | null };

export const isImage = (type: string) => /^image\/(png|jpe?g|gif|webp|avif)$/.test(type);
export const isPdf = (item: Attachment) => item.type === "application/pdf" || item.name.toLowerCase().endsWith(".pdf");
export const fileUrl = (messageId: string, fileId: string) => `/api/org/messages/attachments/${messageId}/${fileId}`;
export const bytes = (size: number) => size > 1048576 ? `${(size / 1048576).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;

/** Escolher pessoa (encaminhar ou compartilhar contato), no formato de lista do Nodus. */
export function PeoplePicker({ title, description, preview, people, userId, onPick, onClose }: { title: string; description: string; preview?: string; people: Person[]; userId?: string; onPick: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLocaleLowerCase("pt-BR");
  const visible = people.filter(person => (person.id === userId ? "mensagens salvas" : `${person.name} ${person.email}`.toLocaleLowerCase("pt-BR")).includes(term));
  return <Dialog open onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="sm:max-w-md">
    <DialogTitle>{title}</DialogTitle><DialogDescription className="sr-only">{description}</DialogDescription>
    {preview && <p className="glass-float line-clamp-2 rounded-lg border p-3 text-sm text-muted-foreground">{preview}</p>}
    <Input autoFocus aria-label="Buscar pessoa" placeholder="Buscar pessoa..." value={query} onChange={event => setQuery(event.target.value)} />
    <div className="max-h-72 space-y-1 overflow-y-auto">
      {visible.map(person => <Button key={person.id} type="button" variant="ghost" className="h-auto w-full justify-start gap-3 py-2 text-left normal-case tracking-normal" onClick={() => onPick(person.id)}>
        <Avatar person={person} /><span className="truncate text-sm font-medium">{person.id === userId ? "Mensagens salvas" : person.name}</span>
      </Button>)}
      {!visible.length && <p className="p-3 text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>}
    </div>
  </DialogContent></Dialog>;
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
  const preview = message ? message.body || message.attachments[0]?.name || (message.contact ? `👤 ${message.contact.name}` : "") : "";
  return <Dialog open onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="sm:max-w-md">
    <DialogTitle>{message ? "Denunciar mensagem" : `Denunciar ${name}`}</DialogTitle>
    <DialogDescription>A administração da organização recebe a denúncia. A outra pessoa não é avisada.</DialogDescription>
    {preview && <blockquote className="glass-float line-clamp-3 rounded-lg border-l-2 border-primary px-3 py-2 text-sm">{preview}</blockquote>}
    <fieldset className="grid gap-1"><legend className="mb-1 text-sm font-medium">Motivo</legend>{reasons.map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60"><input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="accent-primary" />{label}</label>)}</fieldset>
    <label className="grid gap-1.5 text-sm"><span className="font-medium">Detalhes <span className="font-normal text-muted-foreground">(opcional)</span></span><textarea value={details} onChange={event => setDetails(event.target.value)} maxLength={1000} rows={3} className="resize-none rounded-xl border bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" /></label>
    <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button variant="destructive" disabled={!reason || busy} onClick={() => void send()}>{busy ? "Enviando…" : "Denunciar"}</Button></div>
  </DialogContent></Dialog>;
}

type Report = { id: string; reason: string; details: string | null; messageBody: string | null; status: "open" | "reviewed" | "dismissed"; createdAt: string; reporterName: string; reportedName: string; reviewerName: string | null };
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
  return <Dialog open onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="sm:max-w-2xl">
    <DialogTitle>Denúncias</DialogTitle><DialogDescription>Conversas e mensagens denunciadas na organização.</DialogDescription>
    <div className="flex w-fit gap-1 rounded-full bg-foreground/6 p-1 text-xs" role="tablist">{([["open", `Abertas (${(reports ?? []).filter(item => item.status === "open").length})`], ["all", "Todas"]] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={cn("rounded-full px-3 py-1.5 font-medium", filter === value ? "bg-card shadow-sm" : "text-muted-foreground")}>{label}</button>)}</div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !reports ? <div className="space-y-2"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></div>
      : !visible.length ? <p className="py-8 text-center text-sm text-muted-foreground">{filter === "open" ? "Nenhuma denúncia aberta." : "Nenhuma denúncia."}</p>
      : <ul className="max-h-[60dvh] space-y-2 overflow-y-auto">{visible.map(report => <li key={report.id} className="glass-card space-y-1.5 rounded-xl border p-3 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-semibold">{reasonLabel(report.reason)}</p><span className="text-xs text-muted-foreground">{statusLabels[report.status]} · {new Date(report.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span></div>
        <p className="text-muted-foreground"><strong className="font-medium text-foreground">{report.reporterName}</strong> denunciou <strong className="font-medium text-foreground">{report.reportedName}</strong></p>
        {report.messageBody && <blockquote className="rounded-lg border-l-2 border-primary bg-muted/50 px-3 py-1.5 whitespace-pre-wrap">{report.messageBody}</blockquote>}
        {report.details && <p className="whitespace-pre-wrap">{report.details}</p>}
        {report.reviewerName && <p className="text-xs text-muted-foreground">{statusLabels[report.status]} por {report.reviewerName}</p>}
        <div className="flex flex-wrap justify-end gap-2 pt-1">{report.status === "open" ? <><Button size="sm" variant="outline" onClick={() => void mark(report.id, "dismissed")}>Descartar</Button><Button size="sm" onClick={() => void mark(report.id, "reviewed")}>Marcar como revisada</Button></> : <Button size="sm" variant="outline" onClick={() => void mark(report.id, "open")}>Reabrir</Button>}</div>
      </li>)}</ul>}
  </DialogContent></Dialog>;
}

export const autoDeleteOptions: [number | null, string][] = [[null, "Desligado"], [86400, "1 dia"], [604800, "1 semana"], [2592000, "1 mês"]];
export const autoDeleteLabel = (seconds: number | null) => autoDeleteOptions.find(([value]) => value === seconds)?.[1] ?? "Desligado";
