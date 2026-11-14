"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRef, useState, type ComponentType, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { RiAddLine, RiArrowLeftSLine, RiCalendarScheduleFill, RiCalendarTodoFill, RiCheckDoubleLine, RiCheckLine, RiDeleteBinLine, RiInboxFill, RiInformationLine, RiPencilLine } from "@remixicon/react";
import { CatalogLayout } from "@/components/listing/catalog";
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
const INBOX = { name: "Tarefas", color: "#2563eb", icon: "list" };
const smartLists: { key: Smart; label: string; color: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "today", label: "Hoje", color: "#2563eb", icon: RiCalendarTodoFill },
  { key: "scheduled", label: "Agendadas", color: "#ef4444", icon: RiCalendarScheduleFill },
  { key: "all", label: "Todas", color: "#475569", icon: RiInboxFill },
  { key: "done", label: "Concluídas", color: "#71717a", icon: RiCheckDoubleLine },
];
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const formatDate = (value: string) => dateFormatter.format(new Date(`${value}T12:00:00`));
const due = (todo: TodoFields) => todo.endDate || todo.startDate;
const shortUrl = (url: string) => { const text = url.replace(/^https?:\/\/(www\.)?/, ""); return text.length > 40 ? `${text.slice(0, 40)}…` : text; };

