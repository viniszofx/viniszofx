"use client";
import { RecordsPage, formatDate, type RecordsConfig } from "@/components/records/records-page";
import { formatBRL } from "@/lib/format/currency";
import {
  announcementState, announcementStore, hotelStore, mileageCosts, mileageStore, orderStatuses, orderStore, requestStore, requestTypes, serviceColor, serviceLabel, services, taskStore,
  type AnnouncementFields, type HotelFields, type MileageFields, type OrderFields, type RequestFields, type TaskFields,
} from "@/lib/nodus/stores";
import { fieldsOf } from "@/lib/records/store";
import { OrderPrintButton } from "./order-print";
import { today } from "@/lib/format/date";

const statusColor: Record<OrderFields["status"], string> = { open: "#2563eb", scheduled: "#7c3aed", in_progress: "#f97316", done: "#16a34a", canceled: "#6b7280" };

export const ordersConfig: RecordsConfig<OrderFields> = {
  store: orderStore, section: "Operação", title: "Ordens de serviço", description: "Ordens com cliente, serviço, equipe, viagem e materiais.",
  singular: "ordem", newLabel: "Nova ordem", submitLabel: "Salvar ordem", emptyText: "Crie a primeira ordem de serviço.",
  empty: () => ({ title: "", status: "open", clientId: "", service: "installation", employeeIds: [], tripId: "", releaseEmployeeId: "", startDate: today(), endDate: "", execution: "", materials: [], attachments: [], notes: "" }),
  fields: [
    { name: "title", label: "Título", type: "text", required: true, wide: true },
    { name: "status", label: "Situação", type: "select", options: orderStatuses },
    { name: "service", label: "Serviço", type: "select", options: services },
    { name: "clientId", label: "Cliente", type: "reference", source: "clients" },
    { name: "tripId", label: "Viagem vinculada", type: "reference", source: "trips" },
    { name: "startDate", label: "Início", type: "date" },
    { name: "endDate", label: "Término", type: "date" },
    { name: "releaseEmployeeId", label: "Responsável pela liberação", type: "reference", source: "employees" },
    { name: "employeeIds", label: "Equipe", type: "reference", source: "employees", multiple: true },
    { name: "execution", label: "Execução", type: "textarea" },
    { name: "materials", label: "Materiais", type: "rows", addLabel: "Adicionar material", columns: [{ name: "quantity", label: "Qtd.", type: "number", width: "5rem" }, { name: "name", label: "Material" }, { name: "description", label: "Descrição" }, { name: "notes", label: "Observações" }] },
    { name: "notes", label: "Observações", type: "textarea", rows: 3 },
    { name: "attachments", label: "Anexos", type: "attachments" },
  ],
  validate: values => values.endDate && values.startDate && String(values.endDate) < String(values.startDate) ? "O término deve ser igual ou posterior ao início." : "",
  card: (order, lookup) => ({
    title: order.title, subtitle: lookup("clients", order.clientId) || "Sem cliente", accent: serviceColor(order.service),
    badge: { label: orderStatuses.find(status => status.value === order.status)?.label ?? "", color: statusColor[order.status] },
    lines: [serviceLabel(order.service), order.startDate && `Início ${formatDate(order.startDate)}${order.endDate ? ` · término ${formatDate(order.endDate)}` : ""}`,
      order.employeeIds?.length > 0 && `Equipe: ${order.employeeIds.map(id => lookup("employees", id)).filter(Boolean).join(", ")}`,
      order.materials?.length > 0 && `${order.materials.length} ${order.materials.length === 1 ? "material" : "materiais"}`],
  }),
  searchText: (order, lookup) => [order.code, order.title, order.execution, order.notes, serviceLabel(order.service), lookup("clients", order.clientId), ...order.materials.map(item => item.name)],
  sort: (a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""),
  filter: { label: "Situação", options: [...orderStatuses], test: (order, value) => order.status === value },
  cardActions: order => <OrderPrintButton order={order} />,
};

