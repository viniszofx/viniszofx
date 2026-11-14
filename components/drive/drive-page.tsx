"use client";
import { surfaceVariants } from "@/components/ui/card";
import { useCallback, useRef, useState, type KeyboardEvent, type MouseEvent, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine, RiDownloadLine, RiEyeLine, RiFileCopyLine, RiFileExcel2Line, RiFilePdf2Line, RiFileWord2Line, RiFolderAddLine, RiFolderTransferLine, RiFolderUploadLine, RiLink, RiPencilLine, RiUploadLine } from "@remixicon/react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ContextMenu } from "@/components/ui/context-menu";
import { NameDialog } from "@/components/ui/name-dialog";
import { ActionList, type Action } from "@/components/ui/action-button";
import { EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { DriveBreadcrumb } from "./drive-breadcrumb";
import { DriveDetails } from "./drive-details";
import { DriveGrid, DriveList } from "./drive-items";
import { DRIVE_SECTIONS, DriveSidebar, type DriveView } from "./drive-sidebar";
import { DriveSelectionBar, DriveToolbar } from "./drive-toolbar";
import { DriveViewControls, type DrivePreset, type DriveSort } from "./drive-view-controls";
import { FolderColorMenu } from "./folder-color-menu";
import { MoveDialog } from "./move-dialog";
import { ShareDialog } from "./share-dialog";
import { useItemDrag } from "./use-item-drag";
import { usePreference } from "./use-preference";
import { useSelection } from "./use-selection";
import { createFolder, createOfficeFile, duplicateDriveItems, folderSize, moveDriveItems, paintFolder, readDriveFile, removeDriveItems, renameDriveItem, uploadDriveFolder, uploadToDrive, zipDriveItems } from "@/lib/drive/client";
import { DRIVE_FILE_LIMIT, saveBlob } from "@/lib/drive/files";
import { driveStore, type DriveItem } from "@/lib/nodus/stores";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";
import { cn } from "@/lib/utils";

export type { DriveView };
type Naming = { mode: "rename"; item: DriveItem } | { mode: "folder" | "docx" | "xlsx" | "pdf" };
const NAMING_TITLES = { rename: "Renomear", folder: "Nova pasta", docx: "Novo documento", xlsx: "Nova planilha", pdf: "Novo PDF" } as const;

function sortItems(items: DriveItem[], all: DriveItem[], sort: DriveSort) {
  return [...items].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    if (sort === "date") return b.updatedAt.localeCompare(a.updatedAt);
    if (sort === "size") return folderSize(all, b) - folderSize(all, a);
    return a.name.localeCompare(b.name, "pt-BR", { numeric: true });
  });
}

function itemsFor(view: DriveView, all: DriveItem[], parentId: string, sort: DriveSort) {
  if (view === "recent") return all.filter(item => item.kind === "file").sort((a, b) => (b.openedAt ?? b.updatedAt).localeCompare(a.openedAt ?? a.updatedAt)).slice(0, 50);
  if (view === "links") return sortItems(all.filter(item => item.shareToken), all, sort);
  if (view === "shared") return sortItems(all.filter(item => item.visibility === "organization"), all, sort);
  if (view === "public") return sortItems(all.filter(item => item.visibility === "public" || item.shareToken), all, sort);
  return sortItems(all.filter(item => item.parentId === parentId), all, sort);
}

const NARROW = "(max-width: 767px)";
const subscribeNarrow = (notify: () => void) => { const query = window.matchMedia(NARROW); query.addEventListener("change", notify); return () => query.removeEventListener("change", notify); };

