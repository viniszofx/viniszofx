"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRef, useState, type ComponentType, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { RiAddLine, RiArrowLeftSLine, RiCalendarScheduleFill, RiCalendarTodoFill, RiCheckDoubleLine, RiCheckLine, RiDeleteBinLine, RiInboxFill, RiInformationLine, RiPencilLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingBlock } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { renderTodoListIcon, todoListColors, todoListIcons, type TodoListFields } from "@/lib/nodus/todo-lists";
import { todoListStore, todoStore, type Todo, type TodoFields, type TodoList } from "@/lib/nodus/stores";
import { fieldsOf } from "@/lib/records/store";
import { today } from "@/lib/format/date";

// Tarefas pessoais em listas, como no app Lembretes (Nodus: Início › Tarefas).
type Smart = "today" | "scheduled" | "all" | "done";
type Draft = { title: string; notes: string; startDate: string; endDate: string; listId: string };
const emptyDraft: Draft = { title: "", notes: "", startDate: "", endDate: "", listId: "" };
// A lista padrão e as listas inteligentes usam o cobre do tema; só as listas criadas têm cor própria.
const INBOX = { name: "Tarefas", color: "var(--primary)", ink: "var(--primary-foreground)", icon: "list" };
const smartLists: { key: Smart; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "today", label: "Hoje", icon: RiCalendarTodoFill },
  { key: "scheduled", label: "Agendadas", icon: RiCalendarScheduleFill },
  { key: "all", label: "Todas", icon: RiInboxFill },
  { key: "done", label: "Concluídas", icon: RiCheckDoubleLine },
];
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const formatDate = (value: string) => dateFormatter.format(new Date(`${value}T12:00:00`));
const due = (todo: TodoFields) => todo.endDate || todo.startDate;
const shortUrl = (url: string) => { const text = url.replace(/^https?:\/\/(www\.)?/, ""); return text.length > 40 ? `${text.slice(0, 40)}…` : text; };

