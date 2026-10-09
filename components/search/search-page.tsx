"use client";
import Link from "next/link";
import { RiHotelLine as Hotel, RiCarLine as Car, RiSuitcaseLine as Suitcase, RiFileTextLine as FileText, RiLayoutGridLine as LayoutGrid, RiListCheck as List, RiCheckboxLine as SquareCheck, RiArrowRightUpLine as ArrowUpRight, RiSearchLine as Search, RiGroupLine as Users } from "@remixicon/react";
import { CatalogLayout, CatalogPreview, CatalogTile, CatalogSkeleton, catalogGrid } from "@/components/listing/catalog";
import { useLocalSearch, type SearchEntry } from "@/lib/search/use-local-search";
const icons = { Notes: FileText, Boards: LayoutGrid, Listas: List, Cards: SquareCheck, Clients: Users, Employees: Users, Trip: Suitcase, Fleet: Car, Reservations: Hotel, Páginas: ArrowUpRight };
export function SearchPage({ query }: { query: string }) {
  const { results, loaded, error } = useLocalSearch(query);
  const groups: SearchEntry["kind"][] = ["Notes", "Boards", "Listas", "Cards", "Clients", "Employees", "Trip", "Fleet", "Reservations", "Páginas"];
  return <CatalogLayout title="Busca global" description={query.trim() ? `Resultados para “${query.trim()}”` : "Pesquise Notes, boards, listas, cards, clientes, viagens e páginas pelo header."}>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!query.trim() ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Search className="size-4" />Digite sua busca no header.</p> : !loaded ? <CatalogSkeleton label="Buscando no navegador" /> : <>
      <p role="status" className="text-xs text-muted-foreground">{results.length} resultados</p>
      {groups.map(kind => { const items = results.filter(entry => entry.kind === kind); if (!items.length) return null; const Icon = icons[kind];return <section key={kind} aria-label={kind} className="space-y-4"><h2 className="font-heading text-lg font-semibold">{kind} <span className="text-xs text-muted-foreground">({items.length})</span></h2><div className={catalogGrid}>{items.map(entry => <CatalogTile key={entry.id}><Link href={entry.href} className="block outline-none hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-ring"><CatalogPreview><Icon className="size-8 text-primary" /></CatalogPreview><h3 className="break-words px-4 py-3 font-semibold">{entry.title}</h3><p className="break-words px-4 pb-3 text-xs text-muted-foreground">{entry.context}</p></Link></CatalogTile>)}</div></section>; })}
      {!results.length && <p className="text-sm text-muted-foreground">Nenhum resultado encontrado. Tente outro termo.</p>}
    </>}
  </CatalogLayout>;
}
