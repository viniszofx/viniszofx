"use client";
import { useState } from "react";
import { Field, selectClass, textareaClass } from "@/components/ui/field";
import { RiAddLine as Plus, RiDeleteBinLine as Trash2, RiFileCopyLine as Copy, RiSettings3Line as Settings, RiWhatsappLine as WhatsApp } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogLayout } from "@/components/listing/catalog";
import { useReferenceOptions } from "@/lib/records/references";
import { newId } from "@/lib/records/store";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";

type Job = { id: string; number: string; clientId: string; client: string; location: string; description: string; employeeIds: string[]; otherTeam: string; vehicleId: string; vehicle: string };
const defaultClosing = "📌 Verifiquem os materiais necessários antes de sair\n📄 Peçam os projetos impressos com antecedência";
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const emptyJob = (): Job => ({ id: newId(), number: "", clientId: "", client: "", location: "", description: "", employeeIds: [], otherTeam: "", vehicleId: "", vehicle: "" });

function joinTeam(names: string[]) {
  if (!names.length) return "A definir";
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

export function formatAgenda(date: string, jobs: { place: string; description: string; team: string[]; car: string }[], closing: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(new Date(year, month - 1, day, 12));
  const label = `${weekday.charAt(0).toLocaleUpperCase("pt-BR")}${weekday.slice(1)}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  const blocks = jobs.map(job => `📍${job.place || "Local a definir"}\n👷🏻Fazer: ${job.description || "A definir"}\n👥 Equipe: ${joinTeam(job.team)}\n🚘 Carro: ${job.car || "A definir"}`);
  return [`📅 Agenda - ${label}`, ...blocks, closing.trim()].filter(Boolean).join("\n\n");
}

export function AgendaPage() {
  const clients = useReferenceOptions("clients");
  const employees = useReferenceOptions("employees");
  const vehicles = useReferenceOptions("vehicles");
  const [date, setDate] = useState(today);
  const [jobs, setJobs] = useState<Job[]>(() => [emptyJob()]);
  const [closing, setClosing] = useState(defaultClosing);
  const [editingClosing, setEditingClosing] = useState(false);
  const [result, setResult] = useState("");
  const update = (id: string, patch: Partial<Job>) => setJobs(previous => previous.map(job => job.id === id ? { ...job, ...patch } : job));
  const label = (options: { value: string; label: string }[], id: string) => options.find(option => option.value === id)?.label ?? "";

  function generate() {
    const filled = jobs.map(job => ({
      place: [job.number, job.clientId ? label(clients.options, job.clientId) : job.client, job.location].map(part => part.trim()).filter(Boolean).join(" - "),
      description: job.description.trim(),
      team: [...job.employeeIds.map(id => label(employees.options, id)).filter(Boolean), ...job.otherTeam.split(",").map(name => name.trim()).filter(Boolean)],
      car: job.vehicleId ? label(vehicles.options, job.vehicleId) : job.vehicle.trim(),
    }));
    if (filled.some(job => !job.place && !job.description)) return notifyError("Agenda incompleta", "Preencha ao menos o número, o cliente ou a descrição de cada obra.");
    setResult(formatAgenda(date, filled, closing.trim() || defaultClosing));
  }
  async function copy() {
    try { await navigator.clipboard.writeText(result); notifySuccess("Agenda copiada"); } catch { notifyError("Não foi possível copiar", "Selecione o texto e copie manualmente."); }
  }

  return <CatalogLayout section="Comunicação" title="Agenda para WhatsApp" description="Monte a mensagem do dia com obra, tarefa, equipe e carro de cada serviço.">
    <div className="flex flex-wrap items-end gap-3"><Field label="Data"><Input type="date" value={date} onChange={event => setDate(event.target.value)} /></Field>
      <Button variant="outline" aria-expanded={editingClosing} onClick={() => setEditingClosing(value => !value)}><Settings />Orientações</Button></div>
    {editingClosing && <Field label="Orientações finais da mensagem"><textarea className={textareaClass} rows={4} value={closing} onChange={event => setClosing(event.target.value)} /><span className="text-xs text-muted-foreground">Se ficar vazio, as orientações padrão são usadas.</span></Field>}
    <ol className="space-y-4">{jobs.map((job, index) => <li key={job.id} className="space-y-4 border p-4">
      <header className="flex items-center justify-between"><h2 className="text-sm font-semibold">Obra {index + 1}</h2>{jobs.length > 1 && <Button variant="ghost" size="icon-sm" aria-label={`Remover obra ${index + 1}`} onClick={() => setJobs(previous => previous.filter(item => item.id !== job.id))}><Trash2 /></Button>}</header>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Número"><Input value={job.number} onChange={event => update(job.id, { number: event.target.value })} /></Field>
        <Field label="Cliente"><select className={selectClass} value={job.clientId} onChange={event => update(job.id, { clientId: event.target.value })}><option value="">Digitar</option>{clients.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        {!job.clientId ? <Field label="Cliente (texto)"><Input value={job.client} onChange={event => update(job.id, { client: event.target.value })} /></Field> : <span />}
        <Field label="Local" className="sm:col-span-3"><Input value={job.location} onChange={event => update(job.id, { location: event.target.value })} /></Field>
        <Field label="Tarefa" className="sm:col-span-3"><textarea className={textareaClass} rows={2} value={job.description} onChange={event => update(job.id, { description: event.target.value })} /></Field>
        <div className="grid gap-1 text-sm sm:col-span-2"><span>Equipe</span><div className="flex max-h-32 flex-wrap gap-x-4 gap-y-1 overflow-y-auto border p-2">{employees.options.map(option => <label key={option.value} className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={job.employeeIds.includes(option.value)} onChange={event => update(job.id, { employeeIds: event.target.checked ? [...job.employeeIds, option.value] : job.employeeIds.filter(id => id !== option.value) })} />{option.label}</label>)}{!employees.options.length && <span className="text-xs text-muted-foreground">Nenhum colaborador cadastrado.</span>}</div></div>
        <label className="grid content-start gap-1 text-sm">Outros (separados por vírgula)<Input value={job.otherTeam} onChange={event => update(job.id, { otherTeam: event.target.value })} /></label>
        <Field label="Carro"><select className={selectClass} value={job.vehicleId} onChange={event => update(job.id, { vehicleId: event.target.value })}><option value="">Digitar</option>{vehicles.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        {!job.vehicleId && <Field label="Carro (texto)"><Input value={job.vehicle} onChange={event => update(job.id, { vehicle: event.target.value })} /></Field>}
      </div>
    </li>)}</ol>
    <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setJobs(previous => [...previous, emptyJob()])}><Plus />Adicionar obra</Button><Button onClick={generate}><WhatsApp />Gerar texto</Button></div>
    {result && <section className="space-y-2" aria-label="Mensagem gerada"><textarea readOnly className={`${textareaClass} font-mono`} rows={Math.min(30, result.split("\n").length + 1)} value={result} />
      <div className="flex flex-wrap gap-2"><Button onClick={() => void copy()}><Copy />Copiar</Button><a className={buttonVariants({ variant: "outline" })} href={`https://wa.me/?text=${encodeURIComponent(result)}`} target="_blank" rel="noreferrer"><WhatsApp />Abrir no WhatsApp</a></div></section>}
  </CatalogLayout>;
}
