"use client";
import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddressFields } from "@/components/ui/address-fields";
import { AttachmentsField } from "@/components/ui/attachments-field";
import { Button } from "@/components/ui/button";
import { CollapsibleFields, SectionPreferencesProvider } from "@/components/ui/collapsible-fields";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { jobTitles, validateProfile, type EmergencyContact } from "@/lib/employees/profile";
import { saveEmployee, type Employee, type EmployeeFields } from "@/lib/employees/store";
import { EmployeeDependents, EmployeeHistory, FieldGrid, contractFields, identityFields, payFields } from "./employee-profile-fields";

const empty: EmployeeFields = { status: "active", name: "", department: "", role: "", email: "", phone: "", address: "", notes: "" };
const emptyContact: EmergencyContact = { name: "", relationship: "", phone: "" };

export function EmployeeDialog({ employee, onClose }: { employee?: Employee; onClose: () => void }) {
  const [value, setValue] = useState<EmployeeFields>(employee ?? empty);
  const [error, setError] = useState("");
  const patch = (next: Partial<EmployeeFields>) => { setError(""); setValue(previous => ({ ...previous, ...next })); };
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === "string" ? item.trim() : item])) as EmployeeFields;
    if (!trimmed.name) { (event.currentTarget.elements.namedItem("name") as HTMLInputElement | null)?.focus(); return; }
    const problem = validateProfile(trimmed);
    if (problem) { setError(problem); return; }
    saveEmployee(trimmed, employee?.id); onClose();
  }
  const timestamp = (date: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
  const roleKnown = jobTitles.some(title => title.name === value.role);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-5xl"><DialogTitle>{employee ? "Editar colaborador" : "Novo colaborador"}</DialogTitle><p className="font-mono text-xs text-muted-foreground">Código: {employee?.code ?? "Gerado ao salvar"}</p>
    <SectionPreferencesProvider storageKey="viniszofx-employee-sections">
      <form onSubmit={submit} noValidate className="space-y-5"><div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><div className="min-w-0 space-y-5">
        <Field label="Nome" required><Input name="name" required maxLength={200} autoComplete="name" autoFocus value={value.name} onChange={event => patch({ name: event.target.value })} /></Field>
        <CollapsibleFields title="Identificação e contato"><FieldGrid value={value} onChange={patch} fields={identityFields} /></CollapsibleFields>
        <CollapsibleFields title="Vínculo e contrato">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cargo ou função" hint="Escolher um cargo do catálogo preenche o departamento."><Select value={value.role} placeholder="Sem cargo" options={[...(value.role && !roleKnown ? [{ value: value.role, label: `${value.role} (cargo anterior)` }] : []), ...jobTitles.map(title => ({ value: title.name, label: `${title.name} · ${title.department}` }))]} onChange={event => { const title = jobTitles.find(item => item.name === event.target.value); patch({ role: event.target.value, ...(title ? { department: title.department } : {}) }); }} /></Field>
            <Field label="Departamento"><Input maxLength={200} value={value.department} onChange={event => patch({ department: event.target.value })} /></Field>
          </div>
          <FieldGrid value={value} onChange={patch} fields={contractFields} />
        </CollapsibleFields>
        <CollapsibleFields title="Remuneração e jornada"><FieldGrid value={value} onChange={patch} fields={payFields} /></CollapsibleFields>
        <CollapsibleFields title="Endereço"><AddressFields showTitle={false} value={value} onChange={patch} />{value.address && !value.street && <p className="text-xs text-muted-foreground">Endereço anterior: {value.address}</p>}</CollapsibleFields>
        <EmployeeDependents dependents={value.dependents ?? []} onChange={dependents => patch({ dependents })} />
        <EmployeeHistory events={value.employmentEvents ?? []} onChange={employmentEvents => patch({ employmentEvents })} />
        <CollapsibleFields title="Contato de emergência (opcional)"><FieldGrid value={{ ...emptyContact, ...value.emergencyContact }} onChange={contact => patch({ emergencyContact: { ...emptyContact, ...value.emergencyContact, ...contact } })} fields={[{ name: "name", label: "Nome" }, { name: "relationship", label: "Vínculo" }, { name: "phone", label: "Telefone", kind: "tel" }]} /></CollapsibleFields>
      </div>
      <aside className="min-w-0 space-y-5"><AttachmentsField files={value.attachments ?? []} removalContext="o colaborador" onChange={attachments => patch({ attachments })} /><Field label="Situação"><Select aria-label="Situação do colaborador" value={value.status ?? "active"} options={[{ value: "active", label: "Ativo" }, { value: "terminated", label: "Desligado" }]} onChange={event => patch({ status: event.target.value as "active" | "terminated" })} /></Field><Field label="Observações"><Textarea name="notes" rows={10} maxLength={5000} className="min-h-64" value={value.notes} onChange={event => patch({ notes: event.target.value })} /></Field>
        <p className="text-xs text-muted-foreground">O cadastro organiza informações, mas não envia eventos ao eSocial nem comprova, por si só, o cumprimento das obrigações trabalhistas.</p></aside></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"><div className="mr-auto basis-full space-y-1 text-xs text-muted-foreground sm:basis-auto"><DialogDescription className="text-xs">Dados pessoais, contrato, dependentes e histórico do colaborador.</DialogDescription><p>Criado em {employee ? <time dateTime={employee.createdAt}>{timestamp(employee.createdAt)}</time> : "Após salvar"} · Atualizado em {employee ? <time dateTime={employee.updatedAt}>{timestamp(employee.updatedAt)}</time> : "Após salvar"}</p></div><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar colaborador</Button></footer>
      </form>
    </SectionPreferencesProvider>
  </DialogContent></Dialog>;
}
