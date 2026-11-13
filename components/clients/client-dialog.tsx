"use client";
import { useState, type FormEvent } from "react";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddressFields } from "@/components/ui/address-fields";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveClient, type Client, type ClientFields } from "@/lib/clients/store";
import { formatPhone } from "@/lib/employees/profile";
import { newId } from "@/lib/records/store";

const empty: ClientFields = { name: "", company: "", document: "", email: "", phone: "", address: "", notes: "", addresses: [] };
const fields = [
  { name: "name", label: "Nome", required: true, maxLength: 200, autoComplete: "name" },
  { name: "company", label: "Empresa", maxLength: 200, autoComplete: "organization" },
  { name: "document", label: "CPF/CNPJ", maxLength: 24, autoComplete: "off" },
  { name: "email", label: "E-mail", type: "email", maxLength: 254, autoComplete: "email" },
  { name: "phone", label: "Telefone", type: "tel", maxLength: 40, autoComplete: "tel" },
] as const;

export function ClientDialog({ client, onClose }: { client?: Client; onClose: () => void }) {
  const [value, setValue] = useState<ClientFields>(client ? { ...empty, ...client } : empty);
  const patch = (next: Partial<ClientFields>) => setValue(previous => ({ ...previous, ...next }));
  const addresses = value.addresses ?? [];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === "string" ? item.trim() : item])) as ClientFields;
    if (!trimmed.name) { (event.currentTarget.elements.namedItem("name") as HTMLInputElement | null)?.focus(); return; }
    saveClient(trimmed, client?.id); onClose();
  }
  const timestamp = (date: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-2xl"><DialogTitle>{client ? "Editar cliente" : "Novo cliente"}</DialogTitle><DialogDescription>Cadastre os dados de contato e os endereços. Apenas o nome é obrigatório.</DialogDescription>
    <form onSubmit={submit} className="space-y-5"><div className="grid gap-5 sm:grid-cols-2">{fields.map(field => <Field key={field.name} label={field.label} required={"required" in field} className={field.name === "name" ? "sm:col-span-2" : ""}><Input name={field.name} required={"required" in field && field.required} maxLength={field.maxLength} autoComplete={field.autoComplete} type={"type" in field ? field.type : "text"} autoFocus={field.name === "name"} value={value[field.name] ?? ""} onChange={event => patch({ [field.name]: field.name === "phone" ? formatPhone(event.target.value) : event.target.value })} /></Field>)}</div>
      <div>
        <AddressFields value={value} onChange={patch} title="Endereço principal" />
        {value.address && !value.street && <p className="mt-2 text-xs text-muted-foreground">Endereço anterior: {value.address}</p>}
      </div>
      {addresses.map((address, index) => <div key={address.id} className="space-y-2">
        <div className="flex items-end gap-2"><Field label={`Nome do endereço ${index + 2}`} className="flex-1"><Input placeholder="Filial, obra, depósito…" maxLength={120} value={address.label ?? ""} onChange={event => patch({ addresses: addresses.map(item => item.id === address.id ? { ...item, label: event.target.value } : item) })} /></Field><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover endereço ${index + 2}`} onClick={() => patch({ addresses: addresses.filter(item => item.id !== address.id) })}><RiDeleteBinLine /></Button></div>
        <AddressFields value={address} showTitle={false} onChange={change => patch({ addresses: addresses.map(item => item.id === address.id ? { ...item, ...change } : item) })} />
      </div>)}
      {addresses.length < 20 && <Button type="button" variant="outline" size="sm" onClick={() => patch({ addresses: [...addresses, { id: newId() }] })}><RiAddLine />Adicionar endereço</Button>}
      <Field label="Observações"><Textarea name="notes" rows={4} maxLength={5000} className="min-h-28" value={value.notes} onChange={event => patch({ notes: event.target.value })} /></Field>
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"><div className="mr-auto basis-full space-y-1 text-xs text-muted-foreground sm:basis-auto">{client && <p>Criado em <time dateTime={client.createdAt}>{timestamp(client.createdAt)}</time><br />Atualizado em <time dateTime={client.updatedAt}>{timestamp(client.updatedAt)}</time></p>}</div><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar cliente</Button></footer>
    </form>
  </DialogContent></Dialog>;
}
