"use client";
import { RecordsPage, formatDate, type RecordsConfig } from "@/components/records/records-page";
import { orderStatuses, orderStore, serviceColor, serviceLabel, services, type OrderFields } from "@/lib/nodus/stores";
import { OrderPrintButton } from "../order-print";
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

export function OrdersPage({ initialId }: { initialId?: string }) { return <RecordsPage config={ordersConfig} initialId={initialId} />; }