function TodoTitle({ title }: { title: string }) {
  return <>{title.split(/(https?:\/\/\S+)/g).map((part, index) => index % 2
    ? <a key={index} href={part} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">{shortUrl(part)}</a> : part)}</>;
}
function ListBadge({ color, ink = "#fff", icon, className = "size-6" }: { color: string; ink?: string; icon: string; className?: string }) {
  return <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full ${className}`} style={{ backgroundColor: color, color: ink }}>{renderTodoListIcon(icon, "size-[55%]")}</span>;
}

function TodoListDialog({ list, onClose }: { list: TodoList | "new"; onClose: (createdId?: string) => void }) {
  const [draft, setDraft] = useState<TodoListFields>(() => list === "new" ? { name: "", color: todoListColors[5][1], icon: "list" } : { name: list.name, color: list.color, icon: list.icon });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    const saved = todoListStore.save({ ...draft, name: draft.name.trim() }, list === "new" ? undefined : list.id);
    onClose(list === "new" ? saved?.id : undefined);
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
    <DialogHeader className="items-center text-center"><DialogTitle>{list === "new" ? "Nova lista" : "Editar lista"}</DialogTitle><DialogDescription className="sr-only">Escolha o nome, a cor e o ícone da lista.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="grid gap-5">
      <span aria-hidden="true" className="mx-auto grid size-20 place-items-center rounded-full text-white shadow-lg" style={{ backgroundColor: draft.color }}>{renderTodoListIcon(draft.icon, "size-10")}</span>
      <Input required autoFocus maxLength={60} aria-label="Nome da lista" placeholder="Nome da lista" value={draft.name} className="mx-auto max-w-sm text-center font-medium" style={{ color: draft.color }} onChange={event => setDraft({ ...draft, name: event.target.value })} />
      <div role="radiogroup" aria-label="Cor" className="grid grid-cols-6 justify-items-center gap-2.5 sm:grid-cols-12">{todoListColors.map(([name, color]) => <button key={color} type="button" role="radio" aria-checked={draft.color === color} aria-label={name} title={name} className={`size-8 rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring ${draft.color === color ? "ring-2 ring-foreground/60 ring-offset-2 ring-offset-background" : ""}`} style={{ backgroundColor: color }} onClick={() => setDraft({ ...draft, color })} />)}</div>
      <div role="radiogroup" aria-label="Ícone" className="grid grid-cols-6 justify-items-center gap-2 sm:grid-cols-10">{Object.entries(todoListIcons).map(([key, { label, icon: Icon }]) => <button key={key} type="button" role="radio" aria-checked={draft.icon === key} aria-label={label} title={label} className={`grid size-9 place-items-center rounded-full bg-muted text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ${draft.icon === key ? "text-foreground ring-2 ring-foreground/60 ring-offset-2 ring-offset-background" : ""}`} onClick={() => setDraft({ ...draft, icon: key })}><Icon className="size-4" /></button>)}</div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => onClose()}>Cancelar</Button><Button type="submit" disabled={!draft.name.trim()}>Concluído</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}

export function TodosPage() {
  const todosSnapshot = todoStore.useRecords();
  const listsSnapshot = todoListStore.useRecords();
  const todos = todosSnapshot.records; const lists = listsSnapshot.records;
  const [selected, setSelected] = useState<string>("all");
  const [detail, setDetail] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [adding, setAdding] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [deleting, setDeleting] = useState<Todo | null>(null);
  const [listDialog, setListDialog] = useState<TodoList | "new" | null>(null);
  const [deletingList, setDeletingList] = useState<TodoList | null>(null);
  const loaded = todosSnapshot.loaded && listsSnapshot.loaded;
  const now = today();
  const smartFilter: Record<Smart, (todo: Todo) => boolean> = {
    today: todo => !todo.done && !!due(todo) && due(todo) <= now,
    scheduled: todo => !todo.done && !!due(todo),
    all: todo => !todo.done,
    done: todo => todo.done,
  };
  const smart = smartLists.find(item => item.key === selected);
  const custom = lists.find(list => list.id === selected);
  const current: { name: string; color?: string } = smart ? { name: smart.label } : custom ?? (selected === "inbox" ? INBOX : { name: "Todas" });
  const listOf = (todo: Todo): { name: string; color: string; ink?: string } => lists.find(list => list.id === todo.listId) ?? INBOX;
  const pendingIn = (listId: string) => todos.filter(todo => !todo.done && (todo.listId || "") === listId).length;
  const inView = (todo: Todo) => smart ? smartFilter[smart.key](todo) : custom ? todo.listId === custom.id : selected === "inbox" ? !todo.listId : !todo.done;
  const visible = todos.filter(inView);
  const open = visible.filter(todo => !todo.done).sort((a, b) => (due(a) || "9999").localeCompare(due(b) || "9999"));
  const done = visible.filter(todo => todo.done).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  function choose(key: string) { setSelected(key); setDetail(true); setDraft(emptyDraft); }
  function addTodo() {
    if (!draft.title.trim()) return false;
    todoStore.save({ title: draft.title.trim(), notes: draft.notes.trim(), startDate: "", endDate: selected === "today" ? now : "", listId: custom?.id ?? "", done: false }, undefined, { silent: true });
    setDraft(emptyDraft); return true;
  }
  function cancelAdd(event: KeyboardEvent<HTMLInputElement>) { if (event.key === "Escape") { setDraft(emptyDraft); event.currentTarget.blur(); } }
  function startEdit(todo: Todo) { setEditing(todo); setEditDraft({ title: todo.title, notes: todo.notes, startDate: todo.startDate, endDate: todo.endDate, listId: todo.listId }); }
  function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing || !editDraft.title.trim() || (editDraft.startDate && editDraft.endDate && editDraft.endDate < editDraft.startDate)) return;
    todoStore.save({ ...fieldsOf<TodoFields>(editing), ...editDraft, title: editDraft.title.trim(), notes: editDraft.notes.trim() }, editing.id);
    setEditing(null);
  }
  function toggle(todo: Todo) { todoStore.save({ ...fieldsOf<TodoFields>(todo), done: !todo.done }, todo.id, { silent: true }); }
  function removeList(list: TodoList) {
    // As tarefas da lista vão junto, como no Nodus.
    todoStore.replaceAll(todos.filter(todo => todo.listId !== list.id), "Lista excluída");
    todoListStore.remove(list.id);
    if (selected === list.id) setSelected("all");
  }

  function renderTodo(todo: Todo) {
    const late = !todo.done && !!todo.endDate && todo.endDate < now;
    const list = listOf(todo);
    return <li key={todo.id} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:items-center sm:px-5 sm:py-2.5">
      <span className="relative mt-px grid size-5 shrink-0 place-items-center sm:mt-0">
        <input type="checkbox" className="peer absolute inset-0 cursor-pointer appearance-none rounded-full border-2 border-muted-foreground/40 outline-none checked:border-(--list) checked:bg-(--list) hover:border-(--list) focus-visible:ring-2 focus-visible:ring-ring" style={{ "--list": list.color, "--list-ink": list.ink ?? "#fff" } as CSSProperties} aria-label={`Concluir ${todo.title}`} checked={todo.done} onChange={() => toggle(todo)} />
        <RiCheckLine aria-hidden="true" className="pointer-events-none relative size-3.5 text-(--list-ink) opacity-0 peer-checked:opacity-100" />
      </span>
      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
        <div className="min-w-0 sm:flex-1">
          <p className={`break-words text-sm leading-5 ${todo.done ? "text-muted-foreground line-through" : ""}`}><TodoTitle title={todo.title} /></p>
          {todo.notes && <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{todo.notes}</p>}
          {smart && <p className="mt-0.5 truncate text-xs font-medium" style={{ color: list.color }}>{list.name}</p>}
        </div>
        {(todo.startDate || todo.endDate) && <span className={`mt-1 block text-xs tabular-nums sm:mt-0 sm:shrink-0 ${late ? "font-medium text-destructive" : "text-muted-foreground"}`}>{late && "Atrasada · "}{todo.startDate && todo.endDate && todo.startDate !== todo.endDate ? `${formatDate(todo.startDate)} – ${formatDate(todo.endDate)}` : formatDate(todo.endDate || todo.startDate)}</span>}
      </div>
      <Button type="button" size="icon-sm" variant="ghost" className="shrink-0 text-muted-foreground group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0" aria-label={`Detalhes de ${todo.title}`} onClick={() => startEdit(todo)}><RiInformationLine /></Button>
    </li>;
  }
  const rowClass = (active: boolean) => cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    active ? "md:bg-primary/10 md:font-medium md:text-primary" : "hover:bg-muted");
  function listRow(key: string, list: { name: string; color: string; ink?: string; icon: string }, count: number) {
    return <li key={key}><button type="button" aria-current={selected === key ? "true" : undefined} onClick={() => choose(key)} className={rowClass(selected === key)}>
      <ListBadge color={list.color} ink={list.ink} icon={list.icon} /><span className="min-w-0 flex-1 truncate">{list.name}</span><span className="text-xs tabular-nums text-muted-foreground">{count || ""}</span>
    </button></li>;
  }

  // Mesmo modelo do Drive: um quadro de vidro com as listas à esquerda e as tarefas à direita.
  // No celular, como em Mensagens: as listas ocupam a tela e a lista escolhida abre no lugar, com voltar.
  return <main className="flex w-full max-w-none min-w-0 flex-col gap-4 md:min-h-[calc(100svh-57px)] md:px-6 md:py-4 lg:px-8">
    <header className="max-md:hidden"><p className="text-xs uppercase tracking-widest text-primary">Workspace</p><h1 className="mt-2 font-heading text-3xl font-semibold">To-dos</h1></header>
    <div className={cn(surfaceVariants(), "flex min-w-0 flex-col overflow-hidden md:min-h-[min(70svh,42rem)] md:flex-1 md:flex-row max-md:h-[calc(100dvh-3.5rem-1px-3.5rem-env(safe-area-inset-bottom))] max-md:rounded-none max-md:border-0")}>
      {!loaded ? <div className="grid flex-1 place-items-center p-6"><LoadingBlock label="Carregando tarefas" /></div> : <>
      <aside aria-label="Listas" className={cn("flex min-h-0 min-w-0 shrink-0 flex-col overflow-y-auto bg-foreground/[0.03] p-3 max-md:flex-1 md:w-64 md:border-r", detail && "max-md:hidden")}>
        <nav aria-label="Listas inteligentes"><ul className="grid gap-0.5">{smartLists.map(({ key, label, icon: Icon }) => <li key={key}>
          <button type="button" aria-current={selected === key ? "true" : undefined} onClick={() => choose(key)} className={rowClass(selected === key)}>
            <Icon className={cn("size-4 shrink-0", selected === key ? "text-primary" : "text-muted-foreground")} /><span className="min-w-0 flex-1 truncate">{label}</span>
            <span className="text-xs tabular-nums text-muted-foreground">{todos.filter(smartFilter[key]).length || ""}</span>
          </button>
        </li>)}</ul></nav>
        <section aria-labelledby="my-lists-title" className="mt-4 border-t pt-3">
          <div className="mb-1 flex items-center justify-between pl-2.5"><h2 id="my-lists-title" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Minhas listas</h2>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Nova lista" title="Nova lista" onClick={() => setListDialog("new")}><RiAddLine /></Button></div>
          <ul className="grid gap-0.5">{listRow("inbox", INBOX, pendingIn(""))}{lists.map(list => listRow(list.id, list, pendingIn(list.id)))}</ul>
        </section>
      </aside>
      <section aria-label={current.name} className={cn("flex min-h-0 min-w-0 flex-1 flex-col", !detail && "max-md:hidden")}>
        <header className="flex min-h-12 items-center gap-1 border-b px-2 py-1.5 sm:px-3">
          <Button type="button" variant="ghost" size="icon-sm" className="md:hidden" aria-label="Voltar às listas" onClick={() => setDetail(false)}><RiArrowLeftSLine /></Button>
          <h2 className="min-w-0 flex-1 truncate px-2 font-heading text-lg font-semibold" style={current.color ? { color: current.color } : undefined}>{current.name}</h2>
          {custom && <><Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar lista ${custom.name}`} title="Editar lista" onClick={() => setListDialog(custom)}><RiPencilLine /></Button><Button type="button" variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" aria-label={`Excluir lista ${custom.name}`} title="Excluir lista" onClick={() => setDeletingList(custom)}><RiDeleteBinLine /></Button></>}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="divide-y">
          {open.map(renderTodo)}
          {selected !== "done" && <li className="flex items-start gap-3 px-4 py-3 sm:px-5" onFocus={() => setAdding(true)} onBlur={event => { if (event.currentTarget.contains(event.relatedTarget as Node)) return; setAdding(false); if (draft.title.trim()) addTodo(); }}>
            <span aria-hidden="true" className="mt-px grid size-5 shrink-0 place-items-center text-muted-foreground"><RiAddLine className="size-4" /></span>
            <form className="min-w-0 flex-1" onSubmit={event => { event.preventDefault(); if (addTodo()) addRef.current?.focus(); }}>
              <input ref={addRef} aria-label="Nova tarefa" placeholder="Nova tarefa" maxLength={160} value={draft.title} className="w-full bg-transparent text-base sm:text-sm leading-5 outline-none placeholder:text-muted-foreground" onChange={event => setDraft({ ...draft, title: event.target.value })} onKeyDown={cancelAdd} />
              {(adding || !!draft.title) && <input aria-label="Notas" placeholder="Notas" maxLength={2000} value={draft.notes} className="mt-0.5 w-full bg-transparent text-base sm:text-xs text-muted-foreground outline-none" onChange={event => setDraft({ ...draft, notes: event.target.value })} onKeyDown={cancelAdd} />}
              <button type="submit" hidden tabIndex={-1}>Adicionar</button>
            </form>
          </li>}
        </ul>
        {!open.length && selected === "done" && !done.length && <p className="px-5 py-6 text-sm text-muted-foreground">Nenhuma tarefa concluída.</p>}
        {done.length > 0 && <details open={selected === "done"} className="border-t"><summary className="cursor-pointer px-5 py-2 text-xs text-muted-foreground">{done.length} concluída(s)</summary><ul className="divide-y">{done.map(renderTodo)}</ul></details>}
        </div>
      </section>
      </>}
    </div>
    {editing && <Dialog open onOpenChange={value => { if (!value) setEditing(null); }}><DialogContent className="sm:max-w-lg"><DialogTitle>Detalhes</DialogTitle><DialogDescription className="sr-only">Título, notas, lista e datas da tarefa.</DialogDescription>
      <form onSubmit={saveEdit} className="grid gap-4">
        <Field label="Título" required><Input required autoFocus maxLength={160} value={editDraft.title} onChange={event => setEditDraft({ ...editDraft, title: event.target.value })} /></Field>
        <Field label="Notas"><Textarea rows={3} maxLength={2000} value={editDraft.notes} onChange={event => setEditDraft({ ...editDraft, notes: event.target.value })} /></Field>
        <Field label="Lista"><Select value={editDraft.listId} options={[{ value: "", label: INBOX.name }, ...lists.map(list => ({ value: list.id, label: list.name }))]} onChange={event => setEditDraft({ ...editDraft, listId: event.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Data de início"><Input type="date" max={editDraft.endDate || undefined} value={editDraft.startDate} onChange={event => setEditDraft({ ...editDraft, startDate: event.target.value })} /></Field><Field label="Data de fim"><Input type="date" min={editDraft.startDate || undefined} value={editDraft.endDate} onChange={event => setEditDraft({ ...editDraft, endDate: event.target.value })} /></Field></div>
        {editDraft.startDate && editDraft.endDate && editDraft.endDate < editDraft.startDate && <p role="alert" className="text-xs text-destructive">A data de fim não pode anteceder a de início.</p>}
        <DialogFooter className="sm:justify-between"><Button type="button" variant="destructive" onClick={() => { setDeleting(editing); setEditing(null); }}><RiDeleteBinLine />Excluir</Button><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit">Salvar</Button></div></DialogFooter>
      </form>
    </DialogContent></Dialog>}
    {deleting && <ConfirmDialog title="Excluir tarefa?" description={`“${deleting.title}” será removida.`} onConfirm={() => todoStore.remove(deleting.id)} onClose={() => setDeleting(null)} />}
    {listDialog && <TodoListDialog list={listDialog} onClose={createdId => { setListDialog(null); if (createdId) choose(createdId); }} />}
    {deletingList && <ConfirmDialog title="Excluir lista?" description={`A lista “${deletingList.name}” e as ${pendingIn(deletingList.id)} tarefa(s) pendentes dela serão removidas.`} onConfirm={() => removeList(deletingList)} onClose={() => setDeletingList(null)} />}
  </main>;
}
