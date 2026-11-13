"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RiAddLine as Plus, RiArrowLeftSLine as Prev, RiArrowRightSLine as Next, RiDeleteBinLine as Trash2, RiPrinterLine } from "@remixicon/react";
import { printElement } from "@/lib/browser/print";
import { useCompany } from "@/lib/nodus/company";
import { useModuleEnabled } from "@/lib/modules-context";
import { useEmployees } from "@/lib/employees/store";
import { useVehicles } from "@/lib/fleet/store";
import { useReservations } from "@/lib/reservations/store";
import { useClients } from "@/lib/clients/store";
import { tripSummary } from "@/lib/trips/info";
import { serviceLabel } from "@/lib/nodus/stores";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CatalogLayout } from "@/components/listing/catalog";
import { RecordDialog, type FieldDef, type FormValues } from "@/components/records/record-form";
import { eventStore, orderStore, serviceColor, services, taskStore, type CalendarEvent, type EventFields } from "@/lib/nodus/stores";
import { useTrips } from "@/lib/trips/store";
import { fieldsOf } from "@/lib/records/store";
import { cn } from "@/lib/utils";

type Entry = { id: string; title: string; start: string; end: string; color: string; kind: string; href?: string; event?: CalendarEvent; service?: string; details?: { label: string; value: string }[] };
const fields: FieldDef[] = [
  { name: "title", label: "Título", type: "text", required: true, wide: true },
  { name: "service", label: "Serviço", type: "select", options: services },
  { name: "location", label: "Local", type: "text" },
  { name: "start", label: "Início", type: "datetime-local", required: true },
  { name: "end", label: "Fim", type: "datetime-local" },
  { name: "employeeIds", label: "Participantes", type: "reference", source: "employees", multiple: true },
  { name: "description", label: "Descrição", type: "textarea", rows: 3 },
];
const pad = (value: number) => String(value).padStart(2, "0");
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarPage() {
  const events = eventStore.useRecords();
  const orders = orderStore.useRecords();
  const tasks = taskStore.useRecords();
  const { trips } = useTrips();
  useCompany();
  const enabled = useModuleEnabled();
  const { employees } = useEmployees(); const { vehicles } = useVehicles(); const { reservations } = useReservations(); const { clients } = useClients();
  const pdf = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [view, setView] = useState<"month" | "agenda">("month");
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const [editing, setEditing] = useState<CalendarEvent | "new" | null>(null);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);

  const entries = useMemo<Entry[]>(() => [
    ...events.records.map(event => ({ id: event.id, title: event.title, start: event.start.slice(0, 10), end: (event.end || event.start).slice(0, 10), color: serviceColor(event.service), kind: "Evento", event, service: event.service, details: [{ label: "Horário", value: event.start.includes("T") ? event.start.slice(11, 16) + (event.end?.includes("T") ? "–" + event.end.slice(11, 16) : "") : "" }, { label: "Local", value: event.location }, { label: "Descrição", value: event.description }] })),
    ...trips.filter(trip => enabled("trips") && trip.departureDate).map(trip => ({ id: trip.id, title: `Viagem ${trip.code}${trip.description ? ` · ${trip.description}` : ""}`, start: trip.departureDate!.slice(0, 10), end: (trip.returnDate || trip.departureDate!).slice(0, 10), color: serviceColor(trip.service || "trip"), kind: "Viagem", href: `/dashboard/trip/${trip.id}`, service: trip.service || "trip", details: (() => { const info = tripSummary(trip, { employees, vehicles, reservations }); return [{ label: "Cliente", value: clients.find(client => client.id === trip.clientId)?.name ?? "" }, { label: "Destino", value: info.destinations.join(", ") }, { label: "Equipe", value: info.team.join(", ") }, { label: "Transporte", value: [info.transport, info.vehicle].filter(Boolean).join(" · ") }, { label: "Hospedagem", value: trip.needsLodging ? info.lodging || "A definir" : "" }]; })() })),
    ...orders.records.filter(order => enabled("orders") && order.startDate && order.status !== "canceled").map(order => ({ id: order.id, title: `OS ${order.code} · ${order.title}`, start: order.startDate, end: order.endDate || order.startDate, color: serviceColor(order.service), kind: "Ordem", href: `/dashboard/orders?order=${order.id}`, service: order.service, details: [{ label: "Cliente", value: clients.find(client => client.id === order.clientId)?.name ?? "" }, { label: "Equipe", value: order.employeeIds.map(id => employees.find(employee => employee.id === id)?.name).filter(Boolean).join(", ") }] })),
    ...tasks.records.filter(task => enabled("tasks") && task.dueDate && !task.done).map(task => ({ id: task.id, title: `Tarefa · ${task.title}`, start: task.dueDate, end: task.dueDate, color: "#0ea5e9", kind: "Tarefa", href: "/dashboard/tasks" })),
  ].filter(entry => !hidden.includes(entry.kind)), [events.records, trips, orders.records, tasks.records, hidden, employees, vehicles, reservations, clients, enabled]);

  const on = (key: string) => entries.filter(entry => entry.start <= key && key <= entry.end);
  const first = new Date(month); first.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => { const date = new Date(first); date.setDate(first.getDate() + index); return date; });
  const monthEnd = dayKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const agenda = entries.filter(entry => entry.end >= dayKey(month) && entry.start <= monthEnd).sort((a, b) => a.start.localeCompare(b.start));
  const monthTitle = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(month);
  const agendaDays = Array.from({ length: Number(monthEnd.slice(8)) }, (_, index) => dayKey(new Date(month.getFullYear(), month.getMonth(), index + 1))).map(key => ({ key, list: on(key).filter(entry => entry.kind !== "Tarefa") })).filter(day => day.list.length);
  const current = editing && editing !== "new" ? editing : undefined;
  const open = (entry: Entry) => entry.event ? setEditing(entry.event) : undefined;
  const label = (entry: Entry) => <span className="flex min-w-0 items-center gap-1.5"><span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} /><span className="truncate">{entry.title}</span></span>;
  const item = (entry: Entry, compact = false) => entry.href
    ? <Link key={entry.kind + entry.id} href={entry.href} className={cn("block w-full text-left hover:underline", compact ? "text-[11px]" : "text-sm")}>{label(entry)}</Link>
    : <button key={entry.kind + entry.id} type="button" onClick={() => open(entry)} className={cn("block w-full text-left hover:underline", compact ? "text-[11px]" : "text-sm")}>{label(entry)}</button>;

  return <CatalogLayout section="Operação" title="Calendário" description="Eventos, viagens, ordens e tarefas por data, nas cores de cada serviço." action={<Button disabled={!events.loaded} onClick={() => setEditing("new")}><Plus />Novo evento</Button>}>
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon-sm" aria-label="Mês anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Prev /></Button>
      <h2 className="min-w-40 flex-1 text-center font-semibold first-letter:uppercase sm:flex-none">{monthTitle}</h2>
      <Button variant="outline" size="icon-sm" aria-label="Próximo mês" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Next /></Button>
      <Button variant="ghost" size="sm" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(dayKey(now)); }}>Hoje</Button>
      <Button variant="outline" size="sm" className="sm:ml-auto" onClick={() => printElement(`Agenda ${monthTitle}`, pdf.current)}><RiPrinterLine />Exportar PDF</Button><div><Segmented label="Visualização" value={view} onChange={setView} items={[{ value: "month", label: "Mês" }, { value: "agenda", label: "Agenda" }]} /></div>
    </div>
    <div className="flex flex-wrap gap-3 text-xs" role="group" aria-label="Filtrar tipos">{["Evento", "Viagem", "Ordem", "Tarefa"].map(kind => <label key={kind} className="flex items-center gap-1.5"><input type="checkbox" checked={!hidden.includes(kind)} onChange={event => setHidden(previous => event.target.checked ? previous.filter(item => item !== kind) : [...previous, kind])} />{kind}s</label>)}</div>
    {view === "month" ? <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="grid grid-cols-7 border-l border-t text-xs">{weekdays.map(day => <div key={day} className="border-b border-r bg-muted/40 px-2 py-1 font-medium">{day}</div>)}
        {days.map(date => { const key = dayKey(date); const list = on(key); const outside = date.getMonth() !== month.getMonth();
          return <div key={key} role="button" tabIndex={0} aria-label={`${date.toLocaleDateString("pt-BR")}: ${list.length} itens`} onClick={() => setSelected(key)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(key); } }}
            className={cn("min-h-14 cursor-pointer space-y-1 border-b border-r p-1 sm:min-h-24 sm:p-1.5 outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring", outside && "bg-muted/20 text-muted-foreground", selected === key && "bg-primary/5 ring-1 ring-primary ring-inset")}>
            <span className={cn("inline-grid size-6 place-items-center", key === dayKey(new Date()) && "bg-primary text-primary-foreground")}>{date.getDate()}</span>
            {list.length > 0 && <span className="flex gap-0.5 sm:hidden" aria-hidden="true">{list.slice(0, 4).map(entry => <span key={entry.kind + entry.id} className="size-1.5 rounded-full" style={{ background: entry.color }} />)}</span>}
            <div className="hidden space-y-1 sm:block">{list.slice(0, 3).map(entry => <div key={entry.kind + entry.id} onClick={event => event.stopPropagation()}>{item(entry, true)}</div>)}
            {list.length > 3 && <span className="text-[11px] text-muted-foreground">+{list.length - 3}</span>}</div>
          </div>; })}
      </div>
      <aside className="space-y-3 border p-4" aria-label="Dia selecionado"><h3 className="font-semibold">{new Date(`${selected}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</h3>
        {on(selected).length ? on(selected).map(entry => <div key={entry.kind + entry.id} className="space-y-0.5 border-l-2 pl-2" style={{ borderColor: entry.color }}><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{entry.kind}</p>{item(entry)}</div>) : <p className="text-sm text-muted-foreground">Nada agendado.</p>}
        <Button variant="outline" size="sm" className="w-full" onClick={() => setEditing("new")}><Plus />Evento neste dia</Button>
      </aside>
    </div> : <ol className="divide-y border">{agenda.length ? agenda.map(entry => <li key={entry.kind + entry.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><time className="w-28 shrink-0 text-xs text-muted-foreground">{new Date(`${entry.start}T12:00:00`).toLocaleDateString("pt-BR")}{entry.end !== entry.start && ` – ${new Date(`${entry.end}T12:00:00`).toLocaleDateString("pt-BR")}`}</time><span className="w-16 text-[10px] uppercase tracking-wider text-muted-foreground">{entry.kind}</span><div className="min-w-0 flex-1">{item(entry)}</div>{entry.event && <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${entry.title}`} onClick={() => setDeleting(entry.event!)}><Trash2 /></Button>}</li>) : <li className="px-4 py-6 text-sm text-muted-foreground">Nada neste mês.</li>}</ol>}
    <div ref={pdf} hidden><h1>Agenda · {monthTitle}</h1><p className="muted">Eventos, viagens e ordens do mês, dia a dia. Tarefas ficam de fora.</p>{!agendaDays.length && <p>Nada agendado neste mês.</p>}{agendaDays.map(day => <section key={day.key} className="day"><h2>{new Date(`${day.key}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</h2><ul>{day.list.map(entry => <li key={entry.kind + entry.id}><span>{entry.kind}{entry.end !== entry.start ? ` · até ${new Date(`${entry.end}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}</span><div><strong>{entry.title}</strong>{entry.service && <span className="tag">{serviceLabel(entry.service)}</span>}{entry.details?.some(detail => detail.value) && <dl>{entry.details.filter(detail => detail.value).map(detail => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>}</div></li>)}</ul></section>)}</div>
    {editing && <RecordDialog key={current?.id ?? "new"} title={current ? "Editar evento" : "Novo evento"} description="Eventos aparecem no calendário com a cor do serviço." fields={fields} record={current} submitLabel="Salvar evento"
      initial={(current ? { ...current } : { title: "", service: "installation", start: `${selected}T08:00`, end: "", location: "", description: "", employeeIds: [] }) as FormValues}
      validate={values => values.end && String(values.end) < String(values.start) ? "O fim deve ser posterior ao início." : ""}
      onSave={values => eventStore.save(fieldsOf<EventFields>(values), current?.id)} onClose={() => setEditing(null)}>
      {current && <Button type="button" variant="destructive" size="sm" onClick={() => { setDeleting(current); setEditing(null); }}><Trash2 />Excluir evento</Button>}
    </RecordDialog>}
    {deleting && <ConfirmDialog title="Excluir evento?" description={`${deleting.title} será removido do calendário.`} onConfirm={() => eventStore.remove(deleting.id)} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
