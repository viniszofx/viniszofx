"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { RiFileList3Line, RiArrowRightSLine, RiDeleteBinLine, RiDownloadLine, RiInboxLine, RiMailLine, RiPhoneLine, RiSearchLine, RiTimeLine, RiUserAddLine } from "@remixicon/react";
import { CatalogLayout } from "@/components/listing/catalog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Badge, LoadingBlock } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveClient, useClients } from "@/lib/clients/store";
import { matchesText } from "@/lib/records/store";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";
import { today } from "@/lib/format/date";

export type Lead = {
  id: string; name: string; email: string; phone: string; company: string; message: string; status: Status; source: string;
  campaign: Record<string, string>; notes: string; nextContactAt: string | null; clientId: string | null; createdAt: string; updatedAt: string;
};
type Status = "new" | "contacted" | "qualified" | "won" | "lost";
// Funil de marketing: do primeiro contato à conversão em cliente.
export const leadStages: { value: Status; label: string; color: string }[] = [
  { value: "new", label: "Novo", color: "#2563eb" },
  { value: "contacted", label: "Em contato", color: "#f97316" },
  { value: "qualified", label: "Qualificado", color: "#9333ea" },
  { value: "won", label: "Convertido", color: "#16a34a" },
  { value: "lost", label: "Perdido", color: "#6b7280" },
];
const stage = (value: Status) => leadStages.find(item => item.value === value) ?? leadStages[0];
const when = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const digits = (value: string) => value.replace(/\D/g, "");
// "há 5 min", "há 2 h", "há 3 dias"; depois de uma semana, a data curta.
const ago = (value: string) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return days < 7 ? `há ${days} ${days === 1 ? "dia" : "dias"}` : new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("") || "?";
const local = (value: string | null) => { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

async function patchLead(id: string, change: Record<string, unknown>) {
  const response = await fetch(`/api/admin/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(change) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Não foi possível salvar o lead.");
  return body as Lead;
}

function exportCsv(rows: Lead[]) {
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = ["Data", "Nome", "Empresa", "E-mail", "Telefone", "Etapa", "Mensagem", "Origem", "Campanha", "Próximo contato", "Anotações"];
  const lines = rows.map(lead => [when(lead.createdAt), lead.name, lead.company, lead.email, lead.phone, stage(lead.status).label, lead.message, lead.source, Object.entries(lead.campaign).map(([key, value]) => `${key}=${value}`).join(" "), lead.nextContactAt ? when(lead.nextContactAt) : "", lead.notes].map(cell).join(";"));
  const url = URL.createObjectURL(new Blob(["﻿" + [header.map(cell).join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" }));
  Object.assign(document.createElement("a"), { href: url, download: `leads-${today()}.csv` }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function LeadDialog({ lead, onClose, onChange }: { lead: Lead; onClose: () => void; onChange: (lead: Lead) => void }) {
  const { loaded: clientsLoaded, clients } = useClients();
  const [notes, setNotes] = useState(lead.notes);
  const [next, setNext] = useState(local(lead.nextContactAt));
  const [busy, setBusy] = useState(false);
  const client = clients.find(item => item.id === lead.clientId);
  async function save(change: Record<string, unknown>, notice?: string) {
    setBusy(true);
    try { onChange(await patchLead(lead.id, change)); if (notice) notifySuccess(notice); }
    catch (cause) { notifyError("Lead não salvo", cause instanceof Error ? cause.message : ""); }
    finally { setBusy(false); }
  }
  function convert() {
    // Vira cliente no cadastro e o lead vai para "Convertido".
    const saved = saveClient({ name: lead.name, company: lead.company, email: lead.email, phone: lead.phone, address: "", notes: `Lead do site em ${when(lead.createdAt)}.\n${lead.message}` });
    if (!saved) return notifyError("Clientes ainda carregando", "Tente de novo em instantes.");
    void save({ status: "won", clientId: saved.id }, "Lead convertido em cliente");
  }
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
    <DialogTitle>{lead.name}</DialogTitle>
    <DialogDescription>{lead.company && <>{lead.company} · </>}Recebido em {when(lead.createdAt)} · origem {lead.source || "/"}</DialogDescription>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" nativeButton={false} render={<a href={`mailto:${lead.email}?subject=${encodeURIComponent("Seu contato pelo site")}`} />}><RiMailLine />{lead.email}</Button>
      {lead.phone && <Button size="sm" variant="outline" nativeButton={false} render={<a href={`tel:${digits(lead.phone)}`} />}><RiPhoneLine />{lead.phone}</Button>}
    </div>
    <section className="space-y-1"><h3 className="text-sm font-semibold">Mensagem</h3><p className="whitespace-pre-wrap break-words border bg-muted/30 p-3 text-sm">{lead.message}</p></section>
    {Object.keys(lead.campaign).length > 0 && <p className="text-xs text-muted-foreground">Campanha: {Object.entries(lead.campaign).map(([key, value]) => `${key.replace("utm_", "")}: ${value}`).join(" · ")}</p>}
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Etapa do funil"><Select value={lead.status} disabled={busy} options={leadStages} onChange={event => void save({ status: event.target.value })} /></Field>
      <Field label="Próximo contato"><Input type="datetime-local" value={next} onChange={event => setNext(event.target.value)} onBlur={() => { if (next !== local(lead.nextContactAt)) void save({ nextContactAt: next ? new Date(next).toISOString() : "" }); }} /></Field>
      <Field label="Anotações" className="sm:col-span-2"><Textarea rows={4} maxLength={10000} value={notes} onChange={event => setNotes(event.target.value)} onBlur={() => { if (notes !== lead.notes) void save({ notes }, "Anotações salvas"); }} placeholder="Histórico de contato, interesse, orçamento…" /></Field>
    </div>
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
      {client ? <Link href={`/dashboard/clients?client=${client.id}`} className="text-sm text-primary underline-offset-4 hover:underline">Ver cliente {client.name}</Link>
        : <Button type="button" disabled={busy || !clientsLoaded} onClick={convert}><RiUserAddLine />Converter em cliente</Button>}
      <div className="flex flex-wrap gap-2">
        {/* Abre uma proposta nova já com o contato e a empresa do lead (Marketing › Propostas). */}
        <Button type="button" variant="outline" nativeButton={false} render={<Link href={`/dashboard/proposals?novo=1&contato=${encodeURIComponent(lead.name)}&empresa=${encodeURIComponent(lead.company)}`} />}><RiFileList3Line />Criar proposta</Button>
        <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
      </div>
    </footer>
  </DialogContent></Dialog>;
}

/** Marketing › Leads: contatos do botão de conversa do site, em funil. */
export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Status | "">("");
  const [openId, setOpenId] = useState("");
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/leads", { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Não foi possível carregar os leads.");
      setLeads(await response.json()); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }, []);
  useEffect(() => { const first = setTimeout(() => void load(), 0); const timer = setInterval(() => void load(), 60_000); return () => { clearTimeout(first); clearInterval(timer); }; }, [load]);
  const counts = useMemo(() => Object.fromEntries(leadStages.map(item => [item.value, (leads ?? []).filter(lead => lead.status === item.value).length])) as Record<Status, number>, [leads]);
  const total = leads?.length ?? 0;
  const conversion = total ? Math.round(counts.won / total * 100) : 0;
  const visible = (leads ?? []).filter(lead => (!filter || lead.status === filter) && matchesText([lead.name, lead.company, lead.email, lead.phone, lead.message, lead.notes, lead.source], search));
  const due = (leads ?? []).filter(lead => lead.nextContactAt && new Date(lead.nextContactAt) <= new Date() && !["won", "lost"].includes(lead.status)).length;
  const open = leads?.find(lead => lead.id === openId);
  const update = (lead: Lead) => setLeads(previous => previous?.map(item => item.id === lead.id ? lead : item) ?? null);
  const action = "grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
  return <CatalogLayout section="Marketing" title="Leads" description="Contatos recebidos pelo botão de conversa do site, do primeiro contato à conversão em cliente." action={<Button variant="outline" disabled={!visible.length} onClick={() => exportCsv(visible)}><RiDownloadLine />Exportar CSV</Button>}>
    {/* Funil num quadro só: total com a taxa de conversão e uma coluna por etapa (clicar filtra). */}
    <div className={cn(surfaceVariants(), "grid grid-cols-2 overflow-hidden sm:grid-cols-3 lg:grid-cols-6")}>
      <button type="button" aria-pressed={!filter} onClick={() => setFilter("")} className={cn("flex flex-col gap-1 border-b border-r p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:border-b-0", !filter ? "bg-primary/8" : "hover:bg-muted/40")}>
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="font-heading text-3xl font-semibold tabular-nums">{total}</span>
        <span className="mt-1 h-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-emerald-500" style={{ width: `${conversion}%` }} /></span>
        <span className="text-[11px] text-muted-foreground">{conversion}% convertidos</span>
      </button>
      {leadStages.map(item => { const active = filter === item.value; return <button key={item.value} type="button" aria-pressed={active} onClick={() => setFilter(active ? "" : item.value)}
        className={cn("flex flex-col gap-1 border-b border-r p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:border-b-0 lg:last:border-r-0", active ? "bg-(--stage)/10" : "hover:bg-muted/40")} style={{ "--stage": item.color } as CSSProperties}>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-(--stage)" />{item.label}</span>
        <span className={cn("font-heading text-3xl font-semibold tabular-nums", !counts[item.value] && "text-muted-foreground/50")}>{counts[item.value]}</span>
        {total > 0 && <span className="mt-1 h-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-(--stage)" style={{ width: `${Math.round(counts[item.value] / total * 100)}%` }} /></span>}
      </button>; })}
    </div>
    {due > 0 && <p className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm"><RiTimeLine className="size-4 shrink-0 text-amber-500" />{due} {due === 1 ? "lead com próximo contato vencido" : "leads com próximo contato vencido"}.</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex h-10 w-full max-w-sm items-center gap-2 rounded-full border bg-card/60 px-4 focus-within:border-ring">
        <RiSearchLine className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input aria-label="Buscar leads" placeholder="Buscar por nome, e-mail, telefone ou mensagem…" value={search} onChange={event => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm" />
      </label>
      {leads && <p className="text-sm text-muted-foreground">{visible.length} {visible.length === 1 ? "lead" : "leads"}{filter && ` em ${stage(filter).label.toLowerCase()}`}</p>}
    </div>
    {error && !leads ? <p role="alert" className="text-sm text-destructive">{error}</p> : !leads ? <LoadingBlock label="Carregando leads" />
      : !visible.length ? <div className={cn(surfaceVariants(), "grid place-items-center gap-2 px-6 py-14 text-center")}><RiInboxLine className="size-8 text-muted-foreground/60" /><p className="font-medium">{total ? "Nenhum lead encontrado" : "Nenhum contato ainda"}</p><p className="max-w-sm text-sm text-muted-foreground">{total ? "Tente outra busca ou limpe o filtro do funil." : "Os contatos do botão de conversa da página inicial aparecem aqui."}</p></div>
      : <ul className={cn(surfaceVariants({ list: true }))}>{visible.map(lead => { const current = stage(lead.status); const late = lead.nextContactAt && new Date(lead.nextContactAt) <= new Date() && !["won", "lost"].includes(lead.status);
        return <li key={lead.id} className="group relative flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:items-center sm:px-5" style={{ "--stage": current.color } as CSSProperties}>
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-(--stage)/15 text-sm font-semibold text-(--stage)">{initials(lead.name)}</span>
          <button type="button" onClick={() => setOpenId(lead.id)} className="min-w-0 flex-1 text-left outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset">
            <span className="flex flex-wrap items-center gap-2"><strong className="truncate">{lead.name}</strong>{lead.company && <span className="truncate text-sm text-muted-foreground">· {lead.company}</span>}<Badge color={current.color}>{current.label}</Badge>{late && <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><RiTimeLine className="size-3.5" />Contato vencido</span>}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground"><span className="inline-flex min-w-0 items-center gap-1"><RiMailLine className="size-3.5 shrink-0" /><span className="truncate">{lead.email}</span></span>{lead.phone && <span className="inline-flex items-center gap-1"><RiPhoneLine className="size-3.5 shrink-0" />{lead.phone}</span>}</span>
            {lead.message && <span className="mt-2 line-clamp-1 block border-l-2 border-(--stage)/50 pl-2 text-sm text-muted-foreground">{lead.message}</span>}
          </button>
          <div className="relative z-10 flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <time dateTime={lead.createdAt} title={when(lead.createdAt)} className="text-xs whitespace-nowrap text-muted-foreground">{ago(lead.createdAt)}</time>
            <span className="flex items-center gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
              <a href={`mailto:${lead.email}?subject=${encodeURIComponent("Seu contato pelo site")}`} aria-label={`E-mail para ${lead.name}`} title="E-mail" className={action}><RiMailLine className="size-4" /></a>
              <button type="button" aria-label={`Excluir lead ${lead.name}`} title="Excluir" onClick={() => setDeleting(lead)} className={cn(action, "hover:text-destructive")}><RiDeleteBinLine className="size-4" /></button>
            </span>
            <RiArrowRightSLine aria-hidden="true" className="hidden size-4 text-muted-foreground/60 sm:block" />
          </div>
        </li>; })}</ul>}
    {open && <LeadDialog key={open.id} lead={open} onClose={() => setOpenId("")} onChange={update} />}
    {deleting && <ConfirmDialog title="Excluir lead?" description={`O contato de ${deleting.name} será removido.`} onConfirm={async () => { const response = await fetch(`/api/admin/leads/${deleting.id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Não foi possível excluir."); setLeads(previous => previous?.filter(item => item.id !== deleting.id) ?? null); }} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
