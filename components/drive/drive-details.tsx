import type { ComponentType } from "react";
import { RiEyeLine, RiFolderTransferLine, RiHardDrive2Line, RiLink, RiLockLine, RiTimeLine } from "@remixicon/react";
import { ItemIcon } from "./item-icon";
import { descendants, folderSize } from "@/lib/drive/client";
import { formatBytes } from "@/lib/drive/files";
import type { DriveItem } from "@/lib/nodus/stores";

const date = (value: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

function Row({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div></div>;
}

export function DriveDetails({ item, count, all, showLocation }: { item: DriveItem | null; count: number; all: DriveItem[]; showLocation: boolean }) {
  return <aside aria-label="Detalhes" className="hidden w-64 shrink-0 overflow-y-auto border-l p-4 text-sm lg:block">
    {!item ? <p className="grid h-full place-items-center text-center text-muted-foreground">{count > 1 ? `${count} itens selecionados.` : "Selecione um item para ver os detalhes."}</p> : <>
      <div className="grid justify-items-center gap-2 pb-4 text-center"><ItemIcon item={item} className="size-20" /><p className="max-w-full break-words font-medium">{item.name}</p></div>
      <dl className="grid gap-3">
        <Row icon={RiHardDrive2Line} label={item.kind === "file" ? "Tamanho" : "Conteúdo"} value={item.kind === "file" ? formatBytes(item.file?.size ?? 0) : `${descendants(all, item.id).length} itens · ${formatBytes(folderSize(all, item))}`} />
        <Row icon={RiTimeLine} label="Alterado em" value={date(item.updatedAt)} />
        <Row icon={RiTimeLine} label="Criado em" value={date(item.createdAt)} />
        {item.openedAt && <Row icon={RiEyeLine} label="Aberto em" value={date(item.openedAt)} />}
        <Row icon={item.shareToken ? RiLink : RiLockLine} label="Acesso" value={item.shareToken ? "Qualquer pessoa com o link" : "Privado"} />
        {showLocation && <Row icon={RiFolderTransferLine} label="Local" value={all.find(entry => entry.id === item.parentId)?.name ?? "Meu Drive"} />}
      </dl>
    </>}
  </aside>;
}
