"use client";
import { RecordsPage, type RecordsConfig } from "@/components/records/records-page";
import { requestStore, requestTypes, type RequestFields } from "@/lib/nodus/stores";
import { fieldsOf } from "@/lib/records/store";

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

export function RequestsPage() { return <RecordsPage config={requestsConfig} />; }
