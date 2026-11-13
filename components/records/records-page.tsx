"use client";
import { useState, type ReactNode } from "react";
import { RiAddLine as Plus, RiDeleteBinLine as Trash2, RiPencilLine as Pencil } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CatalogCreate, CatalogFooter, CatalogLayout, CatalogSearch, CatalogSkeleton, CatalogTile, catalogGrid } from "@/components/listing/catalog";
import { RecordDialog, type FieldDef, type FormValues } from "./record-form";
import { selectClass } from "@/components/ui/field";
import { fieldsOf, matchesText, type RecordStore, type StoredRecord } from "@/lib/records/store";
import { useLookup, type Lookup } from "@/lib/records/references";

export type CardView = { title: string; subtitle?: string; lines?: (string | false | undefined)[]; badge?: { label: string; color?: string }; accent?: string; body?: ReactNode };
export type Filter<F> = { label: string; options: { value: string; label: string }[]; test: (record: StoredRecord<F>, value: string) => boolean };

export type RecordsConfig<F extends object> = {
  store: RecordStore<F>;
  section: string; title: string; description: string;
  singular: string; newLabel: string; submitLabel: string; emptyText: string;
  empty: () => F; fields: FieldDef[];
  card: (record: StoredRecord<F>, lookup: Lookup) => CardView;
  searchText: (record: StoredRecord<F>, lookup: Lookup) => unknown[];
  sort?: (a: StoredRecord<F>, b: StoredRecord<F>) => number;
  validate?: (values: FormValues) => string;
  filter?: Filter<F>;
  quickAction?: (record: StoredRecord<F>) => { label: string; run: () => void } | null;
  /** Ações extras no rodapé do card (ex.: imprimir a ordem). */
  cardActions?: (record: StoredRecord<F>) => ReactNode;
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
export function formatDate(value?: string) {
  if (!value) return "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : value.includes("T") ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date) : dateFormat.format(date);
}

export function RecordsPage<F extends object>({ config, initialId = "", extra }: { config: RecordsConfig<F>; initialId?: string; extra?: ReactNode }) {
  const { records, loaded, pending, error } = config.store.useRecords();
  const lookup = useLookup();
  const [manualEditing, setEditing] = useState<StoredRecord<F> | "new" | null | undefined>();
  const editing = manualEditing === undefined ? records.find(record => record.id === initialId) ?? null : manualEditing;
  const [deleting, setDeleting] = useState<StoredRecord<F> | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const filtered = records
    .filter(record => matchesText(config.searchText(record, lookup), search) && (!filter || !config.filter || config.filter.test(record, filter)))
    .sort(config.sort ?? ((a, b) => b.createdAt.localeCompare(a.createdAt)));
  const current = editing && editing !== "new" ? editing : undefined;
  return <CatalogLayout section={config.section} title={config.title} description={config.description} action={<Button disabled={!loaded} onClick={() => setEditing("new")}><Plus />{config.newLabel}</Button>}>
    {extra}
    <div className="flex flex-wrap items-end gap-4"><div className="min-w-60 flex-1"><CatalogSearch label={`Buscar ${config.title.toLocaleLowerCase("pt-BR")}`} value={search} onChange={setSearch} /></div>
      {config.filter && <label className="grid gap-1 text-xs text-muted-foreground">{config.filter.label}<select className={`${selectClass} min-w-44`} value={filter} onChange={event => setFilter(event.target.value)}><option value="">Todos</option>{config.filter.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}</div>
    {!loaded ? <CatalogSkeleton label={`Carregando ${config.title.toLocaleLowerCase("pt-BR")}`} /> : <><p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "registro" : "registros"}</p><div className={catalogGrid}>{filtered.map(record => {
      const view = config.card(record, lookup);
      const action = config.quickAction?.(record);
      return <CatalogTile key={record.id} style={view.accent ? { borderTop: `3px solid ${view.accent}` } : undefined}>
        <button className="min-w-0 flex-1 space-y-3 p-5 text-left outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Abrir ${config.singular} ${view.title}`} onClick={() => setEditing(record)}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{record.code}</p><h2 className="mt-1 break-words font-semibold">{view.title}</h2>{view.subtitle && <p className="mt-1 text-xs text-muted-foreground">{view.subtitle}</p>}</div>
            {view.badge && <Badge color={view.badge.color}>{view.badge.label}</Badge>}</div>
          {view.lines && <div className="space-y-1 text-xs text-muted-foreground">{view.lines.filter(Boolean).map(line => <p key={line as string} className="break-words">{line}</p>)}</div>}
          {view.body}
        </button>
        <CatalogFooter><span className="text-xs text-muted-foreground">{dateFormat.format(new Date(record.createdAt))}</span><div className="flex items-center">{action && <Button variant="ghost" size="xs" onClick={action.run}>{action.label}</Button>}{config.cardActions?.(record)}<Button variant="ghost" size="icon-sm" aria-label={`Editar ${config.singular} ${view.title}`} onClick={() => setEditing(record)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Excluir ${config.singular} ${view.title}`} onClick={() => setDeleting(record)}><Trash2 /></Button></div></CatalogFooter>
      </CatalogTile>;
    })}{!search.trim() && !filter && <CatalogCreate label={config.newLabel} onClick={() => setEditing("new")} />}</div>{!filtered.length && <p className="text-sm text-muted-foreground">{search.trim() || filter ? "Nenhum registro encontrado." : config.emptyText}</p>}</>}
    <div aria-live="polite" className="text-xs text-muted-foreground">{error ? <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">{error}<Button variant="outline" size="sm" onClick={config.store.retry}>Tentar novamente</Button></div> : pending ? "Salvando…" : loaded ? "Salvo na sua conta" : "Carregando…"}</div>
    {editing && <RecordDialog key={current?.id ?? "new"} title={current ? `Editar ${config.singular}` : config.newLabel} description={config.description} fields={config.fields} record={current}
      initial={{ ...config.empty(), ...current } as FormValues} submitLabel={config.submitLabel} validate={config.validate}
      onSave={values => config.store.save(fieldsOf<F>(values), current?.id)} onClose={() => setEditing(null)} />}
    {deleting && <ConfirmDialog title={`Excluir ${config.singular}?`} description={`${config.card(deleting, lookup).title} será removido. Esta ação não pode ser desfeita.`} onConfirm={() => config.store.remove(deleting.id)} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
