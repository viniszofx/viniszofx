"use client";
import { CollapsibleFields, SectionPreferencesProvider, useFieldSections } from "@/components/ui/collapsible-fields";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { TripCollaboratorsField } from "./trip-collaborators-field";
import { TripMileageFields } from "./trip-mileage-fields";
import { TripDateFields } from "./trip-date-fields";
import { TripJourneyFields } from "./trip-journey-fields";
import { RiExternalLinkLine } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useBoards } from "@/lib/boards/store";
import { useVehicles } from "@/lib/fleet/store";
import Link from "next/link";
import { useClients } from "@/lib/clients/store";
import { saveTrip, vehicleTransport, transportModes, type Trip, type TripFields, type TransportMode } from "@/lib/trips/store";
const selectClass = "h-10 w-full min-w-0 rounded-none border border-transparent border-b-input bg-background text-sm outline-none focus-visible:border-b-ring";
type TripFormProps = { trip?: Trip; onClose: () => void; detailed?: boolean };
export function TripForm(props: TripFormProps) {
 return <SectionPreferencesProvider storageKey={`viniszofx:trip-sections:${props.trip?.id ?? "new"}`}><TripFormFields {...props} /></SectionPreferencesProvider>;
}
function TripFormFields({ trip, onClose, detailed = false }: TripFormProps) {
 const sections = useFieldSections();
 const { boards, loaded: boardsLoaded, error: boardsError } = useBoards();
 const { vehicles, loaded: fleetLoaded, error: fleetError } = useVehicles();
 const { clients, loaded } = useClients();
 const [value, setValue] = useState<TripFields>(trip ?? { description: "", clientId: "", transport: "car" });
 const autoSave = detailed && !!trip;
 const draft = useRef(value);
 const savedDraft = useRef(JSON.stringify(value));
 const saveDraft = useRef<() => void>(() => {});
 useEffect(() => {
 draft.current = value;
 saveDraft.current = () => {
  if (!autoSave || JSON.stringify(draft.current) === savedDraft.current) return;
  saveTrip({ ...draft.current, description: draft.current.description.trim() }, trip?.id, { silent: true });
  savedDraft.current = JSON.stringify(draft.current);
 };
 }, [value, autoSave, trip?.id]);
 useEffect(() => {
  if (!autoSave) return;
  const timer = window.setTimeout(() => saveDraft.current(), 600);
  return () => window.clearTimeout(timer);
 }, [value, autoSave]);
 useEffect(() => {
  if (!autoSave) return;
  const flush = () => saveDraft.current();
  window.addEventListener("pagehide", flush);
  return () => { window.removeEventListener("pagehide", flush); flush(); };
 }, [autoSave]);
 const availableVehicles = vehicles.filter(vehicle => vehicleTransport(vehicle.type) === value.transport);
 const selectedVehicle = vehicles.find(vehicle => vehicle.id === value.vehicleId);
 function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); saveTrip({ ...value, vehicleId: selectedVehicle && vehicleTransport(selectedVehicle.type) !== value.transport ? "" : value.vehicleId, description: value.description.trim() }, trip?.id); if (!detailed) onClose(); }
 const timestamp = (date: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
 const transportFields = <>
<label className="grid gap-2 text-sm">Transporte<select aria-label="Transporte" className={selectClass} value={value.transport} onChange={event => setValue(previous => ({ ...previous, transport: event.target.value as TransportMode, vehicleId: "" }))}>{transportModes.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}{["truck", "van", "other"].filter(mode => vehicles.some(vehicle => vehicleTransport(vehicle.type) === mode) || value.transport === mode).map(mode => <option key={mode} value={mode}>{mode[0].toUpperCase() + mode.slice(1)}</option>)}</select></label>
 <div className="space-y-2"><label className="grid gap-2 text-sm">Veículo (opcional)<select aria-label="Veículo da viagem" disabled={!fleetLoaded} className={selectClass} value={value.vehicleId ?? ""} onChange={event => setValue(previous => ({ ...previous, vehicleId: event.target.value }))}><option value="">{fleetLoaded ? "Sem veículo" : "Carregando…"}</option>{value.vehicleId && !vehicles.some(vehicle => vehicle.id === value.vehicleId) && <option value={value.vehicleId}>{fleetLoaded ? "Veículo removido" : "Carregando veículo…"}</option>}{[...availableVehicles].sort((a,b) => a.name.localeCompare(b.name)).map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.plate || "Sem placa"} · {vehicle.code}</option>)}</select></label>{selectedVehicle && <p className="break-words text-xs text-muted-foreground">{selectedVehicle.name}<br />{selectedVehicle.plate || "Sem placa"} · {selectedVehicle.code}</p>}{fleetError && <p role="alert" className="text-xs text-destructive">{fleetError}</p>}{fleetLoaded && !availableVehicles.length && <p className="text-xs text-muted-foreground">Nenhum veículo deste tipo. Cadastre em <Link href="/dashboard/fleet" className="underline">Fleet</Link>.</p>}</div>
 </>;
 const shortcuts = value.boardId && boards.some(board => board.id === value.boardId) && <CollapsibleFields title="Atalhos"><Link href={`/dashboard/boards/${encodeURIComponent(value.boardId)}`} className={buttonVariants({ variant: "outline", size: "sm", className: "justify-self-start" })} onClick={() => saveDraft.current()}><RiExternalLinkLine />Ir ao board</Link></CollapsibleFields>;
 return <><div className="flex flex-wrap items-center gap-3"><p className="font-mono text-xs text-muted-foreground">Código: {trip?.code ?? "Gerado ao salvar"}</p><Button type="button" variant="outline" size="xs" onClick={() => sections?.collapseAll()}>Recolher todos</Button></div><form onSubmit={submit} className="@container space-y-5">
 <div className="space-y-5 @min-[48rem]:hidden">{shortcuts}{detailed && <TripMileageFields value={value} onChange={patch => setValue(previous => ({ ...previous, ...patch }))} />}</div>
 <div className="grid min-w-0 gap-5 @min-[48rem]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
 <div aria-label="Detalhes da viagem" className="grid min-w-0 content-start gap-5 bg-muted/30 p-4"><CollapsibleFields title="Cliente e Board"><div className="grid min-w-0 gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm">Cliente (opcional)<select aria-label="Cliente da viagem" disabled={!loaded} className={selectClass} value={value.clientId} onChange={event => setValue({ ...value, clientId: event.target.value })}><option value="">{loaded ? "Sem cliente" : "Carregando…"}</option>{value.clientId && !clients.some(client => client.id === value.clientId) && <option value={value.clientId}>Cliente removido</option>}{[...clients].sort((a,b) => a.name.localeCompare(b.name)).map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
 <div className="space-y-2"><label className="grid gap-2 text-sm">Board (opcional)<select aria-label="Board da viagem" disabled={!boardsLoaded} className={selectClass} value={value.boardId ?? ""} onChange={event => setValue(previous => ({ ...previous, boardId: event.target.value }))}><option value="">{boardsLoaded ? "Sem board" : "Carregando…"}</option>{value.boardId && !boards.some(board => board.id === value.boardId) && <option value={value.boardId}>{boardsLoaded ? "Board removido" : "Carregando board…"}</option>}{[...boards].sort((a,b) => a.title.localeCompare(b.title)).map(board => <option key={board.id} value={board.id}>{board.title}</option>)}</select></label>{boardsError && <p role="alert" className="text-xs text-destructive">{boardsError}</p>}</div></div></CollapsibleFields>
 <TripCollaboratorsField selectedIds={value.employeeIds ?? []} onChange={employeeIds => setValue(previous => ({ ...previous, employeeIds }))} />
 {detailed ? <TripJourneyFields value={value} transportFields={transportFields} onChange={patch => setValue(previous => ({ ...previous, ...patch }))} /> : <CollapsibleFields title="Transporte">{transportFields}</CollapsibleFields>}

</div><div className="grid min-w-0 content-start gap-5">{detailed && <TripDateFields value={value} onChange={patch => setValue(previous => ({ ...previous, ...patch }))} />}<div className="hidden @min-[48rem]:block">{detailed && <TripMileageFields value={value} onChange={patch => setValue(previous => ({ ...previous, ...patch }))} />}</div><div className="hidden @min-[48rem]:block">{shortcuts}</div><CollapsibleFields title="Descrição (opcional)"><label className="grid min-w-0 content-start gap-2 text-sm"><span className="sr-only">Descrição (opcional)</span><textarea aria-label="Descrição da viagem" rows={10} maxLength={5000} value={value.description} onChange={event => setValue({ ...value, description: event.target.value })} className="min-h-64 w-full resize-y rounded-none border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label></CollapsibleFields></div></div>
 <footer className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"><div className="mr-auto basis-full space-y-1 text-xs text-muted-foreground sm:basis-auto"><p className="text-xs">{autoSave ? "As alterações são salvas automaticamente neste navegador." : "Organize sua viagem. As alterações ficam salvas neste navegador."}</p><p>Criado em {trip ? <time dateTime={trip.createdAt}>{timestamp(trip.createdAt)}</time> : "Após salvar"} · Atualizado em {trip ? <time dateTime={trip.updatedAt}>{timestamp(trip.updatedAt)}</time> : "Após salvar"}</p></div><Button type="button" variant="outline" onClick={onClose}>{autoSave ? "Voltar" : "Cancelar"}</Button>{!autoSave && <Button type="submit">Salvar trip</Button>}</footer>
 </form></>;
}
