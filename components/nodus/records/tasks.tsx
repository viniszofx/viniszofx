"use client";
import { RecordsPage, formatDate, type RecordsConfig } from "@/components/records/records-page";
import { taskStore, type TaskFields } from "@/lib/nodus/stores";
import { fieldsOf } from "@/lib/records/store";
import { today } from "@/lib/format/date";

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

export function TasksPage() { return <RecordsPage config={tasksConfig} />; }
