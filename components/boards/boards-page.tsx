"use client";
import Link from "next/link";
import { useState } from "react";
import { LayoutGrid, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardAppearance, BoardCoverThumbnail } from "./board-appearance";
import { CatalogLayout, CatalogSearch, CatalogTile, CatalogPreview, CatalogFooter, CatalogCreate, CatalogSkeleton, catalogGrid } from "@/components/listing/catalog";
import { useBoards, saveBoard, deleteBoard, newId, defaultLists, retryBoards, type Board } from "@/lib/boards/store";
import { BoardDialog, DeleteDialog } from "./board-dialog";
export function BoardsStatus() {
  const { error, pending } = useBoards();
  return <div className="text-xs text-muted-foreground" aria-live="polite">{error ? <div role="alert" className="flex items-center gap-3 text-destructive">{error}<Button variant="outline" size="sm" onClick={retryBoards}>Tentar novamente</Button></div> : pending ? "Salvando…" : "Salvo no navegador"}</div>;
}
export function BoardsPage() {
  const { boards, loaded } = useBoards();
  const [editing, setEditing] = useState<Board | "new" | null>(null);
  const [deleting, setDeleting] = useState<Board | null>(null);
  const [search, setSearch] = useState("");
  return <CatalogLayout title="Boards" description="Organize tarefas em listas e cards." action={<Button disabled={!loaded} onClick={() => setEditing("new")}><Plus />Novo board</Button>}>
    <CatalogSearch label="Buscar boards" value={search} onChange={setSearch} />
    {!loaded ? <CatalogSkeleton label="Carregando boards" /> : <div className={catalogGrid}>
      {boards.filter(board => board.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).map(board => <CatalogTile key={board.id} style={board.color ? { backgroundColor: `color-mix(in srgb, ${board.color} 18%, var(--card))`, borderColor: `color-mix(in srgb, ${board.color} 40%, var(--border))` } : undefined}>
        <Link href={`/dashboard/boards/${board.id}`} className="block outline-none hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-ring"><CatalogPreview style={board.color ? { backgroundColor: `color-mix(in srgb, ${board.color} 30%, var(--card))` } : undefined}>{board.cover ? <BoardCoverThumbnail key={board.cover.id} cover={board.cover} position={board.coverPosition} /> : <LayoutGrid className="size-8 text-primary" />}</CatalogPreview><h2 className="break-words px-4 py-3 font-semibold">{board.title}</h2></Link>
        <CatalogFooter><span className="text-xs text-muted-foreground">{board.lists.length} listas · {board.lists.reduce((sum, list) => sum + list.cards.length, 0)} cards</span><div className="flex"><Button variant="ghost" size="icon-sm" aria-label={`Editar ${board.title}`} onClick={() => setEditing(board)}><Pencil /></Button><BoardAppearance board={board} /><Button variant="ghost" size="icon-sm" aria-label={`Excluir ${board.title}`} onClick={() => setDeleting(board)}><Trash2 /></Button></div></CatalogFooter>
      </CatalogTile>)}
      <CatalogCreate label="Criar board" onClick={() => setEditing("new")} />
    </div>}
    {loaded && !boards.length && <p className="text-sm text-muted-foreground">Crie seu primeiro board para começar.</p>}<BoardsStatus />
    {editing && <BoardDialog title={editing === "new" ? "Criar board" : "Editar board"} initial={editing === "new" ? { title: "", color: "" } : editing} onClose={() => setEditing(null)} onSave={value => saveBoard(editing === "new" ? { ...value, id: newId(), lists: defaultLists(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : { ...editing, ...value })} />}
    {deleting && <DeleteDialog title={deleting.title} onClose={() => setDeleting(null)} onDelete={() => deleteBoard(deleting.id)} />}
  </CatalogLayout>;
}
