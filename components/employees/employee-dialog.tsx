"use client";
import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddressFields } from "@/components/ui/address-fields";
import { AttachmentsField } from "@/components/ui/attachments-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveEmployee, type Employee, type EmployeeFields } from "@/lib/employees/store";

const empty: EmployeeFields = { status: "active", name: "", department: "", role: "", email: "", phone: "", address: "", notes: "" };
const fields = [
  { name: "name", label: "Nome", required: true, maxLength: 200, autoComplete: "name" },
  { name: "department", label: "Departamento", maxLength: 200, autoComplete: "organization" },
  { name: "role", label: "Cargo", maxLength: 200, autoComplete: "organization-title" },
  { name: "email", label: "E-mail", type: "email", maxLength: 254, autoComplete: "email" },
  { name: "phone", label: "Telefone", type: "tel", maxLength: 40, autoComplete: "tel" },
] as const;
export function EmployeeDialog({ employee, onClose }: { employee?: Employee; onClose: () => void }) {
  const [value, setValue] = useState<EmployeeFields>(employee ?? empty);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(value).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])) as EmployeeFields;
    if (!trimmed.name) { (event.currentTarget.elements.namedItem("name") as HTMLInputElement | null)?.focus(); return; }
    saveEmployee(trimmed, employee?.id); onClose();
  }
  const timestamp = (date: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-5xl"><DialogTitle>{employee ? "Editar empregado" : "Novo empregado"}</DialogTitle><p className="font-mono text-xs text-muted-foreground">Código: {employee?.code ?? "Gerado ao salvar"}</p>
    <form onSubmit={submit} className="space-y-5"><div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><div className="min-w-0 space-y-5"><div className="grid content-start gap-5 sm:grid-cols-2">{fields.map(field => <label key={field.name} className={`grid gap-2 text-sm ${field.name === "name" ? "sm:col-span-2" : ""}`}>{field.label}{"required" in field && " *"}<Input name={field.name} required={"required" in field && field.required} maxLength={field.maxLength} autoComplete={field.autoComplete} type={"type" in field ? field.type : "text"} autoFocus={field.name === "name"} aria-label={field.label} value={value[field.name]} onChange={event => setValue(previous => ({ ...previous, [field.name]: event.target.value }))} /></label>)}</div><AddressFields value={value} onChange={patch => setValue(previous => ({ ...previous, ...patch }))} />{value.address && !value.street && <p className="text-xs text-muted-foreground">Endereço anterior: {value.address}</p>}</div>
      <aside className="min-w-0 space-y-5"><AttachmentsField files={value.attachments ?? []} removalContext="o empregado" onChange={attachments => setValue(previous => ({ ...previous, attachments }))} /><label className="grid gap-2 text-sm">Status<select aria-label="Status do empregado" value={value.status ?? "active"} onChange={event => setValue(previous => ({ ...previous, status: event.target.value as "active" | "terminated" }))} className="h-10 w-full min-w-0 rounded-none border border-transparent border-b-input bg-background text-sm outline-none focus-visible:border-b-ring"><option value="active">Ativo</option><option value="terminated">Desligado</option></select></label><label className="grid gap-2 text-sm">Observações<textarea name="notes" aria-label="Observações" rows={10} maxLength={5000} value={value.notes} onChange={event => setValue(previous => ({ ...previous, notes: event.target.value }))} className="min-h-64 w-full resize-y rounded-none border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label></aside></div>
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"><div className="mr-auto basis-full space-y-1 text-xs text-muted-foreground sm:basis-auto"><DialogDescription className="text-xs">Organize seus empregados. As alterações ficam salvas neste navegador.</DialogDescription><p>Criado em {employee ? <time dateTime={employee.createdAt}>{timestamp(employee.createdAt)}</time> : "Após salvar"} · Atualizado em {employee ? <time dateTime={employee.updatedAt}>{timestamp(employee.updatedAt)}</time> : "Após salvar"}</p></div><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar empregado</Button></footer>
    </form>
  </DialogContent></Dialog>;
}
