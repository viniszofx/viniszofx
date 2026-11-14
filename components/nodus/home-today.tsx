"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { RiRefreshLine } from "@remixicon/react";
import { postState, useOrgPosts, type OrgPost } from "./mural-page";
import { eventStore, journeyStore, orderStore, taskStore, todoStore } from "@/lib/nodus/stores";
import { useLookup } from "@/lib/records/references";
import { useModuleEnabled } from "@/lib/modules-context";
import { Skeleton } from "@/components/ui/feedback";
import { ModuleBoundary, ModuleError } from "@/components/ui/module-boundary";

const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const greeting = () => { const hour = new Date().getHours(); return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"; };
const eventTime = (value: string) => value.includes("T") ? value.slice(11, 16) : "";

type Item = { id: string; text: string; detail?: string; alert?: boolean };
type State = { loaded: boolean; error: string; retry: () => void };

/**
 * Cartão de um módulo do dia. Cada um carrega sozinho: mostra o próprio esqueleto,
 * o próprio erro (com "Tentar de novo") e, vazio, encolhe para uma linha.
 */
function Panel({ title, href, empty, items, state }: { title: string; href: string; empty: string; items: Item[]; state: State }) {
  const header = (count?: number) => <header className="flex items-center justify-between gap-3 px-4 py-2">
    <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold"><span className="truncate">{title}</span>{!!count && <span className="bg-primary/15 px-1.5 text-xs tabular-nums text-primary">{count}</span>}</h3>
    <Link href={href} className="shrink-0 text-xs text-primary hover:underline">Ver tudo</Link>
  </header>;
  if (!state.loaded) return <section aria-busy="true" aria-label={`Carregando ${title.toLowerCase()}`} className={cn(surfaceVariants(), "min-w-0")}>
    {header()}<div className="space-y-2.5 border-t px-4 py-3"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3.5 w-2/3" /></div>
  </section>;
  if (state.error && !items.length) return <ModuleError title={title} message={state.error} onRetry={state.retry} />;
  if (!items.length) return <section className={cn(surfaceVariants(), "min-w-0")}>{header()}<p className="border-t px-4 py-2 text-xs text-muted-foreground">{empty}</p></section>;
  return <section className={cn(surfaceVariants(), "min-w-0")}>
    {header(items.length)}
    <ul className="divide-y border-t">{items.slice(0, 5).map(item => <li key={item.id} className="px-4 py-2 text-sm"><p className={item.alert ? "text-destructive" : undefined}>{item.text}</p>{item.detail && <p className="line-clamp-2 text-xs text-muted-foreground">{item.detail}</p>}</li>)}</ul>
    {items.length > 5 && <Link href={href} className="block border-t px-4 py-2 text-xs text-primary hover:underline">Mais {items.length - 5}</Link>}
  </section>;
}

// Cada painel lê só o próprio store: se um falhar ou demorar, os outros seguem.
function AgendaPanel({ day }: { day: string }) {
  const events = eventStore.useRecords();
  const items = events.records.filter(event => event.start && event.start.slice(0, 10) <= day && (event.end || event.start).slice(0, 10) >= day).sort((a, b) => a.start.localeCompare(b.start))
    .map(event => ({ id: event.id, text: `${eventTime(event.start) ? `${eventTime(event.start)} · ` : ""}${event.title}`, detail: event.location }));
  return <Panel title="Agenda de hoje" href="/dashboard/calendar" empty="Nenhum compromisso hoje." items={items} state={{ ...events, retry: eventStore.retry }} />;
}

function TasksPanel({ day }: { day: string }) {
  const tasks = taskStore.useRecords();
  const items = tasks.records.filter(task => !task.done && (task.dueDate ? task.dueDate <= day : task.startDate <= day)).sort((a, b) => (a.dueDate || day).localeCompare(b.dueDate || day))
    .map(task => ({ id: task.id, text: task.title, detail: task.dueDate ? `Prazo ${new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}` : undefined, alert: !!task.dueDate && task.dueDate < day }));
  return <Panel title="Tarefas" href="/dashboard/tasks" empty="Nada pendente para hoje." items={items} state={{ ...tasks, retry: taskStore.retry }} />;
}

function TodosPanel({ day }: { day: string }) {
  const todos = todoStore.useRecords();
  const items = todos.records.filter(todo => !todo.done && !!(todo.endDate || todo.startDate) && (todo.endDate || todo.startDate) <= day).sort((a, b) => (a.endDate || a.startDate).localeCompare(b.endDate || b.startDate))
    .map(todo => ({ id: todo.id, text: todo.title, detail: todo.notes, alert: !!todo.endDate && todo.endDate < day }));
  return <Panel title="Meus to-dos" href="/dashboard/todos" empty="Nenhum to-do para hoje." items={items} state={{ ...todos, retry: todoStore.retry }} />;
}

function OrdersPanel({ day }: { day: string }) {
  const orders = orderStore.useRecords();
  const lookup = useLookup();
  const items = orders.records.filter(order => !["done", "canceled"].includes(order.status) && order.startDate <= day && (!order.endDate || order.endDate >= day))
    .map(order => ({ id: order.id, text: `${order.code} · ${order.title}`, detail: lookup("clients", order.clientId) }));
  return <Panel title="Ordens em andamento" href="/dashboard/orders" empty="Nenhuma ordem para hoje." items={items} state={{ ...orders, retry: orderStore.retry }} />;
}

function JourneysPanel() {
  const journeys = journeyStore.useRecords();
  const lookup = useLookup();
  const items = journeys.records.filter(journey => !journey.events.some(event => event.type === "end"))
    .map(journey => ({ id: journey.id, text: lookup("employees", journey.employeeId) || "Colaborador", detail: journey.destination || journey.events.at(-1)?.place }));
  return <Panel title="Jornadas abertas" href="/dashboard/journeys" empty="Ninguém em campo agora." items={items} state={{ ...journeys, retry: journeyStore.retry }} />;
}

/** Avisos ativos em cartões lado a lado (rolagem lateral no celular). */
function MuralCarousel({ posts }: { posts: OrgPost[] }) {
  return <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">{posts.slice(0, 8).map(post => <li key={post.id} className="w-64 shrink-0 snap-start sm:w-80">
    <Link href="/dashboard/announcements" className={cn(surfaceVariants(), "flex h-full flex-col overflow-hidden transition-colors hover:border-primary/40")}>
      {post.cover ? <img src={post.cover} alt="" loading="lazy" className="aspect-[2/1] w-full object-cover" /> : <div className="aspect-[2/1] w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" aria-hidden="true" />}
      <div className="flex flex-1 flex-col gap-1 p-3"><p className="line-clamp-2 text-sm font-semibold">{post.title}</p>{post.body && <p className="line-clamp-2 text-xs text-muted-foreground">{post.body}</p>}
        <p className="mt-auto pt-1 text-[11px] text-muted-foreground">{post.authorName}{post.poll && " · enquete"}{post.poll && !post.poll.mine.length && <span className="ml-1 font-medium text-primary">vote</span>}</p></div>
    </Link>
  </li>)}</ul>;
}

