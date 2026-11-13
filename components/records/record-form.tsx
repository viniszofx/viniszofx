"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { RiAddLine as Plus, RiDeleteBinLine as Trash2 } from "@remixicon/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { AttachmentsField } from "@/components/ui/attachments-field";
import type { CardAttachment } from "@/lib/boards/store";
import { newId, type RecordMeta } from "@/lib/records/store";
import { selectClass, textareaClass } from "@/components/ui/field";
import { useReferenceOptions, type ReferenceSource } from "@/lib/records/references";

export type FieldOption = { readonly value: string; readonly label: string };
type Base = { name: string; label: string; required?: boolean; wide?: boolean; hint?: string };
export type RowColumn = { name: string; label: string; type?: "text" | "number" | "checkbox"; width?: string };
export type FieldDef = Base & (
  | { type: "text" | "email" | "tel" | "number" | "date" | "datetime-local" | "time" | "url"; placeholder?: string }
  | { type: "textarea"; rows?: number }
  | { type: "currency" }
  | { type: "checkbox" }
  | { type: "select"; options: readonly FieldOption[]; emptyLabel?: string }
  | { type: "reference"; source: ReferenceSource; multiple?: boolean }
  | { type: "attachments" }
  | { type: "rows"; columns: RowColumn[]; addLabel: string }
);
export type FormValues = Record<string, unknown>;


