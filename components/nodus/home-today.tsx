"use client";
import Link from "next/link";
import { postState, useOrgPosts } from "./mural-page";
import { journeyStore, orderStore, taskStore, todoStore } from "@/lib/nodus/stores";
import { useLookup } from "@/lib/records/references";
import { useModuleEnabled } from "@/lib/modules-context";

const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };

function Panel({ title, href, empty, items }: { title: string; href: string; empty: string; items: { id: string; text: string; detail?: string; alert?: boolean }[] }) {
  return <section className="min-w-0 border bg-card">
    <header className="flex items-center justify-between border-b px-4 py-2"><h3 className="text-sm font-semibold">{title}</h3><Link href={href} className="text-xs text-primary hover:underline">Ver tudo</Link></header>
    <ul className="divide-y">{items.slice(0, 5).map(item => <li key={item.id} className="px-4 py-2 text-sm"><p className={item.alert ? "text-destructive" : undefined}>{item.text}</p>{item.detail && <p className="line-clamp-2 text-xs text-muted-foreground">{item.detail}</p>}</li>)}
      {!items.length && <li className="px-4 py-3 text-xs text-muted-foreground">{empty}</li>}</ul>
  </section>;
}

export function HomeToday() {
  const enabled = useModuleEnabled();
  const { feed } = useOrgPosts();
  const tasks = taskStore.useRecords();
  const orders = orderStore.useRecords();
  const journeys = journeyStore.useRecords(enabled("field"));
  const todos = todoStore.useRecords();
  const lookup = useLookup();
  const day = today();
  const active = (feed?.posts ?? []).filter(post => postState(post).key === "active");
  const due = tasks.records.filter(task => !task.done && (task.dueDate ? task.dueDate <= day : task.startDate <= day)).sort((a, b) => (a.dueDate || day).localeCompare(b.dueDate || day));
  const running = orders.records.filter(order => !["done", "canceled"].includes(order.status) && order.startDate <= day && (!order.endDate || order.endDate >= day));
  const myTodos = todos.records.filter(todo => !todo.done && !!(todo.endDate || todo.startDate) && (todo.endDate || todo.startDate) <= day).sort((a, b) => (a.endDate || a.startDate).localeCompare(b.endDate || b.startDate));
  const open = journeys.records.filter(journey => !journey.events.some(event => event.type === "end"));
  return <section aria-labelledby="today" className="pt-7">
    <h2 id="today" className="mb-3 text-sm font-semibold">Hoje</h2>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {enabled("mural") && <Panel title="Mural" href="/dashboard/announcements" empty={feed ? "Nenhum aviso ativo." : "Carregando…"} items={active.map(item => ({ id: item.id, text: item.title, detail: item.body }))} />}
      {enabled("tasks") && <Panel title="Tarefas" href="/dashboard/tasks" empty={tasks.loaded ? "Nada pendente para hoje." : "Carregando…"} items={due.map(task => ({ id: task.id, text: task.title, detail: task.dueDate ? `Prazo ${new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}` : undefined, alert: !!task.dueDate && task.dueDate < day }))} />}
      {enabled("todos") && <Panel title="Meus to-dos" href="/dashboard/todos" empty={todos.loaded ? "Nenhum to-do para hoje." : "Carregando…"} items={myTodos.map(todo => ({ id: todo.id, text: todo.title, detail: todo.notes, alert: !!todo.endDate && todo.endDate < day }))} />}
      {enabled("orders") && <Panel title="Ordens em andamento" href="/dashboard/orders" empty={orders.loaded ? "Nenhuma ordem para hoje." : "Carregando…"} items={running.map(order => ({ id: order.id, text: `${order.code} · ${order.title}`, detail: lookup("clients", order.clientId) }))} />}
      {enabled("field") && <Panel title="Jornadas abertas" href="/dashboard/journeys" empty={journeys.loaded ? "Ninguém em campo agora." : "Carregando…"} items={open.map(journey => ({ id: journey.id, text: lookup("employees", journey.employeeId) || "Colaborador", detail: journey.destination || journey.events.at(-1)?.place }))} />}
    </div>
  </section>;
}
