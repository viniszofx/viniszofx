"use client";
import { useState, type ReactNode } from "react";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { CollapsibleFields } from "@/components/ui/collapsible-fields";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { newId } from "@/lib/records/store";
import {
  blankDependent, blankEvent, contractTypeOptions, educationOptions, employmentEventLabels, formatCpf, formatPhone, maritalOptions,
  relationshipOptions, sexOptions, validCpf, workNatureOptions, type EmployeeDependent, type EmployeeProfile, type EmploymentEvent, type EmploymentEventType,
} from "@/lib/employees/profile";

type Kind = "text" | "date" | "number" | "money" | "cpf" | "tel" | "email" | "textarea" | string[];
export type GridField<T> = { name: keyof T & string; label: string; kind?: Kind; wide?: boolean; hint?: string };
const options = (values: string[], current: string) => [...values, ...(current && !values.includes(current) ? [current] : [])].map(value => ({ value, label: value }));

/** Grade de campos simples sobre um objeto, como o FieldGrid do Nodus. */
export function FieldGrid<T extends object>({ value, onChange, fields }: { value: T; onChange: (patch: Partial<T>) => void; fields: GridField<T>[] }) {
  const read = (name: string) => String((value as Record<string, unknown>)[name] ?? "");
  const set = (name: string, next: string) => onChange({ [name]: next } as Partial<T>);
  return <div className="grid gap-4 sm:grid-cols-2">{fields.map(field => {
    const current = read(field.name);
    const kind = field.kind ?? "text";
    let control: ReactNode;
    if (Array.isArray(kind)) control = <Select aria-label={field.label} placeholder="Não informado" options={options(kind, current)} value={current} onChange={event => set(field.name, event.target.value)} />;
    else if (kind === "money") control = <CurrencyInput aria-label={field.label} value={current} onValueChange={next => set(field.name, next)} />;
    else if (kind === "textarea") control = <Textarea aria-label={field.label} rows={3} value={current} onChange={event => set(field.name, event.target.value)} />;
    else if (kind === "cpf") control = <Input aria-label={field.label} inputMode="numeric" placeholder="000.000.000-00" aria-invalid={!validCpf(current)} value={current} onChange={event => set(field.name, formatCpf(event.target.value))} />;
    else if (kind === "tel") control = <Input aria-label={field.label} type="tel" inputMode="tel" placeholder="(00) 00000-0000" value={current} onChange={event => set(field.name, formatPhone(event.target.value))} />;
    else control = <Input aria-label={field.label} type={kind} min={kind === "number" ? 0 : undefined} value={current} onChange={event => set(field.name, event.target.value)} />;
    const invalid = kind === "cpf" && !validCpf(current);
    return <Field key={field.name} label={field.label} className={field.wide || kind === "textarea" ? "sm:col-span-2" : ""} hint={invalid ? <span className="text-destructive">CPF inválido.</span> : field.hint}>{control}</Field>;
  })}</div>;
}

