"use client";
import { useState } from "react";
import { RiAttachmentLine, RiCarLine as Users, RiAddLine as Plus, RiPencilLine as Pencil, RiDeleteBinLine as Trash2 } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CatalogLayout, CatalogSearch, CatalogTile, CatalogFooter, CatalogCreate, CatalogSkeleton, catalogGrid } from "@/components/listing/catalog";
import { useVehicles, deleteVehicle, retryVehicles, matchesVehicle, type Vehicle } from "@/lib/fleet/store";
import { VehicleDialog } from "./vehicle-dialog";

export function FleetPage({ initialVehicleId = "" }: { initialVehicleId?: string }) {
  const { vehicles, loaded, pending, error } = useVehicles();
  const [manualEditing, setEditing] = useState<Vehicle | "new" | null | undefined>();
  const editing = manualEditing === undefined ? vehicles.find(vehicle => vehicle.id === initialVehicleId) ?? null : manualEditing;
  const [deleting, setDeleting] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState("");
  const filtered = vehicles.filter(vehicle => matchesVehicle(vehicle, search)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return <CatalogLayout section="Meu painel" title="Fleet" description="Gerencie os veículos da sua frota." action={<Button disabled={!loaded} onClick={() => setEditing("new")}><Plus />New vehicle</Button>}>
    <CatalogSearch label="Buscar veículos" value={search} onChange={setSearch} />
    {!loaded ? <CatalogSkeleton label="Carregando veículos" /> : <><p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "veículo" : "veículos"}</p><div className={catalogGrid}>{filtered.map(vehicle => <CatalogTile key={vehicle.id}>
      <button className="min-w-0 flex-1 space-y-4 p-5 text-left outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Abrir veículo ${vehicle.name}`} onClick={() => setEditing(vehicle)}><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center bg-primary/10"><Users className="size-5 text-primary" /></span><div className="min-w-0"><h2 className="break-words font-semibold">{vehicle.name}</h2><p className="mt-2 font-mono text-xs text-muted-foreground">Código: {vehicle.code}</p></div></div><div className="space-y-2 text-xs text-muted-foreground"><p>{[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" · ") || "Marca e modelo não informados."}</p><p>{vehicle.type}{vehicle.plate && ` · ${vehicle.plate}`}</p>{!!vehicle.attachments?.length && <p className="flex items-center gap-1"><RiAttachmentLine className="size-3.5" />{vehicle.attachments.length} anexos</p>}</div>{vehicle.notes && <p className="line-clamp-2 break-words text-xs text-muted-foreground">{vehicle.notes}</p>}</button>
      <CatalogFooter><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(vehicle.createdAt))}</span><div className="flex"><Button variant="ghost" size="icon-sm" aria-label={`Editar veículo ${vehicle.name}`} onClick={() => setEditing(vehicle)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Excluir veículo ${vehicle.name}`} onClick={() => setDeleting(vehicle)}><Trash2 /></Button></div></CatalogFooter>
    </CatalogTile>)}{!search.trim() && <CatalogCreate label="Criar veículo" onClick={() => setEditing("new")} />}</div>{!filtered.length && <p className="text-sm text-muted-foreground">{search.trim() ? "Nenhum veículo encontrado. Tente outro termo." : "Cadastre seu primeiro veículo para começar."}</p>}</>}
    <div aria-live="polite" className="text-xs text-muted-foreground">{error ? <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">{error}<Button variant="outline" size="sm" onClick={retryVehicles}>Tentar novamente</Button></div> : pending ? "Salvando…" : loaded ? "Salvo no navegador" : "Carregando…"}</div>
    {editing && <VehicleDialog key={editing === "new" ? "new" : editing.id} vehicle={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    {deleting && <ConfirmDialog title="Excluir veículo?" description={`O cadastro de ${deleting.name} será removido deste navegador. Esta ação não pode ser desfeita.`} onConfirm={() => deleteVehicle(deleting.id)} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
