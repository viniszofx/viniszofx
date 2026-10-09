"use client";
import { useObjectUrl } from "@/lib/browser/use-object-url";
import { useState } from "react";
import { RiAttachmentLine as Paperclip, RiDeleteBinLine as Trash2, RiDownloadLine as Download, RiImageAddLine as ImagePlus, RiMoreLine as MoreHorizontal } from "@remixicon/react";
import { Menu } from "@base-ui/react/menu";
import { DashboardMenuPopup, menuItemClass } from "@/components/dashboard/menu-popup";
import { Button } from "@/components/ui/button";
import type { CardAttachment } from "@/lib/boards/store";
function Attachment({ file, onRemove, onCover, isCover }: { file: CardAttachment; onRemove: () => void; onCover?: () => void; isCover?: boolean }) {
  const url = useObjectUrl(file.blob);
  return <article className="flex min-w-0 items-center gap-3 rounded-none border p-3">
    {file.type.startsWith("image/") && <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${file.name}`}>
      {/* Local blobs cannot use Next's image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={file.name} className="size-14 rounded-none object-cover" />
    </a>}
    <div className="min-w-0 flex-1"><a href={url} target="_blank" rel="noopener noreferrer" className="block break-words text-sm underline">{file.name}</a><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p></div>
    <Menu.Root>
      <Menu.Trigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Opções de ${file.name}`} />}><MoreHorizontal /></Menu.Trigger>
      <DashboardMenuPopup>
        {file.type.startsWith("image/") && onCover && <Menu.Item className={menuItemClass} aria-label={`${isCover ? "Remover capa" : "Usar como capa"} ${file.name}`} onClick={onCover}><ImagePlus className="size-4" />{isCover ? "Remover capa" : "Usar como capa"}</Menu.Item>}
        <Menu.Item render={<a href={url} download={file.name} />} className={menuItemClass} aria-label={`Baixar ${file.name}`}><Download className="size-4" />Baixar</Menu.Item>
        <Menu.Separator className="my-1 border-t" />
        <Menu.Item className={`${menuItemClass} text-destructive`} aria-label={`Remover anexo ${file.name}`} onClick={onRemove}><Trash2 className="size-4" />Remover anexo</Menu.Item>
      </DashboardMenuPopup>
    </Menu.Root>
  </article>;
}
export function CardAttachments({ files, onRemove, onCover, coverId }: { files: CardAttachment[]; onRemove: (id: string) => void; onCover?: (id: string | null) => void; coverId?: string | null }) {
  const [all, setAll] = useState(false);
  if (!files.length) return null;
  return <section className="space-y-2"><h3 className="flex items-center gap-2 text-sm font-semibold"><Paperclip className="size-4" />Anexos ({files.length})</h3>{(all ? files : files.slice(0, 3)).map(file => <Attachment key={file.id} file={file} onRemove={() => onRemove(file.id)} isCover={coverId === file.id} onCover={onCover ? () => onCover(coverId === file.id ? null : file.id) : undefined} />)}{files.length > 3 && <Button type="button" variant="ghost" size="sm" onClick={() => setAll(!all)}>{all ? "Mostrar menos" : `Mostrar todos (${files.length})`}</Button>}</section>;
}
