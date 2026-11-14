"use client";
import { useState } from "react";
import { RiAddLine, RiCheckboxLine, RiDeleteBinLine, RiFlag2Line, RiPriceTag3Line, RiTimeLine, RiChat3Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { newId, type CardExtras, type CardLabel } from "@/lib/boards/store";
import { today } from "@/lib/format/date";

// Etiquetas, prazo, prioridade, checklists, campos e comentários do cartão (Nodus: card-tools).
export const labelColors = [
  { value: "orange", label: "Laranja", color: "#f97316" }, { value: "blue", label: "Azul", color: "#2563eb" },
  { value: "green", label: "Verde", color: "#16a34a" }, { value: "purple", label: "Roxo", color: "#9333ea" }, { value: "red", label: "Vermelho", color: "#dc2626" },
] as const;
export const labelColor = (value: string) => labelColors.find(item => item.value === value)?.color ?? "#64748b";

/** Resumo exibido no cartão do quadro. */
export function CardBadges({ card }: { card: CardExtras & { completed?: boolean } }) {
  const items = card.checklists?.flatMap(list => list.items) ?? [];
  const done = items.filter(item => item.done).length;
  const late = !card.completed && !!card.due && card.due < today();
  return <>
    {!!card.labels?.length && <div className="mt-2 flex flex-wrap gap-1">{card.labels.map(label => <span key={label.id} className="px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ background: labelColor(label.color) }}>{label.name}</span>)}</div>}
    {(card.due || card.priority || items.length > 0 || !!card.comments?.length) && <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {card.priority === "high" && <span className="inline-flex items-center gap-1 font-medium text-destructive"><RiFlag2Line className="size-3" />Alta</span>}
      {card.due && <span className={`inline-flex items-center gap-1 ${late ? "font-medium text-destructive" : ""}`}><RiTimeLine className="size-3" />{new Date(`${card.due}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>}
      {items.length > 0 && <span className={`inline-flex items-center gap-1 ${done === items.length ? "text-green-600" : ""}`}><RiCheckboxLine className="size-3" />{done}/{items.length}</span>}
      {!!card.comments?.length && <span className="inline-flex items-center gap-1"><RiChat3Line className="size-3" />{card.comments.length}</span>}
    </div>}
  </>;
}

export function CardExtrasFields({ value, onChange }: { value: CardExtras; onChange: (patch: Partial<CardExtras>) => void }) {
  const [labelName, setLabelName] = useState("");
  const [labelTone, setLabelTone] = useState<CardLabel["color"]>("blue");
  const [comment, setComment] = useState("");
  const checklists = value.checklists ?? [];
  const fields = value.customFields ?? [];
  const setChecklist = (id: string, patch: Partial<NonNullable<CardExtras["checklists"]>[number]>) => onChange({ checklists: checklists.map(list => list.id === id ? { ...list, ...patch } : list) });
  return <div className="space-y-5">
    <section className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><RiPriceTag3Line className="size-4" />Etiquetas</h3>
      {!!value.labels?.length && <div className="flex flex-wrap gap-1.5">{value.labels.map(label => <span key={label.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white" style={{ background: labelColor(label.color) }}>{label.name}<button type="button" aria-label={`Remover etiqueta ${label.name}`} onClick={() => onChange({ labels: value.labels?.filter(item => item.id !== label.id) })}>×</button></span>)}</div>}
      <div className="flex flex-wrap items-end gap-2"><Field label="Nova etiqueta" className="min-w-40 flex-1"><Input maxLength={40} value={labelName} onChange={event => setLabelName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (labelName.trim()) { onChange({ labels: [...(value.labels ?? []), { id: newId(), name: labelName.trim(), color: labelTone }] }); setLabelName(""); } } }} /></Field>
        <Field label="Cor" className="w-32"><Select value={labelTone} options={labelColors} onChange={event => setLabelTone(event.target.value as CardLabel["color"])} /></Field>
        <Button type="button" variant="outline" size="sm" disabled={!labelName.trim() || (value.labels?.length ?? 0) >= 20} onClick={() => { onChange({ labels: [...(value.labels ?? []), { id: newId(), name: labelName.trim(), color: labelTone }] }); setLabelName(""); }}><RiAddLine />Adicionar</Button></div>
    </section>
    <section className="grid gap-4 sm:grid-cols-2">
      <Field label="Prazo"><Input type="date" value={value.due ?? ""} onChange={event => onChange({ due: event.target.value || undefined })} /></Field>
      <Field label="Prioridade"><Select value={value.priority ?? ""} options={[{ value: "", label: "Normal" }, { value: "high", label: "Alta" }]} onChange={event => onChange({ priority: event.target.value === "high" ? "high" : undefined })} /></Field>
    </section>
    <section className="space-y-3"><div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-semibold"><RiCheckboxLine className="size-4" />Checklists</h3><Button type="button" variant="outline" size="sm" disabled={checklists.length >= 10} onClick={() => onChange({ checklists: [...checklists, { id: newId(), title: "Checklist", items: [] }] })}><RiAddLine />Checklist</Button></div>
      {checklists.map(list => { const done = list.items.filter(item => item.done).length; return <div key={list.id} className="space-y-2 border p-3">
        <div className="flex items-center gap-2"><Input aria-label="Título da checklist" maxLength={120} value={list.title} onChange={event => setChecklist(list.id, { title: event.target.value })} /><span className="shrink-0 text-xs text-muted-foreground">{done}/{list.items.length}</span><Button type="button" variant="ghost" size="icon-sm" aria-label={`Excluir checklist ${list.title}`} onClick={() => onChange({ checklists: checklists.filter(item => item.id !== list.id) })}><RiDeleteBinLine /></Button></div>
        {list.items.length > 0 && <div className="h-1 bg-muted"><div className="h-1 bg-primary" style={{ width: `${(done / list.items.length) * 100}%` }} /></div>}
        <ul className="space-y-1">{list.items.map(item => <li key={item.id} className="flex items-center gap-2"><input type="checkbox" aria-label={`Concluir ${item.title}`} checked={item.done} onChange={event => setChecklist(list.id, { items: list.items.map(entry => entry.id === item.id ? { ...entry, done: event.target.checked } : entry) })} /><Input aria-label="Item" maxLength={300} className={item.done ? "text-muted-foreground line-through" : ""} value={item.title} onChange={event => setChecklist(list.id, { items: list.items.map(entry => entry.id === item.id ? { ...entry, title: event.target.value } : entry) })} /><Button type="button" variant="ghost" size="icon-xs" aria-label={`Remover ${item.title}`} onClick={() => setChecklist(list.id, { items: list.items.filter(entry => entry.id !== item.id) })}><RiDeleteBinLine /></Button></li>)}</ul>
        <Input aria-label={`Novo item em ${list.title}`} placeholder="Adicionar item e Enter" maxLength={300} onKeyDown={event => { if (event.key !== "Enter") return; event.preventDefault(); const title = event.currentTarget.value.trim(); if (!title) return; setChecklist(list.id, { items: [...list.items, { id: newId(), title, done: false }] }); event.currentTarget.value = ""; }} />
      </div>; })}
    </section>
    <section className="space-y-3"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Campos personalizados</h3><Button type="button" variant="outline" size="sm" disabled={fields.length >= 20} onClick={() => onChange({ customFields: [...fields, { id: newId(), name: "", type: "text", value: "" }] })}><RiAddLine />Campo</Button></div>
      {fields.map(field => <div key={field.id} className="grid items-end gap-2 sm:grid-cols-[1fr_8rem_1fr_auto]">
        <Field label="Nome"><Input maxLength={60} value={field.name} onChange={event => onChange({ customFields: fields.map(item => item.id === field.id ? { ...item, name: event.target.value } : item) })} /></Field>
        <Field label="Tipo"><Select value={field.type} options={[{ value: "text", label: "Texto" }, { value: "number", label: "Número" }, { value: "date", label: "Data" }]} onChange={event => onChange({ customFields: fields.map(item => item.id === field.id ? { ...item, type: event.target.value as "text" | "number" | "date", value: "" } : item) })} /></Field>
        <Field label="Valor"><Input type={field.type} maxLength={500} value={field.value} onChange={event => onChange({ customFields: fields.map(item => item.id === field.id ? { ...item, value: event.target.value } : item) })} /></Field>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover campo ${field.name}`} onClick={() => onChange({ customFields: fields.filter(item => item.id !== field.id) })}><RiDeleteBinLine /></Button>
      </div>)}
    </section>
    <section className="space-y-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><RiChat3Line className="size-4" />Comentários</h3>
      <div className="flex items-end gap-2"><Textarea aria-label="Novo comentário" rows={2} maxLength={2000} placeholder="Escreva um comentário" value={comment} onChange={event => setComment(event.target.value)} /><Button type="button" size="sm" disabled={!comment.trim()} onClick={() => { onChange({ comments: [{ id: newId(), text: comment.trim(), createdAt: new Date().toISOString() }, ...(value.comments ?? [])] }); setComment(""); }}>Comentar</Button></div>
      <ul className="space-y-2">{value.comments?.map(item => <li key={item.id} className="border-l-2 pl-3 text-sm"><p className="whitespace-pre-wrap break-words">{item.text}</p><p className="flex items-center gap-2 text-xs text-muted-foreground"><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time><button type="button" className="underline" onClick={() => onChange({ comments: value.comments?.filter(entry => entry.id !== item.id) })}>Excluir</button></p></li>)}</ul>
    </section>
  </div>;
}