function SectionAction({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button type="button" variant="outline" size="sm" onClick={onClick}><RiAddLine />{label}</Button>;
}

export function EmployeeDependents({ dependents, onChange }: { dependents: EmployeeDependent[]; onChange: (next: EmployeeDependent[]) => void }) {
  const [deleting, setDeleting] = useState<EmployeeDependent | null>(null);
  const update = (id: string, patch: Partial<EmployeeDependent>) => onChange(dependents.map(item => item.id === id ? { ...item, ...patch } : item));
  return <CollapsibleFields title={`Dependentes (${dependents.length})`}>
    {!dependents.length && <p className="text-xs text-muted-foreground">Adicione dependentes quando houver vínculo para IRRF ou salário-família.</p>}
    {dependents.map((dependent, index) => <div key={dependent.id} className="space-y-4 border p-4">
      <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold">Dependente {index + 1}</h4><Button type="button" size="icon-sm" variant="ghost" aria-label={`Remover dependente ${index + 1}`} onClick={() => setDeleting(dependent)}><RiDeleteBinLine /></Button></div>
      <FieldGrid value={dependent} onChange={patch => update(dependent.id, patch)} fields={[
        { name: "name", label: "Nome completo *", wide: true }, { name: "relationship", label: "Vínculo *", kind: relationshipOptions },
        { name: "birthDate", label: "Data de nascimento *", kind: "date" }, { name: "cpf", label: "CPF", kind: "cpf" },
      ]} />
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={dependent.incomeTax} onChange={event => update(dependent.id, { incomeTax: event.target.checked })} />Dependente para IRRF</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={dependent.familyAllowance} onChange={event => update(dependent.id, { familyAllowance: event.target.checked })} />Salário-família</label>
      </div>
      {dependent.incomeTax && !dependent.cpf && <p className="text-xs text-muted-foreground">Informe o CPF para a dedução do IRRF.</p>}
    </div>)}
    {dependents.length < 99 && <SectionAction label="Adicionar dependente" onClick={() => onChange([...dependents, blankDependent(newId())])} />}
    {deleting && <ConfirmDialog title="Remover dependente?" description={`Remover “${deleting.name || "este dependente"}” do cadastro?`} confirmLabel="Remover dependente" onConfirm={() => onChange(dependents.filter(item => item.id !== deleting.id))} onClose={() => setDeleting(null)} />}
  </CollapsibleFields>;
}

function eventFields(type: EmploymentEventType): GridField<EmploymentEvent>[] {
  const start: GridField<EmploymentEvent> = { name: "startDate", label: type === "contract_change" ? "Vigência a partir de *" : type === "accident" ? "Data do acidente *" : "Data inicial *", kind: "date" };
  const specific: Record<EmploymentEventType, GridField<EmploymentEvent>[]> = {
    vacation: [{ name: "endDate", label: "Data final", kind: "date" }, { name: "accrualStartDate", label: "Início do período aquisitivo", kind: "date" }, { name: "accrualEndDate", label: "Fim do período aquisitivo", kind: "date" }],
    leave: [{ name: "endDate", label: "Data final", kind: "date" }, { name: "reason", label: "Motivo do afastamento", wide: true }],
    accident: [{ name: "catNumber", label: "Número da CAT" }, { name: "location", label: "Local da ocorrência" }],
    contract_change: [{ name: "newRole", label: "Novo cargo ou função" }, { name: "newDepartment", label: "Novo departamento" }, { name: "newSalary", label: "Novo salário", kind: "money" }, { name: "newWeeklyHours", label: "Novas horas semanais", kind: "number" }, { name: "newWorkLocation", label: "Novo local de trabalho" }, { name: "newContractType", label: "Novo prazo do contrato", kind: contractTypeOptions }],
  };
  return [start, ...specific[type], { name: "description", label: "Observações", kind: "textarea" }];
}

export function EmployeeHistory({ events, onChange }: { events: EmploymentEvent[]; onChange: (next: EmploymentEvent[]) => void }) {
  const [deleting, setDeleting] = useState<EmploymentEvent | null>(null);
  const update = (id: string, patch: Partial<EmploymentEvent>) => onChange(events.map(item => item.id === id ? { ...item, ...patch } : item));
  return <CollapsibleFields title={`Histórico trabalhista (${events.length})`}>
    {!events.length && <p className="text-xs text-muted-foreground">Registre férias, afastamentos, acidentes e alterações contratuais.</p>}
    {events.length < 200 && <SectionAction label="Adicionar ocorrência" onClick={() => onChange([blankEvent(newId()), ...events])} />}
    {events.map(item => <div key={item.id} className="min-w-0 space-y-4 border p-4">
      <div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold">{employmentEventLabels[item.type]}{item.startDate && ` · ${new Date(`${item.startDate}T12:00`).toLocaleDateString("pt-BR")}`}</h4><Button type="button" size="icon-sm" variant="ghost" aria-label={`Remover ${employmentEventLabels[item.type]} do histórico`} onClick={() => setDeleting(item)}><RiDeleteBinLine /></Button></div>
      <Field label="Tipo de ocorrência"><Select value={item.type} options={Object.entries(employmentEventLabels).map(([value, label]) => ({ value, label }))} onChange={event => update(item.id, blankEvent(item.id, event.target.value as EmploymentEventType, item.startDate))} /></Field>
      <FieldGrid value={item} onChange={patch => update(item.id, patch)} fields={eventFields(item.type)} />
    </div>)}
    {deleting && <ConfirmDialog title="Remover ocorrência?" description={`Remover ${employmentEventLabels[deleting.type]} do histórico trabalhista?`} confirmLabel="Remover ocorrência" onConfirm={() => onChange(events.filter(item => item.id !== deleting.id))} onClose={() => setDeleting(null)} />}
  </CollapsibleFields>;
}

export const identityFields: GridField<EmployeeProfile & { email: string; phone: string }>[] = [
  { name: "cpf", label: "CPF", kind: "cpf" }, { name: "birthDate", label: "Data de nascimento", kind: "date" },
  { name: "sex", label: "Sexo", kind: sexOptions }, { name: "nationality", label: "Nacionalidade" },
  { name: "maritalStatus", label: "Estado civil", kind: maritalOptions }, { name: "education", label: "Escolaridade", kind: educationOptions },
  { name: "email", label: "E-mail", kind: "email" }, { name: "phone", label: "Telefone", kind: "tel" },
];
export const contractFields: GridField<EmployeeProfile>[] = [
  { name: "registrationNumber", label: "Matrícula" }, { name: "admissionDate", label: "Data de admissão", kind: "date" },
  { name: "categoryCode", label: "Código da categoria eSocial" }, { name: "cboCode", label: "Código CBO" },
  { name: "workNature", label: "Natureza da atividade", kind: workNatureOptions }, { name: "contractType", label: "Prazo do contrato", kind: contractTypeOptions },
  { name: "contractEndDate", label: "Fim previsto do contrato", kind: "date" }, { name: "terminationDate", label: "Data de desligamento", kind: "date" },
];
export const payFields: GridField<EmployeeProfile>[] = [
  { name: "salary", label: "Salário contratual", kind: "money" }, { name: "weeklyHours", label: "Horas semanais", kind: "number" },
  { name: "workSchedule", label: "Horário de trabalho", wide: true }, { name: "workLocation", label: "Local de trabalho", wide: true },
];