export function DrivePage({ view, folderId }: { view: DriveView; folderId: string }) {
  const router = useRouter();
  const { records, loaded, pending, error } = driveStore.useRecords();
  const [layout, setLayout] = usePreference<"grid" | "list">("viniszofx-drive-layout", "grid", ["grid", "list"]);
  const [sort, setSort] = usePreference<DriveSort>("viniszofx-drive-sort", "name", ["name", "date", "size"]);
  const [details, setDetails] = useState(false);
  const [preset, setPreset] = usePreference<DrivePreset>("viniszofx-drive-preset", "overview", ["overview", "recent", "compact", "detailed"]);
  const [menu, setMenu] = useState<{ x: number; y: number; target: "item" | "background" } | null>(null);
  const [naming, setNaming] = useState<Naming | null>(null);
  const [moving, setMoving] = useState<DriveItem[] | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<DriveItem[] | null>(null);
  const [fileDrag, setFileDrag] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [zipping, setZipping] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  const folder = records.find(item => item.id === folderId && item.kind === "folder");
  const parentId = view === "drive" && folder ? folder.id : "";
  const path: DriveItem[] = [];
  for (let current = folder; current; current = records.find(item => item.id === current!.parentId)) path.unshift(current);
  const items = itemsFor(view, records, parentId, sort);
  const { selectedIds, setSelectedIds, pick, rect, areaProps } = useSelection(items.map(item => item.id));
  const selectedItems = items.filter(item => selectedIds.includes(item.id));
  const selected = selectedItems.length === 1 ? selectedItems[0] : null;
  function applyPreset(next: DrivePreset) {
    setPreset(next);
    if (next === "overview") { setLayout("grid"); setSort("name"); setDetails(false); }
    if (next === "recent") { setLayout("list"); setSort("date"); setDetails(false); }
    if (next === "compact") { setLayout("list"); setSort("name"); setDetails(false); }
    if (next === "detailed") { setLayout("list"); setSort("date"); setDetails(true); }
    if (next === "recent" && view !== "recent") go("recent");
    if (next !== "recent" && view === "recent") go("drive");
  }
  const canAdd = view === "drive" && loaded;
  const drag = useItemDrag({ enabled: view === "drive", parentId, selectedIds, select: setSelectedIds, onMove: move });

  function go(next: DriveView, target = "") {
    setSelectedIds([]);
    router.push(next === "drive" ? (target ? `/dashboard/drive?folder=${target}` : "/dashboard/drive") : `/dashboard/drive?view=${next}`);
  }
  const open = (item: DriveItem) => item.kind === "folder" ? go("drive", item.id) : router.push(`/dashboard/drive/${item.id}`);

  function move(ids: string[], destination: string) {
    if (!moveDriveItems(ids, destination)) return notifyError("Destino inválido", "Uma pasta não pode ir para dentro dela mesma.");
    setMoving(null); setSelectedIds([]);
  }

  async function upload(files: File[]) {
    if (!files.length || !canAdd) return;
    const tooBig = files.filter(file => file.size > DRIVE_FILE_LIMIT);
    if (tooBig.length) notifyError("Acima de 10 MB, não enviado", tooBig.map(file => file.name).join(", "));
    const accepted = files.filter(file => file.size > 0 && file.size <= DRIVE_FILE_LIMIT);
    setUploading(count => count + accepted.length);
    let sent = 0;
    for (const file of accepted) {
      try { await uploadToDrive(file, parentId); sent++; }
      catch (cause) { notifyError(`Falha ao enviar ${file.name}`, cause instanceof Error ? cause.message : undefined); }
      finally { setUploading(count => count - 1); }
    }
    if (sent > 1) notifySuccess(`${sent} arquivos enviados`);
  }

  async function download(targets: DriveItem[]) {
    if (!targets.length || zipping) return;
    setZipping(true);
    try {
      const single = targets.length === 1 && targets[0].kind === "file";
      saveBlob(single ? await readDriveFile(targets[0]) : await zipDriveItems(records, targets), single ? targets[0].name : `${targets.length === 1 ? targets[0].name : "Arquivos do Drive"}.zip`);
    } catch (cause) { notifyError("Não foi possível baixar", cause instanceof Error ? cause.message : undefined); }
    finally { setZipping(false); }
  }

  async function duplicate(targets: DriveItem[]) {
    if (!targets.length) return;
    setZipping(true);
    try {
      const created = await duplicateDriveItems(records, targets);
      setSelectedIds(created.filter(item => item.parentId === parentId).map(item => item.id));
      notifySuccess(created.length === 1 ? "Item duplicado" : `${created.length} itens duplicados`);
    } catch (cause) { notifyError("Não foi possível duplicar", cause instanceof Error ? cause.message : undefined); }
    finally { setZipping(false); }
  }

  async function uploadFolder(files: File[]) {
    if (!canAdd) return;
    const accepted = files.filter(file => file.size > 0 && file.size <= DRIVE_FILE_LIMIT);
    const tooBig = files.filter(file => file.size > DRIVE_FILE_LIMIT);
    if (tooBig.length) notifyError("Acima de 10 MB, não enviados", tooBig.map(file => file.name).join(", "));
    try {
      const created = await uploadDriveFolder(accepted, parentId);
      if (created.length) notifySuccess("Pasta enviada", `${created.length} itens enviados.`);
    } catch (cause) { notifyError("Falha ao enviar pasta", cause instanceof Error ? cause.message : undefined); }
  }

  async function submitName(name: string) {
    if (!naming) return;
    if (naming.mode === "rename") renameDriveItem(naming.item, name);
    else if (naming.mode === "folder") createFolder(name, parentId);
    else await createOfficeFile(naming.mode, name, parentId).catch(cause => notifyError("Não foi possível criar o arquivo", cause instanceof Error ? cause.message : undefined));
  }

  const downloadLabel = zipping ? "Compactando…" : "Baixar";
  const actions: Action[] = selected ? [
    { key: "open", label: "Abrir", icon: RiEyeLine, run: () => open(selected) },
    { key: "download", label: downloadLabel, icon: RiDownloadLine, run: () => void download([selected]) },
    { key: "share", label: selected.shareToken ? "Link ativo" : "Compartilhar", icon: RiLink, run: () => setSharing(selected.id) },
    { key: "rename", label: "Renomear", icon: RiPencilLine, run: () => setNaming({ mode: "rename", item: selected }) },
    { key: "move", label: "Mover", icon: RiFolderTransferLine, run: () => setMoving([selected]) },
    { key: "duplicate", label: "Duplicar", icon: RiFileCopyLine, run: () => void duplicate([selected]) },
    { key: "remove", label: "Excluir", icon: RiDeleteBinLine, run: () => setRemoving([selected]), destructive: true },
  ] : selectedItems.length > 1 ? [
    { key: "move", label: "Mover", icon: RiFolderTransferLine, run: () => setMoving(selectedItems) },
    { key: "duplicate", label: "Duplicar", icon: RiFileCopyLine, run: () => void duplicate(selectedItems) },
    { key: "download", label: downloadLabel, icon: RiDownloadLine, run: () => void download(selectedItems) },
    { key: "remove", label: "Excluir", icon: RiDeleteBinLine, run: () => setRemoving(selectedItems), destructive: true },
  ] : [];
  const createActions: Action[] = [
    { key: "folder", label: "Nova pasta", icon: RiFolderAddLine, run: () => setNaming({ mode: "folder" }) },
    { key: "docx", label: "Novo documento", icon: RiFileWord2Line, run: () => setNaming({ mode: "docx" }) },
    { key: "xlsx", label: "Nova planilha", icon: RiFileExcel2Line, run: () => setNaming({ mode: "xlsx" }) },
    { key: "pdf", label: "Novo PDF", icon: RiFilePdf2Line, run: () => setNaming({ mode: "pdf" }) },
  ];

  const itemProps = (item: DriveItem) => ({
    ...drag.draggable(item),
    onClick: (event: MouseEvent) => window.matchMedia("(pointer: coarse)").matches && selected?.id === item.id ? open(item) : pick(event, item.id),
    onDoubleClick: () => open(item),
    onContextMenu: (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); if (!selectedIds.includes(item.id)) setSelectedIds([item.id]); setMenu({ x: event.clientX, y: event.clientY, target: "item" }); },
    onKeyDown: (event: KeyboardEvent) => { if (event.key === "Enter") { event.preventDefault(); open(item); } },
  });

  function onKeyDown(event: KeyboardEvent) {
    if ((event.target as HTMLElement).closest("input, textarea, select, [role=dialog]")) return;
    if (event.key === "Escape") setSelectedIds([]);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") { event.preventDefault(); setSelectedIds(items.map(item => item.id)); }
    if (event.key === "Delete" && selectedItems.length) setRemoving(selectedItems);
    if (event.key === "F2" && selected) setNaming({ mode: "rename", item: selected });
  }

  const missingFolder = loaded && view === "drive" && !!folderId && !folder;
  const status = uploading ? `Enviando ${uploading} arquivo(s)…` : pending ? "Salvando…" : error;
  const ItemView = layout === "grid" ? DriveGrid : DriveList;
  const narrow = useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);
  const selectionMode = selectedItems.length > 0;
  const folderColor = selected?.kind === "folder" ? <FolderColorMenu value={selected.color} onChange={color => paintFolder(selected, color)} /> : null;
  const sharedItem = records.find(item => item.id === sharing);

  return <main className="flex w-full max-w-none min-w-0 flex-col gap-4 md:min-h-[calc(100svh-57px)] md:px-6 md:py-4 lg:px-8" onKeyDown={onKeyDown}>
    <header className="max-md:hidden"><p className="text-xs uppercase tracking-widest text-primary">Ferramentas</p><h1 className="mt-2 font-heading text-3xl font-semibold">Drive</h1></header>
    <input ref={uploadInput} type="file" multiple className="sr-only" aria-label="Enviar arquivos" onChange={event => { void upload([...(event.target.files ?? [])]); event.target.value = ""; }} />
    <input ref={element => { if (element) element.setAttribute("webkitdirectory", ""); folderInput.current = element; }} type="file" multiple className="sr-only" aria-label="Enviar pasta" onChange={event => { void uploadFolder([...(event.target.files ?? [])]); event.target.value = ""; }} />
    <div className={cn(surfaceVariants(), "flex min-w-0 flex-col overflow-hidden md:min-h-[min(70svh,42rem)] md:flex-1 md:flex-row max-md:h-[calc(100dvh-5.5rem-1px-3.5rem-env(safe-area-inset-bottom))] max-md:rounded-none max-md:border-0")}>
      <DriveSidebar view={view} usedBytes={records.reduce((sum, item) => sum + (item.file?.size ?? 0), 0)} files={records.filter(item => item.kind === "file").length} onSelect={next => go(next)} rootDrop={{ highlighted: drag.isDropTarget(""), props: drag.dropTarget("") }} hidden={narrow && selectionMode} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DriveToolbar actions={actions} createActions={createActions} canAdd={canAdd} selectedCount={selectedItems.length} total={items.length} narrow={narrow} extra={folderColor}
          onUpload={() => uploadInput.current?.click()} onUploadFolder={() => folderInput.current?.click()} onClear={() => setSelectedIds([])} onSelectAll={() => setSelectedIds(items.map(item => item.id))}
          breadcrumb={<DriveBreadcrumb root={DRIVE_SECTIONS.find(entry => entry.view === view)!.label} path={view === "drive" ? path : []} droppable={view === "drive"} drag={drag} onOpen={id => go(view, id)} />}
          viewControls={<DriveViewControls sort={view === "recent" ? undefined : sort} onSort={setSort} preset={preset} onPreset={applyPreset} />} />
        <div className="flex min-h-0 flex-1">
          <div tabIndex={-1} {...areaProps} className={cn("relative min-h-72 min-w-0 flex-1 overflow-auto p-3 outline-none sm:p-4", fileDrag && "bg-primary/5 ring-2 ring-primary ring-inset")}
            onContextMenu={event => { if (!canAdd) return; event.preventDefault(); setSelectedIds([]); setMenu({ x: event.clientX, y: event.clientY, target: "background" }); }}
            onDragOver={event => { if (drag.dragging || !event.dataTransfer.types.includes("Files")) return; event.preventDefault(); if (canAdd) setFileDrag(true); }}
            onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFileDrag(false); }}
            onDrop={event => { event.preventDefault(); setFileDrag(false); if (drag.dragging) drag.reset(); else void upload([...event.dataTransfer.files]); }}>
            {rect && <div aria-hidden="true" className="pointer-events-none absolute z-10 border border-primary bg-primary/10 transition-[left,top,width,height] duration-75" style={rect} />}
            {!loaded ? <LoadingBlock label="Carregando Drive" />
              : missingFolder ? <EmptyState>Pasta não encontrada.</EmptyState>
              : !items.length ? <EmptyState className="min-h-60">{view === "recent" ? "Nenhum arquivo ainda." : view === "links" ? "Nenhum arquivo com link público." : view === "shared" ? "Nenhum item compartilhado com a organização." : view === "public" ? "Nenhum item público." : "Arraste arquivos para cá ou use Novo."}</EmptyState>
              : <ItemView items={items} all={records} selectedIds={selectedIds} isDropTarget={drag.isDropTarget} itemProps={itemProps} />}
          </div>
          {details && <DriveDetails item={selected} count={selectedItems.length} all={records} showLocation={view !== "drive"} />}
        </div>
        {narrow && selectionMode && <DriveSelectionBar actions={actions} extra={folderColor} />}
        <footer className={cn("flex flex-wrap justify-between gap-2 border-t bg-foreground/[0.03] px-3 py-1.5 text-xs text-muted-foreground", narrow && selectionMode && "hidden")}><span>{items.length === 1 ? "1 item" : `${items.length} itens`} · Até 10 MB por arquivo</span><span aria-live="polite" className={cn(error && !uploading && !pending && "text-destructive")}>{status}</span></footer>
      </div>
    </div>
    <p className="text-xs text-muted-foreground max-md:hidden">Atalhos: clique seleciona, duplo clique abre, Ctrl/⌘ e Shift selecionam vários, arraste para mover, F2 renomeia, Delete exclui, Ctrl+A seleciona tudo.</p>
    {menu && (menu.target === "background" || selectedItems.length > 0) && <ContextMenu x={menu.x} y={menu.y} label={menu.target === "background" ? "Atalhos do Drive" : "Ações do item"} onClose={closeMenu}>
      <ActionList showLabel actions={menu.target === "item" ? actions : [...createActions, { key: "upload", label: "Enviar arquivos", icon: RiUploadLine, run: () => uploadInput.current?.click() }, { key: "upload-folder", label: "Enviar pasta", icon: RiFolderUploadLine, run: () => folderInput.current?.click() }]} />
    </ContextMenu>}
    {naming && <NameDialog title={NAMING_TITLES[naming.mode]} description={naming.mode === "rename" ? naming.item.name : "Será criado no local atual."} initial={naming.mode === "rename" ? naming.item.name : ""}
      submitLabel={naming.mode === "rename" ? "Salvar" : "Criar"} keepExtension={naming.mode === "rename" && naming.item.kind === "file"} onSubmit={submitName} onClose={() => setNaming(null)} />}
    {moving && <MoveDialog items={moving} all={records} initial={moving.length === 1 ? moving[0].parentId : parentId} onMove={destination => move(moving.map(item => item.id), destination)} onClose={() => setMoving(null)} />}
    {sharedItem && <ShareDialog item={sharedItem} onClose={() => setSharing(null)} />}
    {removing && <ConfirmDialog title={removing.length > 1 ? `Excluir ${removing.length} itens?` : removing[0].kind === "folder" ? "Excluir pasta?" : "Excluir arquivo?"}
      description={removing.length > 1 ? "Os itens selecionados e o conteúdo das pastas serão excluídos." : removing[0].kind === "folder" ? `A pasta ${removing[0].name} e tudo dentro dela serão excluídos.` : `${removing[0].name} será excluído.`}
      onConfirm={() => { removeDriveItems(removing); setSelectedIds([]); }} onClose={() => setRemoving(null)} />}
  </main>;
}
