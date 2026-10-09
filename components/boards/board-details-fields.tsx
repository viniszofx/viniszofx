"use client";
import Link from "next/link";
import { boardStatuses, boardStatus, type BoardStatus } from "@/lib/boards/status";
import { useClients } from "@/lib/clients/store";
export function BoardDetailsFields({ clientId, status, onChange }: { status?: BoardStatus; clientId?: string | null; onChange: (patch: { status?: BoardStatus; description?: string; clientId?: string | null }) => void }) {
  const { clients, loaded, error } = useClients();
  const missing = !!clientId && loaded && !clients.some(client => client.id === clientId);
  return <>
    <label className="grid gap-2 text-sm">Status<select aria-label="Status do board" value={boardStatus(status).value} onChange={event => onChange({ status: boardStatus(event.target.value).value })} className="h-10 w-full min-w-0 rounded-none border border-transparent border-b-input bg-background text-sm outline-none focus-visible:border-b-ring">{boardStatuses.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    <label className="grid gap-2 text-sm">Cliente (opcional)<select aria-label="Cliente do board" disabled={!loaded || !!error} value={clientId ?? ""} onChange={event => onChange({ clientId: event.target.value || null })} className="h-10 w-full min-w-0 rounded-none border border-transparent border-b-input bg-background text-sm outline-none focus-visible:border-b-ring disabled:opacity-50"><option value="">Sem cliente</option>{missing && <option value={clientId!}>Cliente removido</option>}{[...clients].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map(client => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ""}</option>)}</select></label>
    {error ? <p role="alert" className="text-xs text-destructive">{error} Você pode salvar o board sem alterar o cliente.</p> : !loaded ? <p role="status" className="text-xs text-muted-foreground">Carregando clientes…</p> : !clients.length ? <p className="text-xs text-muted-foreground">Nenhum cliente cadastrado. <Link href="/dashboard/clients" className="underline underline-offset-4">Cadastrar em Clients</Link></p> : missing ? <p className="text-xs text-muted-foreground">O cliente vinculado foi removido. Selecione outro ou escolha Sem cliente.</p> : null}
  </>;
}

export function BoardDescriptionField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm">Descrição<textarea aria-label="Descrição do board" rows={6} maxLength={5000} value={value} onChange={event => onChange(event.target.value)} placeholder="Sobre o que é este board?" className="min-h-40 w-full resize-y rounded-none border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>;
}