function TodayMural() {
  const { feed, error, reload, noOrganization } = useOrgPosts();
  if (noOrganization) return null;
  const active = (feed?.posts ?? []).filter(post => postState(post).key === "active");
  const title = <div className="mb-2 flex items-center justify-between"><h3 id="mural-today" className="text-sm font-semibold">Mural</h3><Link href="/dashboard/announcements" className="text-xs text-primary hover:underline">Ver tudo</Link></div>;
  if (!feed && error) return <section aria-labelledby="mural-today" className="mb-5 min-w-0">{title}<p role="alert" className={cn(surfaceVariants(), "flex items-center gap-3 px-4 py-3 text-xs text-muted-foreground")}><span className="flex-1">Não foi possível carregar o mural.</span><button type="button" onClick={() => void reload()} className="inline-flex items-center gap-1 text-primary hover:underline"><RiRefreshLine className="size-3.5" aria-hidden="true" />Tentar de novo</button></p></section>;
  if (!feed) return <section aria-busy="true" aria-label="Carregando mural" className="mb-5 min-w-0">{title}<div className="-mx-4 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:px-0">{[0, 1, 2].map(index => <div key={index} className={cn(surfaceVariants(), "w-64 shrink-0 sm:w-80")}><Skeleton className="aspect-[2/1] w-full" /><div className="space-y-2 p-3"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}</div></section>;
  if (!active.length) return null;
  return <section aria-labelledby="mural-today" className="mb-5 min-w-0">{title}<MuralCarousel posts={active} /></section>;
}

export function HomeToday({ name = "" }: { name?: string }) {
  const enabled = useModuleEnabled();
  const day = today();
  const firstName = name.trim().split(/\s+/)[0];
  return <section aria-labelledby="today" className="pt-5 md:pt-7">
    <div className="mb-4">
      <p suppressHydrationWarning className="text-xs capitalize text-muted-foreground">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
      <h2 id="today" suppressHydrationWarning className="text-lg font-semibold">{greeting()}{firstName && `, ${firstName}`}. Este é o seu dia.</h2>
    </div>
    {enabled("mural") && <ModuleBoundary title="Mural" className="mb-5"><TodayMural /></ModuleBoundary>}
    <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
      {enabled("calendar") && <ModuleBoundary title="Agenda de hoje"><AgendaPanel day={day} /></ModuleBoundary>}
      {enabled("tasks") && <ModuleBoundary title="Tarefas"><TasksPanel day={day} /></ModuleBoundary>}
      {enabled("todos") && <ModuleBoundary title="Meus to-dos"><TodosPanel day={day} /></ModuleBoundary>}
      {enabled("orders") && <ModuleBoundary title="Ordens em andamento"><OrdersPanel day={day} /></ModuleBoundary>}
      {enabled("field") && <ModuleBoundary title="Jornadas abertas"><JourneysPanel /></ModuleBoundary>}
    </div>
  </section>;
}