function ReferenceInput({ field, value, onChange }: { field: Extract<FieldDef, { type: "reference" }>; value: unknown; onChange: (value: unknown) => void }) {
  const { options, loaded } = useReferenceOptions(field.source);
  if (!field.multiple) return <select aria-label={field.label} required={field.required} className={selectClass} value={typeof value === "string" ? value : ""} onChange={event => onChange(event.target.value)}>
    <option value="">{loaded ? "Nenhum" : "Carregando…"}</option>
    {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select>;
  const selected = Array.isArray(value) ? value as string[] : [];
  return <div className="max-h-44 space-y-1 overflow-y-auto border p-2" role="group" aria-label={field.label}>
    {!options.length && <p className="text-xs text-muted-foreground">{loaded ? "Nenhum registro cadastrado." : "Carregando…"}</p>}
    {options.map(option => <label key={option.value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(option.value)} onChange={event => onChange(event.target.checked ? [...selected, option.value] : selected.filter(id => id !== option.value))} />{option.label}</label>)}
  </div>;
}

function RowsInput({ field, value, onChange }: { field: Extract<FieldDef, { type: "rows" }>; value: unknown; onChange: (value: unknown) => void }) {
  const rows = Array.isArray(value) ? value as Record<string, unknown>[] : [];
  const update = (id: unknown, patch: Record<string, unknown>) => onChange(rows.map(row => row.id === id ? { ...row, ...patch } : row));
  const blank = () => ({ id: newId(), ...Object.fromEntries(field.columns.map(column => [column.name, column.type === "checkbox" ? false : ""])) });
  return <div className="space-y-2">
    {rows.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground">{field.columns.map(column => <th key={column.name} className="px-1 pb-1 font-medium" style={{ width: column.width }}>{column.label}</th>)}<th className="w-10"><span className="sr-only">Ações</span></th></tr></thead>
      <tbody>{rows.map((row, index) => <tr key={String(row.id)} className="border-t">{field.columns.map(column => <td key={column.name} className="px-1 py-1">{column.type === "checkbox"
        ? <input type="checkbox" aria-label={`${column.label} da linha ${index + 1}`} checked={row[column.name] === true} onChange={event => update(row.id, { [column.name]: event.target.checked })} />
        : <Input aria-label={`${column.label} da linha ${index + 1}`} type={column.type ?? "text"} min={column.type === "number" ? 0 : undefined} step="any" value={String(row[column.name] ?? "")} onChange={event => update(row.id, { [column.name]: event.target.value })} />}</td>)}
        <td><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover linha ${index + 1}`} onClick={() => onChange(rows.filter(item => item.id !== row.id))}><Trash2 /></Button></td></tr>)}</tbody></table></div>}
    <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, blank()])}><Plus />{field.addLabel}</Button>
  </div>;
}

export function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (value: unknown) => void }) {
  const text = typeof value === "string" ? value : "";
  switch (field.type) {
    case "textarea": return <textarea aria-label={field.label} required={field.required} rows={field.rows ?? 4} maxLength={20000} className={textareaClass} value={text} onChange={event => onChange(event.target.value)} />;
    case "currency": return <CurrencyInput aria-label={field.label} value={text} onValueChange={onChange} />;
    case "checkbox": return <input type="checkbox" aria-label={field.label} className="size-4" checked={value === true} onChange={event => onChange(event.target.checked)} />;
    case "select": return <select aria-label={field.label} required={field.required} className={selectClass} value={text} onChange={event => onChange(event.target.value)}>{field.emptyLabel !== undefined && <option value="">{field.emptyLabel}</option>}{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
    case "reference": return <ReferenceInput field={field} value={value} onChange={onChange} />;
    case "attachments": return <AttachmentsField label={field.label} files={Array.isArray(value) ? value as CardAttachment[] : []} onChange={onChange} />;
    case "rows": return <RowsInput field={field} value={value} onChange={onChange} />;
    default: return <Input aria-label={field.label} name={field.name} required={field.required} type={field.type} min={field.type === "number" ? 0 : undefined} step={field.type === "number" ? "any" : undefined} placeholder={field.placeholder} maxLength={field.type === "number" ? undefined : 500} value={text} onChange={event => onChange(event.target.value)} />;
  }
}

export function FieldGrid({ fields, values, onChange }: { fields: FieldDef[]; values: FormValues; onChange: (name: string, value: unknown) => void }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{fields.map(field => {
    const wide = field.wide || ["textarea", "attachments", "rows"].includes(field.type) || (field.type === "reference" && field.multiple);
    const control = <FieldInput field={field} value={values[field.name]} onChange={value => onChange(field.name, value)} />;
    if (field.type === "checkbox") return <label key={field.name} className={`flex items-center gap-2 text-sm ${wide ? "sm:col-span-2" : ""}`}>{control}{field.label}</label>;
    if (field.type === "attachments") return <div key={field.name} className="sm:col-span-2">{control}</div>;
    const Wrapper = field.type === "reference" && field.multiple || field.type === "rows" ? "div" : "label";
    return <Wrapper key={field.name} className={`grid min-w-0 content-start gap-2 text-sm ${wide ? "sm:col-span-2" : ""}`}><span>{field.label}{field.required && " *"}</span>{control}{field.hint && <span className="text-xs text-muted-foreground">{field.hint}</span>}</Wrapper>;
  })}</div>;
}

const timestamp = (date: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));

export function RecordDialog({ title, description, fields, initial, record, submitLabel, validate, onSave, onClose, children }: {
  title: string; description: string; fields: FieldDef[]; initial: FormValues; record?: RecordMeta; submitLabel: string;
  validate?: (values: FormValues) => string; onSave: (values: FormValues) => void; onClose: () => void; children?: ReactNode;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
    const missing = fields.find(field => field.required && !trimmed[field.name]);
    const message = missing ? `Preencha o campo ${missing.label}.` : validate?.(trimmed) ?? "";
    if (message) { setError(message); return; }
    onSave(trimmed); onClose();
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-2xl"><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription>
    <form onSubmit={submit} className="space-y-5" noValidate>
      <FieldGrid fields={fields} values={values} onChange={(name, value) => setValues(previous => ({ ...previous, [name]: value }))} />
      {children}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"><div className="mr-auto basis-full space-y-1 text-xs text-muted-foreground sm:basis-auto">{record ? <p>Código {record.code}<br />Criado em <time dateTime={record.createdAt}>{timestamp(record.createdAt)}</time><br />Atualizado em <time dateTime={record.updatedAt}>{timestamp(record.updatedAt)}</time></p> : <p>Salvo na sua conta.</p>}</div><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">{submitLabel}</Button></footer>
    </form>
  </DialogContent></Dialog>;
}
