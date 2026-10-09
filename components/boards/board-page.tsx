"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { RiArrowLeftLine as ArrowLeft, RiArrowRightLine as ArrowRight, RiArrowUpLine as ArrowUp, RiArrowDownLine as ArrowDown, RiDraggable as GripVertical, RiPencilLine as Pencil, RiAddLine as Plus, RiDeleteBinLine as Trash2, RiAttachmentLine as Paperclip } from "@remixicon/react";
import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import { useBoards, saveBoard, newId, reorder, descriptionText, type BoardList, type BoardCard } from "@/lib/boards/store";
import { BoardDialog, DeleteDialog, type BoardFields } from "./board-dialog";
import { BoardAppearance, BoardCoverBackground } from "./board-appearance";
import { CardAppearance, CardCover } from "./card-appearance";
import { BoardsStatus } from "./boards-page";

type Edit = { kind: "board" | "list" | "card"; listId?: string; cardId?: string; initial: BoardFields };
type Removal = { title: string; listId: string; cardId?: string };
export function BoardPage({ boardId, initialCardId = "" }: { boardId: string; initialCardId?: string }) {
  const { boards, loaded } = useBoards();
  const board = boards.find(board => board.id === boardId);
  const [manualEditing, setEditing] = useState<Edit | null | undefined>(undefined);
  const requestedList = board?.lists.find(list => list.cards.some(card => card.id === initialCardId));
  const requestedCard = requestedList?.cards.find(card => card.id === initialCardId);
  const editing: Edit | null = manualEditing === undefined ? requestedCard && requestedList ? { kind: "card", listId: requestedList.id, cardId: requestedCard.id, initial: requestedCard } : null : manualEditing;
  const [removing, setRemoving] = useState<Removal | null>(null);
  const drag = useRef<{ listId: string; cardId?: string } | null>(null);
  if (!loaded) return <main className="p-6" aria-label="Carregando board"><div className="h-24 animate-pulse rounded-none bg-muted" /></main>;
  if (!board) return <main className="space-y-4 p-6"><h1 className="font-heading text-2xl">Board não encontrado</h1><Link href="/dashboard/boards" className="text-primary underline">Voltar a Boards</Link><BoardsStatus /></main>;
  function update(lists: BoardList[]) { if (board) saveBoard({ ...board, lists }); }
  function patchCard(listId: string, cardId: string, patch: Partial<BoardCard>) { update(board!.lists.map(list => list.id === listId ? { ...list, cards: list.cards.map(card => card.id === cardId ? { ...card, ...patch } : card) } : list)); }
  function moveCard(listId: string, cardId: string, targetId: string, targetCardId?: string) {
    const card = board!.lists.find(list => list.id === listId)?.cards.find(card => card.id === cardId);
    if (!card || cardId === targetCardId) return;
    update(board!.lists.map(list => {
      const cards = list.cards.filter(item => item.id !== cardId);
      if (list.id === targetId) { const at = targetCardId ? cards.findIndex(item => item.id === targetCardId) : cards.length; cards.splice(at < 0 ? cards.length : at, 0, card); }
      return { ...list, cards };
    }));
  }
  function drop(listId: string, cardId?: string) {
    const source = drag.current; drag.current = null;
    if (!source) return;
    if (source.cardId) moveCard(source.listId, source.cardId, listId, cardId);
    else if (source.listId !== listId) update(reorder(board!.lists, board!.lists.findIndex(list => list.id === source.listId), board!.lists.findIndex(list => list.id === listId)));
  }
  function submit(value: BoardFields) {
    if (!editing) return;
    if (editing.kind === "board") { saveBoard({ ...board!, title: value.title, color: value.color }); return; }
    if (editing.kind === "list") {
      update(editing.listId ? board!.lists.map(list => list.id === editing.listId ? { ...list, title: value.title, color: value.color } : list) : [...board!.lists, { id: newId(), title: value.title, color: value.color, cards: [] }]); return;
    }
    update(board!.lists.map(list => list.id === editing.listId ? { ...list, cards: editing.cardId ? list.cards.map(card => card.id === editing.cardId ? { ...card, ...value, description: value.description ?? "" } : card) : [...list.cards, { id: newId(), ...value, description: value.description ?? "", completed: false }] } : list));
  }
  return <main className="relative isolate flex min-h-[calc(100svh-65px)] min-w-0 flex-col gap-6 px-4 py-6 sm:px-6" style={board.color ? { backgroundColor: `color-mix(in srgb, ${board.color} 28%, var(--background))` } : undefined}>
    {board.cover && <BoardCoverBackground key={board.cover.id} cover={board.cover} position={board.coverPosition} />}
    <header className={`flex flex-wrap items-center justify-between gap-4 ${board.cover ? "rounded-none bg-background/85 p-3 backdrop-blur-sm" : ""}`}><div className="min-w-0"><Link href="/dashboard/boards" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" />Boards</Link><h1 className="mt-3 break-words font-heading text-3xl font-semibold">{board.title}</h1></div><div className="flex flex-wrap gap-2"><Button variant="ghost" size="icon-sm" aria-label="Editar board" onClick={() => setEditing({ kind: "board", initial: board })}><Pencil /></Button><BoardAppearance board={board} /><Button size="sm" onClick={() => setEditing({ kind: "list", initial: { title: "", color: "" } })}><Plus />Nova lista</Button></div></header>
    <div className="flex min-h-72 min-w-0 items-start gap-4 overflow-x-auto pb-4">
      {board.lists.map((list, listIndex) => <section key={list.id} aria-label={`Lista ${list.title}`} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); drop(list.id); }} className="w-72 shrink-0 rounded-none border bg-card p-3" style={list.color ? { borderTop: `3px solid ${list.color}` } : undefined}>
        <div className="flex items-center gap-2"><button draggable onDragStart={event => { drag.current = { listId: list.id }; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", list.id); }} onDragEnd={() => { drag.current = null; }} aria-label={`Arrastar lista ${list.title}`} className="cursor-grab p-1"><GripVertical className="size-4" /></button><h2 className="min-w-0 flex-1 break-words text-sm font-semibold">{list.title} <span className="text-xs text-muted-foreground">{list.cards.length}</span></h2><Button variant="ghost" size="icon-xs" aria-label={`Editar lista ${list.title}`} onClick={() => setEditing({ kind: "list", listId: list.id, initial: list })}><Pencil /></Button><ColorPicker compact label={`Cor da lista ${list.title}`} value={list.color} onChange={color => update(board.lists.map(item => item.id === list.id ? { ...item, color: color ?? "" } : item))} /><Button variant="ghost" size="icon-xs" aria-label={`Excluir lista ${list.title}`} onClick={() => setRemoving({ title: list.title, listId: list.id })}><Trash2 /></Button></div>
        <div className="mb-3 flex justify-end"><Button variant="ghost" size="icon-xs" disabled={listIndex === 0} aria-label={`Mover ${list.title} à esquerda`} onClick={() => update(reorder(board.lists, listIndex, listIndex - 1))}><ArrowLeft /></Button><Button variant="ghost" size="icon-xs" disabled={listIndex === board.lists.length - 1} aria-label={`Mover ${list.title} à direita`} onClick={() => update(reorder(board.lists, listIndex, listIndex + 1))}><ArrowRight /></Button></div>
        <div className="flex flex-col gap-3">{list.cards.map((card, index) => <article key={card.id} onClick={event => {
          if ((event.target as HTMLElement).closest("button, input, a, select, textarea, [role='dialog']")) return;
          setEditing({ kind: "card", listId: list.id, cardId: card.id, initial: card });
        }} draggable onDragStart={event => { event.stopPropagation(); drag.current = { listId: list.id, cardId: card.id }; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", card.id); }} onDragEnd={() => { drag.current = null; }} onDragOver={event => { event.preventDefault(); event.stopPropagation(); }} onDrop={event => { event.preventDefault(); event.stopPropagation(); drop(list.id, card.id); }} className="cursor-pointer rounded-none border bg-background p-3 transition-colors hover:bg-accent/50" style={card.color ? { borderLeft: `4px solid ${card.color}` } : undefined}>
          {card.attachments?.filter(file => file.id === card.coverAttachmentId).map(file => <CardCover key={file.id} file={file} position={card.coverPosition} />)}
          <div className="flex items-start gap-2"><input type="checkbox" aria-label={`Concluir ${card.title}`} checked={card.completed} onChange={event => patchCard(list.id, card.id, { completed: event.target.checked })} className="mt-1 size-4 shrink-0" /><button className={`min-w-0 flex-1 break-words text-left text-sm font-medium ${card.completed ? "text-muted-foreground line-through" : ""}`} onClick={() => setEditing({ kind: "card", listId: list.id, cardId: card.id, initial: card })}>{card.title}</button></div>
          {!!card.attachments?.length && <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><Paperclip className="size-3" aria-hidden="true" />{card.attachments.length} anexos</span>}
          {descriptionText(card) && <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{descriptionText(card)}</p>}
          <div className="mt-3 flex items-center justify-end gap-2"><div className="flex"><Button variant="ghost" size="icon-xs" disabled={!index} aria-label={`Mover ${card.title} para cima`} onClick={() => update(board.lists.map(item => item.id === list.id ? { ...item, cards: reorder(item.cards, index, index - 1) } : item))}><ArrowUp /></Button><Button variant="ghost" size="icon-xs" disabled={index === list.cards.length - 1} aria-label={`Mover ${card.title} para baixo`} onClick={() => update(board.lists.map(item => item.id === list.id ? { ...item, cards: reorder(item.cards, index, index + 1) } : item))}><ArrowDown /></Button><Button variant="ghost" size="icon-xs" aria-label={`Editar card ${card.title}`} onClick={() => setEditing({ kind: "card", listId: list.id, cardId: card.id, initial: card })}><Pencil /></Button><CardAppearance card={card} onChange={patch => patchCard(list.id, card.id, patch)} /><Button variant="ghost" size="icon-xs" aria-label={`Excluir card ${card.title}`} onClick={() => setRemoving({ title: card.title, listId: list.id, cardId: card.id })}><Trash2 /></Button></div></div>
        </article>)}</div>
        <Button variant="ghost" className="mt-3 w-full justify-start" size="sm" onClick={() => setEditing({ kind: "card", listId: list.id, initial: { title: "", description: "", color: "" } })}><Plus />Adicionar card</Button>
      </section>)}
      {!board.lists.length && <p className="py-8 text-sm text-muted-foreground">Adicione uma lista para começar.</p>}
    </div><div className="w-fit rounded-none bg-background/80 px-3 py-2"><BoardsStatus /></div>
    {editing && <BoardDialog title={editing.kind === "card" ? editing.cardId ? "Editar card" : "Criar card" : editing.kind === "list" ? editing.listId ? "Editar lista" : "Criar lista" : "Editar board"} initial={editing.initial} description={editing.kind === "card"} onSave={submit} onClose={() => setEditing(null)} />}
    {removing && <DeleteDialog title={removing.title} onClose={() => setRemoving(null)} onDelete={() => update(removing.cardId ? board.lists.map(list => list.id === removing.listId ? { ...list, cards: list.cards.filter(card => card.id !== removing.cardId) } : list) : board.lists.filter(list => list.id !== removing.listId))} />}
  </main>;
}
