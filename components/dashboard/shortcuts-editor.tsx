"use client";
import { useState, type ComponentType } from "react";
import { RiAddCircleFill, RiArrowDownSLine, RiArrowUpSLine, RiIndeterminateCircleFill } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { maxShortcuts, saveMenuShortcuts } from "@/lib/nodus/shortcuts";

type Item = { href: string; label: string; icon: ComponentType<{ className?: string }> };

/** Escolhe e ordena os atalhos do menu (Nodus: editar atalhos). */
export function ShortcutsEditor({ catalog, chosen, onClose }: { catalog: Item[]; chosen: string[]; onClose: () => void }) {
  const byHref = new Map(catalog.map(item => [item.href, item]));
  const [draft, setDraft] = useState(() => chosen.filter(href => byHref.has(href)));
  const available = catalog.filter(item => !draft.includes(item.href));
  const move = (index: number, step: number) => setDraft(current => { const next = [...current]; const [item] = next.splice(index, 1); next.splice(index + step, 0, item); return next; });
  const row = "flex items-center gap-3 border bg-background px-3 py-2";
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[min(40rem,calc(100dvh-2rem))] overflow-y-auto sm:max-w-md">
    <DialogTitle>Atalhos</DialogTitle>
    <DialogDescription>Escolha e ordene os atalhos do menu. Valem em todos os seus aparelhos.</DialogDescription>
    <section aria-label="Atalhos no menu" className="grid gap-1.5">
      <p className="px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">No menu ({draft.length} de {maxShortcuts})</p>
      {draft.map((href, index) => { const item = byHref.get(href)!; const Icon = item.icon;
        return <div key={href} className={row}>
          <button type="button" aria-label={`Tirar ${item.label}`} title="Tirar" className="text-destructive" onClick={() => setDraft(draft.filter(entry => entry !== href))}><RiIndeterminateCircleFill className="size-6" /></button>
          <Icon className="size-5 text-sidebar-primary" />
          <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>
          <Button type="button" size="icon-xs" variant="ghost" aria-label={`Subir ${item.label}`} disabled={index === 0} onClick={() => move(index, -1)}><RiArrowUpSLine /></Button>
          <Button type="button" size="icon-xs" variant="ghost" aria-label={`Descer ${item.label}`} disabled={index === draft.length - 1} onClick={() => move(index, 1)}><RiArrowDownSLine /></Button>
        </div>; })}
      {!draft.length && <p className="px-1 py-2 text-sm text-muted-foreground">Nenhum atalho no menu.</p>}
    </section>
    {available.length > 0 && <section aria-label="Mais atalhos" className="grid gap-1.5">
      <p className="px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Mais atalhos</p>
      {available.map(item => { const Icon = item.icon;
        return <div key={item.href} className={row}>
          <button type="button" aria-label={`Adicionar ${item.label}`} title={draft.length >= maxShortcuts ? `Até ${maxShortcuts} atalhos` : "Adicionar"} className="text-emerald-600 disabled:opacity-40" disabled={draft.length >= maxShortcuts} onClick={() => setDraft([...draft, item.href])}><RiAddCircleFill className="size-6" /></button>
          <Icon className="size-5 text-sidebar-primary" />
          <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>
        </div>; })}
    </section>}
    <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="button" onClick={() => { saveMenuShortcuts(draft); onClose(); }}>Salvar</Button></DialogFooter>
  </DialogContent></Dialog>;
}
