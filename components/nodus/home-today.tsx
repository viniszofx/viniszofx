"use client";
import Link from "next/link";
import { postState, useOrgPosts, type OrgPost } from "./mural-page";
import { eventStore, journeyStore, orderStore, taskStore, todoStore } from "@/lib/nodus/stores";
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

/** Avisos ativos em cartões lado a lado (rolagem lateral no celular). */
function MuralCarousel({ posts }: { posts: OrgPost[] }) {
  return <section aria-labelledby="mural-today" className="min-w-0">
    <div className="mb-2 flex items-center justify-between"><h3 id="mural-today" className="text-sm font-semibold">Mural</h3><Link href="/dashboard/announcements" className="text-xs text-primary hover:underline">Ver tudo</Link></div>
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{posts.slice(0, 8).map(post => <li key={post.id} className="w-72 shrink-0 snap-start sm:w-80">
      <Link href="/dashboard/announcements" className="flex h-full flex-col overflow-hidden border bg-card transition-colors hover:border-primary/40">
        {post.cover ? <img src={post.cover} alt="" loading="lazy" className="aspect-[2/1] w-full object-cover" /> : <div className="aspect-[2/1] w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" aria-hidden="true" />}
        <div className="flex flex-1 flex-col gap-1 p-3"><p className="line-clamp-2 text-sm font-semibold">{post.title}</p>{post.body && <p className="line-clamp-2 text-xs text-muted-foreground">{post.body}</p>}
          <p className="mt-auto pt-1 text-[11px] text-muted-foreground">{post.authorName}{post.poll && " · enquete"}{post.poll && !post.poll.mine.length && <span className="ml-1 font-medium text-primary">vote</span>}</p></div>
      </Link>
    </li>)}</ul>
  </section>;
}

const greeting = () => { const hour = new Date().getHours(); return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"; };
const eventTime = (value: string) => value.includes("T") ? value.slice(11, 16) : "";

export function HomeToday({ name = "" }: { name?: string }) {
  const enabled = useModuleEnabled();
  const { feed } = useOrgPosts();
  const tasks = taskStore.useRecords();
  const orders = orderStore.useRecords();
  const journeys = journeyStore.useRecords(enabled("field"));
  const todos = todoStore.useRecords();
  const events = eventStore.useRecords(enabled("calendar"));
  const lookup = useLookup();
  const day = today();
  const active = (feed?.posts ?? []).filter(post => postState(post).key === "active");
  const due = tasks.records.filter(task => !task.done && (task.dueDate ? task.dueDate <= day : task.startDate <= day)).sort((a, b) => (a.dueDate || day).localeCompare(b.dueDate || day));
  const running = orders.records.filter(order => !["done", "canceled"].includes(order.status) && order.startDate <= day && (!order.endDate || order.endDate >= day));
  const myTodos = todos.records.filter(todo => !todo.done && !!(todo.endDate || todo.startDate) && (todo.endDate || todo.startDate) <= day).sort((a, b) => (a.endDate || a.startDate).localeCompare(b.endDate || b.startDate));
  const open = journeys.records.filter(journey => !journey.events.some(event => event.type === "end"));
  const agenda = events.records.filter(event => event.start && event.start.slice(0, 10) <= day && (event.end || event.start).slice(0, 10) >= day).sort((a, b) => a.start.localeCompare(b.start));
  const chips = [
    enabled("calendar") && { href: "/dashboard/calendar", count: agenda.length, label: agenda.length === 1 ? "compromisso" : "compromissos" },
    enabled("tasks") && { href: "/dashboard/tasks", count: due.length, label: due.length === 1 ? "tarefa" : "tarefas" },
    enabled("todos") && { href: "/dashboard/todos", count: myTodos.length, label: "to-dos" },
    enabled("orders") && { href: "/dashboard/orders", count: running.length, label: running.length === 1 ? "ordem em andamento" : "ordens em andamento" },
    enabled("field") && { href: "/dashboard/journeys", count: open.length, label: "em campo" },
  ].filter(chip => !!chip);
  const firstName = name.trim().split(/\s+/)[0];
  return <section aria-labelledby="today" className="pt-7">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><p suppressHydrationWarning className="text-xs capitalize text-muted-foreground">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h2 id="today" suppressHydrationWarning className="text-lg font-semibold">{greeting()}{firstName && `, ${firstName}`}. Este é o seu dia.</h2></div>
      {chips.length > 0 && <ul className="flex flex-wrap gap-2">{chips.map(chip => <li key={chip.href}><Link href={chip.href} className="inline-flex items-center gap-1.5 border bg-card px-2.5 py-1 text-xs hover:border-primary/40"><strong className="tabular-nums">{chip.count}</strong>{chip.label}</Link></li>)}</ul>}
    </div>
    {enabled("mural") && active.length > 0 && <div className="mb-5"><MuralCarousel posts={active} /></div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {enabled("calendar") && <Panel title="Agenda de hoje" href="/dashboard/calendar" empty={events.loaded ? "Nenhum compromisso hoje." : "Carregando…"} items={agenda.map(event => ({ id: event.id, text: `${eventTime(event.start) ? `${eventTime(event.start)} · ` : ""}${event.title}`, detail: event.location }))} />}
      {enabled("tasks") && <Panel title="Tarefas" href="/dashboard/tasks" empty={tasks.loaded ? "Nada pendente para hoje." : "Carregando…"} items={due.map(task => ({ id: task.id, text: task.title, detail: task.dueDate ? `Prazo ${new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}` : undefined, alert: !!task.dueDate && task.dueDate < day }))} />}
      {enabled("todos") && <Panel title="Meus to-dos" href="/dashboard/todos" empty={todos.loaded ? "Nenhum to-do para hoje." : "Carregando…"} items={myTodos.map(todo => ({ id: todo.id, text: todo.title, detail: todo.notes, alert: !!todo.endDate && todo.endDate < day }))} />}
      {enabled("orders") && <Panel title="Ordens em andamento" href="/dashboard/orders" empty={orders.loaded ? "Nenhuma ordem para hoje." : "Carregando…"} items={running.map(order => ({ id: order.id, text: `${order.code} · ${order.title}`, detail: lookup("clients", order.clientId) }))} />}
      {enabled("field") && <Panel title="Jornadas abertas" href="/dashboard/journeys" empty={journeys.loaded ? "Ninguém em campo agora." : "Carregando…"} items={open.map(journey => ({ id: journey.id, text: lookup("employees", journey.employeeId) || "Colaborador", detail: journey.destination || journey.events.at(-1)?.place }))} />}
    </div>
  </section>;
}
