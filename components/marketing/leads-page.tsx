"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RiDeleteBinLine, RiDownloadLine, RiMailLine, RiPhoneLine, RiUserAddLine, RiWhatsappLine } from "@remixicon/react";
import { CatalogLayout, CatalogSearch } from "@/components/listing/catalog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Badge, LoadingBlock } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveClient, useClients } from "@/lib/clients/store";
import { matchesText } from "@/lib/records/store";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";

export type Lead = {
  id: string; name: string; email: string; phone: string; message: string; status: Status; source: string;
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
const local = (value: string | null) => { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

async function patchLead(id: string, change: Record<string, unknown>) {
  const response = await fetch(`/api/admin/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(change) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Não foi possível salvar o lead.");
  return body as Lead;
}

function exportCsv(rows: Lead[]) {
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = ["Data", "Nome", "E-mail", "Telefone", "Etapa", "Mensagem", "Origem", "Campanha", "Próximo contato", "Anotações"];
  const lines = rows.map(lead => [when(lead.createdAt), lead.name, lead.email, lead.phone, stage(lead.status).label, lead.message, lead.source, Object.entries(lead.campaign).map(([key, value]) => `${key}=${value}`).join(" "), lead.nextContactAt ? when(lead.nextContactAt) : "", lead.notes].map(cell).join(";"));
  const url = URL.createObjectURL(new Blob(["﻿" + [header.map(cell).join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" }));
  Object.assign(document.createElement("a"), { href: url, download: `leads-${new Date().toISOString().slice(0, 10)}.csv` }).click();
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
    const saved = saveClient({ name: lead.name, company: "", email: lead.email, phone: lead.phone, address: "", notes: `Lead do site em ${when(lead.createdAt)}.\n${lead.message}` });
    if (!saved) return notifyError("Clientes ainda carregando", "Tente de novo em instantes.");
    void save({ status: "won", clientId: saved.id }, "Lead convertido em cliente");
  }
  const whatsapp = digits(lead.phone).length >= 10 ? `https://wa.me/55${digits(lead.phone).replace(/^55/, "")}?text=${encodeURIComponent(`Olá, ${lead.name.split(" ")[0]}! Recebi sua mensagem pelo site.`)}` : "";
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
    <DialogTitle>{lead.name}</DialogTitle>
    <DialogDescription>Recebido em {when(lead.createdAt)} · origem {lead.source || "/"}</DialogDescription>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" nativeButton={false} render={<a href={`mailto:${lead.email}?subject=${encodeURIComponent("Seu contato pelo site")}`} />}><RiMailLine />{lead.email}</Button>
      {lead.phone && <Button size="sm" variant="outline" nativeButton={false} render={<a href={`tel:${digits(lead.phone)}`} />}><RiPhoneLine />{lead.phone}</Button>}
      {whatsapp && <Button size="sm" variant="outline" nativeButton={false} render={<a href={whatsapp} target="_blank" rel="noreferrer" />}><RiWhatsappLine />WhatsApp</Button>}
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
      <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
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
  const visible = (leads ?? []).filter(lead => (!filter || lead.status === filter) && matchesText([lead.name, lead.email, lead.phone, lead.message, lead.notes, lead.source], search));
  const due = (leads ?? []).filter(lead => lead.nextContactAt && new Date(lead.nextContactAt) <= new Date() && !["won", "lost"].includes(lead.status)).length;
  const open = leads?.find(lead => lead.id === openId);
  const update = (lead: Lead) => setLeads(previous => previous?.map(item => item.id === lead.id ? lead : item) ?? null);
  return <CatalogLayout section="Marketing" title="Leads" description="Contatos recebidos pelo botão de conversa do site, do primeiro contato à conversão em cliente." action={<Button variant="outline" disabled={!visible.length} onClick={() => exportCsv(visible)}><RiDownloadLine />Exportar CSV</Button>}>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <button type="button" aria-pressed={!filter} onClick={() => setFilter("")} className={`border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${!filter ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/40"}`}><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-semibold tabular-nums">{total}</p><p className="text-[11px] text-muted-foreground">{conversion}% convertidos</p></button>
      {leadStages.map(item => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(filter === item.value ? "" : item.value)} className={`border border-t-[3px] p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === item.value ? "bg-primary/5" : "bg-card hover:bg-muted/40"}`} style={{ borderTopColor: item.color }}><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-2xl font-semibold tabular-nums">{counts[item.value]}</p></button>)}
    </div>
    {due > 0 && <p className="border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm">{due} lead(s) com próximo contato vencido.</p>}
    <CatalogSearch label="Buscar leads" value={search} onChange={setSearch} />
    {error && !leads ? <p role="alert" className="text-sm text-destructive">{error}</p> : !leads ? <LoadingBlock label="Carregando leads" /> : !visible.length ? <p className="text-sm text-muted-foreground">{total ? "Nenhum lead encontrado." : "Ainda não chegou nenhum contato. O botão de conversa fica na página inicial do site."}</p>
      : <ul className={cn(surfaceVariants({ list: true }))}>{visible.map(lead => { const current = stage(lead.status); const late = lead.nextContactAt && new Date(lead.nextContactAt) <= new Date() && !["won", "lost"].includes(lead.status);
        return <li key={lead.id} className="flex flex-wrap items-start gap-3 px-4 py-3 sm:flex-nowrap sm:items-center">
          <button type="button" onClick={() => setOpenId(lead.id)} className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm">{lead.name}</strong><Badge color={current.color}>{current.label}</Badge>{late && <span className="text-xs font-medium text-destructive">Contato vencido</span>}</span>
            <span className="block truncate text-xs text-muted-foreground">{lead.email}{lead.phone && ` · ${lead.phone}`}</span>
            <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{lead.message}</span>
          </button>
          <span className="shrink-0 text-xs text-muted-foreground">{when(lead.createdAt)}</span>
          <Button variant="ghost" size="icon-sm" aria-label={`Excluir lead ${lead.name}`} onClick={() => setDeleting(lead)}><RiDeleteBinLine /></Button>
        </li>; })}</ul>}
    {open && <LeadDialog key={open.id} lead={open} onClose={() => setOpenId("")} onChange={update} />}
    {deleting && <ConfirmDialog title="Excluir lead?" description={`O contato de ${deleting.name} será removido.`} onConfirm={async () => { const response = await fetch(`/api/admin/leads/${deleting.id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Não foi possível excluir."); setLeads(previous => previous?.filter(item => item.id !== deleting.id) ?? null); }} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
