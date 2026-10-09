"use client";
import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveClient, type Client, type ClientFields } from "@/lib/clients/store";

const empty: ClientFields = { name: "", company: "", email: "", phone: "", address: "", notes: "" };
const fields = [
  { name: "name", label: "Nome", required: true, maxLength: 200, autoComplete: "name" },
  { name: "company", label: "Empresa", maxLength: 200, autoComplete: "organization" },
  { name: "email", label: "E-mail", type: "email", maxLength: 254, autoComplete: "email" },
  { name: "phone", label: "Telefone", type: "tel", maxLength: 40, autoComplete: "tel" },
  { name: "address", label: "Endereço", maxLength: 500, autoComplete: "street-address" },
] as const;
export function ClientDialog({ client, onClose }: { client?: Client; onClose: () => void }) {
  const [value, setValue] = useState<ClientFields>(client ? { name: client.name, company: client.company, email: client.email, phone: client.phone, address: client.address, notes: client.notes } : empty);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(value).map(([key, value]) => [key, value.trim()])) as ClientFields;
    if (!trimmed.name) { (event.currentTarget.elements.namedItem("name") as HTMLInputElement | null)?.focus(); return; }
    saveClient(trimmed, client?.id); onClose();
  }
  const timestamp = (date: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-xl"><DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle><DialogDescription>Cadastre os dados de contato. Apenas o nome é obrigatório.</DialogDescription>
    <form onSubmit={submit} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2">{fields.map(field => <label key={field.name} className={`grid gap-2 text-sm ${field.name === "name" || field.name === "address" ? "sm:col-span-2" : ""}`}>{field.label}{"required" in field && " *"}<Input name={field.name} required={"required" in field && field.required} maxLength={field.maxLength} autoComplete={field.autoComplete} type={"type" in field ? field.type : "text"} autoFocus={field.name === "name"} aria-label={field.label} value={value[field.name]} onChange={event => setValue(previous => ({ ...previous, [field.name]: event.target.value }))} /></label>)}</div>
      <label className="grid gap-2 text-sm">Observações<textarea name="notes" aria-label="Observações" rows={4} maxLength={5000} value={value.notes} onChange={event => setValue(previous => ({ ...previous, notes: event.target.value }))} className="min-h-28 w-full resize-y rounded-none border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"><div className="mr-auto basis-full space-y-1 text-xs text-muted-foreground sm:basis-auto"><p>Salvo neste navegador.</p>{client && <p>Criado em <time dateTime={client.createdAt}>{timestamp(client.createdAt)}</time><br />Atualizado em <time dateTime={client.updatedAt}>{timestamp(client.updatedAt)}</time></p>}</div><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar cliente</Button></footer>
    </form>
  </DialogContent></Dialog>;
}