function TodoTitle({ title }: { title: string }) {
  return <>{title.split(/(https?:\/\/\S+)/g).map((part, index) => index % 2
    ? <a key={index} href={part} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">{shortUrl(part)}</a> : part)}</>;
}
function ListBadge({ color, icon, className = "size-7" }: { color: string; icon: string; className?: string }) {
  return <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full text-white ${className}`} style={{ backgroundColor: color }}>{renderTodoListIcon(icon, "size-[55%]")}</span>;
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
  const current = smart ? { name: smart.label, color: smart.color } : custom ?? (selected === "inbox" ? INBOX : { name: "Todas", color: "#475569" });
  const listOf = (todo: Todo) => lists.find(list => list.id === todo.listId) ?? INBOX;
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
    return <li key={todo.id} className="group flex items-start gap-3 px-4 py-3 hover:bg-muted/40 sm:items-center sm:px-5 sm:py-2.5">
      <span className="relative mt-px grid size-5 shrink-0 place-items-center sm:mt-0">
        <input type="checkbox" className="peer absolute inset-0 cursor-pointer appearance-none rounded-full border-2 border-muted-foreground/40 outline-none checked:border-(--list) checked:bg-(--list) hover:border-(--list) focus-visible:ring-2 focus-visible:ring-ring" style={{ "--list": list.color } as CSSProperties} aria-label={`Concluir ${todo.title}`} checked={todo.done} onChange={() => toggle(todo)} />
        <RiCheckLine aria-hidden="true" className="pointer-events-none relative size-3.5 text-white opacity-0 peer-checked:opacity-100" />
      </span>
      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
        <div className="min-w-0 sm:flex-1">
          <p className={`break-words text-sm leading-5 ${todo.done ? "text-muted-foreground line-through" : ""}`}><TodoTitle title={todo.title} /></p>
          {todo.notes && <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{todo.notes}</p>}
          {smart && <p className="mt-0.5 truncate text-xs font-medium" style={{ color: list.color }}>{list.name}</p>}
        </div>
        {(todo.startDate || todo.endDate) && <span className={`mt-1 block text-xs tabular-nums sm:mt-0 sm:shrink-0 ${late ? "font-medium text-destructive" : "text-muted-foreground"}`}>{late && "Atrasada · "}{todo.startDate && todo.endDate && todo.startDate !== todo.endDate ? `${formatDate(todo.startDate)} – ${formatDate(todo.endDate)}` : formatDate(todo.endDate || todo.startDate)}</span>}
      </div>
      <Button type="button" size="icon-sm" variant="ghost" className="shrink-0 text-primary group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0" aria-label={`Detalhes de ${todo.title}`} onClick={() => startEdit(todo)}><RiInformationLine /></Button>
    </li>;
  }
  function listRow(key: string, list: { name: string; color: string; icon: string }, count: number) {
    return <li key={key}><button type="button" aria-current={selected === key ? "true" : undefined} onClick={() => choose(key)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm outline-none hover:bg-muted/60 focus-visible:bg-muted ${selected === key ? "md:bg-muted" : ""}`}><ListBadge color={list.color} icon={list.icon} /><span className="min-w-0 flex-1 truncate font-medium">{list.name}</span><span className="tabular-nums text-muted-foreground">{count}</span></button></li>;
  }

  return <CatalogLayout section="Workspace" title="To-dos" description="Suas tarefas pessoais organizadas em listas.">
    {!loaded ? <LoadingBlock label="Carregando tarefas" /> : <div className="grid w-full items-start gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
      <aside aria-label="Listas" className={`space-y-4 md:order-2 ${detail ? "max-md:hidden" : ""}`}>
        <div className="grid grid-cols-2 gap-2">{smartLists.map(({ key, label, color, icon: Icon }) => {
          const active = selected === key;
          return <button key={key} type="button" aria-current={active ? "true" : undefined} onClick={() => choose(key)} className={`grid gap-2 border p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-transparent text-white" : "bg-card hover:bg-muted/40"}`} style={active ? { backgroundColor: color } : undefined}>
            <span className="flex items-start justify-between gap-2"><span className={`grid size-8 place-items-center rounded-full text-white ${active ? "bg-white/25" : ""}`} style={active ? undefined : { backgroundColor: color }}><Icon className="size-4" /></span><span className="text-xl font-semibold tabular-nums">{todos.filter(smartFilter[key]).length}</span></span>
            <span className={`text-sm font-medium ${active ? "" : "text-muted-foreground"}`}>{label}</span>
          </button>;
        })}</div>
        <section aria-labelledby="my-lists-title"><h2 id="my-lists-title" className="mb-2 px-1 text-sm font-semibold">Minhas listas</h2>
          <ul className={cn(surfaceVariants({ list: true }))}>{listRow("inbox", INBOX, pendingIn(""))}{lists.map(list => listRow(list.id, list, pendingIn(list.id)))}</ul>
          <Button type="button" variant="ghost" size="sm" className="mt-2 text-primary" onClick={() => setListDialog("new")}><RiAddLine />Nova lista</Button>
        </section>
      </aside>
      <section aria-label={current.name} className={`min-w-0 border bg-card md:order-1 ${detail ? "" : "max-md:hidden"}`}>
        <header className="flex items-center gap-2 border-b px-4 py-3 sm:px-5">
          <Button type="button" variant="ghost" size="icon-sm" className="md:hidden" aria-label="Voltar às listas" onClick={() => setDetail(false)}><RiArrowLeftSLine /></Button>
          <h2 className="min-w-0 flex-1 truncate text-2xl font-bold" style={{ color: current.color }}>{current.name}</h2>
          {custom && <><Button type="button" variant="ghost" size="icon-sm" aria-label={`Editar lista ${custom.name}`} onClick={() => setListDialog(custom)}><RiPencilLine /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`Excluir lista ${custom.name}`} onClick={() => setDeletingList(custom)}><RiDeleteBinLine /></Button></>}
        </header>
        <ul className="divide-y">
          {open.map(renderTodo)}
          {selected !== "done" && <li className="flex items-start gap-3 px-4 py-3 sm:px-5" onFocus={() => setAdding(true)} onBlur={event => { if (event.currentTarget.contains(event.relatedTarget as Node)) return; setAdding(false); if (draft.title.trim()) addTodo(); }}>
            <span aria-hidden="true" className="mt-px size-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
            <form className="min-w-0 flex-1" onSubmit={event => { event.preventDefault(); if (addTodo()) addRef.current?.focus(); }}>
              <input ref={addRef} aria-label="Nova tarefa" placeholder="Nova tarefa" maxLength={160} value={draft.title} className="w-full bg-transparent text-base sm:text-sm leading-5 outline-none placeholder:text-muted-foreground" onChange={event => setDraft({ ...draft, title: event.target.value })} onKeyDown={cancelAdd} />
              {(adding || !!draft.title) && <input aria-label="Notas" placeholder="Notas" maxLength={2000} value={draft.notes} className="mt-0.5 w-full bg-transparent text-base sm:text-xs text-muted-foreground outline-none" onChange={event => setDraft({ ...draft, notes: event.target.value })} onKeyDown={cancelAdd} />}
              <button type="submit" hidden tabIndex={-1}>Adicionar</button>
            </form>
          </li>}
        </ul>
        {!open.length && selected === "done" && !done.length && <p className="px-5 py-6 text-sm text-muted-foreground">Nenhuma tarefa concluída.</p>}
        {done.length > 0 && <details open={selected === "done"} className="border-t"><summary className="cursor-pointer px-5 py-2 text-xs text-muted-foreground">{done.length} concluída(s)</summary><ul className="divide-y">{done.map(renderTodo)}</ul></details>}
      </section>
    </div>}
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
  </CatalogLayout>;
}