export const tasksConfig: RecordsConfig<TaskFields> = {
  store: taskStore, section: "Operação", title: "Tarefas", description: "Tarefas com período, responsável e conclusão.",
  singular: "tarefa", newLabel: "Nova tarefa", submitLabel: "Salvar tarefa", emptyText: "Crie a primeira tarefa.",
  empty: () => ({ title: "", description: "", startDate: today(), dueDate: "", done: false, employeeId: "", clientId: "" }),
  fields: [
    { name: "title", label: "Título", type: "text", required: true, wide: true },
    { name: "startDate", label: "Início", type: "date" },
    { name: "dueDate", label: "Prazo", type: "date" },
    { name: "employeeId", label: "Responsável", type: "reference", source: "employees" },
    { name: "clientId", label: "Cliente", type: "reference", source: "clients" },
    { name: "description", label: "Descrição", type: "textarea", hint: "Links começando com http viram clicáveis no card." },
    { name: "done", label: "Concluída", type: "checkbox" },
  ],
  validate: values => values.dueDate && values.startDate && String(values.dueDate) < String(values.startDate) ? "O prazo deve ser igual ou posterior ao início." : "",
  card: task => {
    const late = !task.done && task.dueDate && task.dueDate < today();
    return {
      title: task.title, accent: task.done ? "#16a34a" : late ? "#dc2626" : undefined,
      badge: task.done ? { label: "Concluída", color: "#16a34a" } : late ? { label: "Atrasada", color: "#dc2626" } : { label: "Aberta" },
      lines: [task.dueDate && `Prazo ${formatDate(task.dueDate)}`],
      body: task.description ? <p className="line-clamp-3 whitespace-pre-line break-words text-xs text-muted-foreground">{task.description.split(/(https?:\/\/\S+)/g).map((part, index) => /^https?:\/\//.test(part) ? <a key={index} href={part} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()} className="text-primary underline">{part}</a> : part)}</p> : undefined,
    };
  },
  searchText: (task, lookup) => [task.title, task.description, lookup("employees", task.employeeId), lookup("clients", task.clientId)],
  sort: (a, b) => Number(a.done) - Number(b.done) || (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
  filter: { label: "Situação", options: [{ value: "open", label: "Abertas" }, { value: "late", label: "Atrasadas" }, { value: "done", label: "Concluídas" }], test: (task, value) => value === "done" ? task.done : value === "late" ? !task.done && !!task.dueDate && task.dueDate < today() : !task.done },
  quickAction: task => ({ label: task.done ? "Reabrir" : "Concluir", run: () => taskStore.save({ ...fieldsOf(task), done: !task.done }, task.id) }),
};

export const hotelsConfig: RecordsConfig<HotelFields> = {
  store: hotelStore, section: "Cadastros", title: "Hotéis", description: "Hotéis usados nas hospedagens das viagens.",
  singular: "hotel", newLabel: "Novo hotel", submitLabel: "Salvar hotel", emptyText: "Cadastre o primeiro hotel.",
  empty: () => ({ name: "", phone: "", email: "", address: "", city: "", dailyRate: "", notes: "" }),
  fields: [
    { name: "name", label: "Nome", type: "text", required: true, wide: true },
    { name: "phone", label: "Telefone", type: "tel" }, { name: "email", label: "E-mail", type: "email" },
    { name: "city", label: "Cidade", type: "text" }, { name: "dailyRate", label: "Diária", type: "currency" },
    { name: "address", label: "Endereço", type: "text", wide: true }, { name: "notes", label: "Observações", type: "textarea", rows: 3 },
  ],
  card: hotel => ({ title: hotel.name, subtitle: hotel.city, lines: [hotel.phone, hotel.email, hotel.dailyRate && `Diária ${formatBRL(hotel.dailyRate)}`] }),
  searchText: hotel => [hotel.code, hotel.name, hotel.city, hotel.address, hotel.phone, hotel.email, hotel.notes],
  sort: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
};

const kmDriven = (entry: MileageFields) => { const initial = Number(entry.initialKm); const final = Number(entry.finalKm); return entry.initialKm && entry.finalKm && final >= initial ? final - initial : null; };
const costOf = (entry: MileageFields, name: (typeof mileageCosts)[number]["name"]) => Number(entry[name]) || 0;
const totalCost = (entry: MileageFields) => mileageCosts.reduce((sum, field) => sum + costOf(entry, field.name), 0);
/** KM final vazio: usa o KM inicial do próximo lançamento do mesmo carro. */
const withInferredKm = (entry: MileageFields) => {
  if (entry.finalKm) return entry;
  const next = mileageStore.current().filter(item => item.vehicleId === entry.vehicleId && item.date > entry.date).sort((a, b) => a.date.localeCompare(b.date))[0];
  return next?.initialKm ? { ...entry, finalKm: next.initialKm } : entry;
};
// O mesmo trecho lançado para vários clientes (mesmo carro, dia e KM) conta uma vez no total.
const totalKm = (entries: MileageFields[]) => {
  const trips = new Map<string, number>();
  entries.forEach((entry, index) => { const inferred = withInferredKm(entry); const km = kmDriven(inferred); if (km !== null) trips.set(entry.vehicleId ? `${entry.date}|${entry.vehicleId}|${entry.initialKm}|${inferred.finalKm}` : String(index), km); });
  return [...trips.values()].reduce((sum, km) => sum + km, 0);
};

function MileageSummary({ entries }: { entries: MileageFields[] }) {
  const km = totalKm(entries); const total = entries.reduce((sum, entry) => sum + totalCost(entry), 0);
  const tiles = [{ label: "KM rodados", value: `${km.toLocaleString("pt-BR")} km` }, { label: "Custo total", value: formatBRL(total.toFixed(2)) },
    ...mileageCosts.map(field => ({ label: field.label, value: formatBRL(entries.reduce((sum, entry) => sum + costOf(entry, field.name), 0).toFixed(2)) })),
    ...(km > 0 && total > 0 ? [{ label: "Custo por km", value: formatBRL((total / km).toFixed(2)) }] : [])];
  return <dl className="grid grid-cols-2 gap-px overflow-hidden border bg-border sm:grid-cols-4 xl:grid-cols-8">{tiles.map(tile => <div key={tile.label} className="bg-card px-3 py-2.5"><dt className="text-[11px] text-muted-foreground">{tile.label}</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{tile.value}</dd></div>)}</dl>;
}

export const mileageConfig: RecordsConfig<MileageFields> = {
  store: mileageStore, section: "Frota", title: "Lançamentos de KM", description: "Quilometragem diária por carro, com motorista, passageiros e custos.",
  singular: "lançamento", newLabel: "Novo lançamento", submitLabel: "Salvar lançamento", emptyText: "Registre o primeiro lançamento de KM.",
  empty: () => ({ date: today(), vehicleId: "", driverId: "", passengerIds: [], clientId: "", tripId: "", initialKm: "", finalKm: "", fuelCost: "", tollCost: "", foodCost: "", hotelCost: "", otherCost: "", notes: "" }),
  fields: [
    { name: "date", label: "Data", type: "date", required: true }, { name: "vehicleId", label: "Carro", type: "reference", source: "vehicles", required: true },
    { name: "driverId", label: "Motorista", type: "reference", source: "employees" }, { name: "clientId", label: "Cliente", type: "reference", source: "clients" },
    { name: "tripId", label: "Viagem", type: "reference", source: "trips" }, { name: "initialKm", label: "KM inicial", type: "number" },
    { name: "finalKm", label: "KM final", type: "number", hint: "Se ficar vazio, usa o KM inicial do próximo lançamento do mesmo carro." },
    { name: "passengerIds", label: "Passageiros", type: "reference", source: "employees", multiple: true },
    ...mileageCosts.map(field => ({ name: field.name, label: field.label, type: "currency" as const })),
    { name: "notes", label: "Observações", type: "textarea", rows: 3 },
  ],
  validate: values => values.initialKm && values.finalKm && Number(values.finalKm) < Number(values.initialKm) ? "O KM final não pode ser menor que o inicial." : "",
  card: (entry, lookup) => {
    const inferred = withInferredKm(entry);
    const km = kmDriven(inferred); const cost = totalCost(entry);
    return { title: lookup("vehicles", entry.vehicleId) || "Carro não informado", subtitle: formatDate(entry.date),
      badge: km !== null ? { label: `${km.toLocaleString("pt-BR")} km${inferred !== entry ? "*" : ""}` } : undefined,
      lines: [lookup("employees", entry.driverId) && `Motorista: ${lookup("employees", entry.driverId)}`, lookup("clients", entry.clientId) && `Cliente: ${lookup("clients", entry.clientId)}`,
        entry.passengerIds?.length > 0 && `${entry.passengerIds.length} passageiro(s)`, cost > 0 && `Custos ${formatBRL(cost.toFixed(2))}: ${mileageCosts.filter(field => costOf(entry, field.name) > 0).map(field => field.label.toLocaleLowerCase("pt-BR")).join(", ")}`, inferred !== entry && "* KM final inferido do próximo lançamento"] };
  },
  searchText: (entry, lookup) => [entry.code, entry.notes, lookup("vehicles", entry.vehicleId), lookup("employees", entry.driverId), lookup("clients", entry.clientId)],
  sort: (a, b) => b.date.localeCompare(a.date),
  filter: {
    label: "Carro",
    options: (entries, lookup) => [...new Set(entries.map(entry => entry.vehicleId).filter(Boolean))].map(id => ({ value: id, label: lookup("vehicles", id) || "Carro removido" })).sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    test: (entry, value) => entry.vehicleId === value,
  },
  summary: entries => <MileageSummary entries={entries} />,
};

export const announcementsConfig: RecordsConfig<AnnouncementFields> = {
  store: announcementStore, section: "Comunicação", title: "Mural", description: "Avisos com rascunho, publicação programada e prazo de exibição.",
  singular: "aviso", newLabel: "Novo aviso", submitLabel: "Salvar aviso", emptyText: "Publique o primeiro aviso.",
  empty: () => ({ title: "", body: "", status: "published", publishAt: "", expiresAt: "", cover: [] }),
  fields: [
    { name: "title", label: "Título", type: "text", required: true, wide: true },
    { name: "status", label: "Situação", type: "select", options: [{ value: "published", label: "Publicar" }, { value: "draft", label: "Rascunho" }] },
    { name: "publishAt", label: "Publicar em", type: "datetime-local", hint: "Vazio publica imediatamente." },
    { name: "expiresAt", label: "Retirar do mural em", type: "datetime-local" },
    { name: "body", label: "Mensagem", type: "textarea", rows: 6 },
    { name: "cover", label: "Capa", type: "attachments" },
  ],
  validate: values => values.publishAt && values.expiresAt && String(values.expiresAt) <= String(values.publishAt) ? "O prazo deve ser posterior à publicação." : "",
  card: item => { const state = announcementState(item); return { title: item.title, badge: { label: state.label, color: state.key === "active" ? "#16a34a" : undefined }, lines: [item.publishAt && `Publicação ${formatDate(item.publishAt)}`, item.expiresAt && `Até ${formatDate(item.expiresAt)}`], body: item.body ? <p className="line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">{item.body}</p> : undefined }; },
  searchText: item => [item.title, item.body],
  filter: { label: "Situação", options: [{ value: "active", label: "No mural" }, { value: "scheduled", label: "Programados" }, { value: "draft", label: "Rascunhos" }, { value: "expired", label: "Encerrados" }], test: (item, value) => announcementState(item).key === value },
};

export const requestsConfig: RecordsConfig<RequestFields> = {
  store: requestStore, section: "Workspace", title: "Solicitações", description: "Pedidos de materiais, equipamentos, documentos, liberações e atualizações.",
  singular: "solicitação", newLabel: "Nova solicitação", submitLabel: "Salvar solicitação", emptyText: "Crie a primeira solicitação.",
  empty: () => ({ title: "", type: "materials", status: "open", description: "", todos: [], orderId: "", attachments: [] }),
  fields: [
    { name: "title", label: "Título", type: "text", required: true, wide: true },
    { name: "type", label: "Tipo", type: "select", options: requestTypes },
    { name: "orderId", label: "Ordem relacionada", type: "reference", source: "orders" },
    { name: "description", label: "Descrição", type: "textarea", hint: "Use os to-dos abaixo para itens que precisam ser conferidos." },
    { name: "todos", label: "To-dos", type: "rows", addLabel: "Adicionar to-do", columns: [{ name: "done", label: "Feito", type: "checkbox", width: "3rem" }, { name: "text", label: "Item" }] },
    { name: "status", label: "Situação", type: "select", options: [{ value: "open", label: "Aberta" }, { value: "done", label: "Concluída" }] },
    { name: "attachments", label: "Anexos", type: "attachments" },
  ],
  card: item => {
    const done = item.todos?.filter(todo => todo.done).length ?? 0;
    return { title: item.title, subtitle: requestTypes.find(type => type.value === item.type)?.label, badge: item.status === "done" ? { label: "Concluída", color: "#16a34a" } : { label: "Aberta" },
      lines: [item.todos?.length > 0 && `${done}/${item.todos.length} to-dos concluídos`, item.attachments?.length > 0 && `${item.attachments.length} anexo(s)`] };
  },
  searchText: (item, lookup) => [item.code, item.title, item.description, lookup("orders", item.orderId), ...item.todos.map(todo => todo.text)],
  filter: { label: "Situação", options: [{ value: "open", label: "Abertas" }, { value: "done", label: "Concluídas" }], test: (item, value) => item.status === value },
  quickAction: item => item.status === "done" ? null : { label: "Concluir", run: () => requestStore.save({ ...fieldsOf(item), status: "done" }, item.id) },
};

export function OrdersPage({ initialId }: { initialId?: string }) { return <RecordsPage config={ordersConfig} initialId={initialId} />; }
export function TasksPage() { return <RecordsPage config={tasksConfig} />; }
export function HotelsPage() { return <RecordsPage config={hotelsConfig} />; }
export function MileagePage() { return <RecordsPage config={mileageConfig} />; }
export function AnnouncementsPage() { return <RecordsPage config={announcementsConfig} />; }
export function RequestsPage() { return <RecordsPage config={requestsConfig} />; }
