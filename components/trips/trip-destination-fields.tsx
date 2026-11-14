"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { RiAddLine, RiArrowDownLine, RiArrowUpLine, RiDeleteBinLine, RiLoader4Line } from "@remixicon/react";
import { AddressFields } from "@/components/ui/address-fields";
import { Button } from "@/components/ui/button";
import { CollapsibleFields } from "@/components/ui/collapsible-fields";
import { Field, Select } from "@/components/ui/field";
import { useClients } from "@/lib/clients/store";
import { addressText, type AddressFieldsValue } from "@/lib/format/address";
import { useCompany } from "@/lib/nodus/company";
import { newId } from "@/lib/records/store";
import { addressSignature, destinationsSignature, formatDuration, routable, type RouteEstimate } from "@/lib/trips/route";
import type { TripFields, TripVisit } from "@/lib/trips/store";

const addressKeys = ["postalCode", "street", "number", "complement", "neighborhood", "city", "state"] as const;
const copyAddress = (value: AddressFieldsValue): AddressFieldsValue => Object.fromEntries(addressKeys.map(key => [key, value[key] ?? ""]));

/** Visitas da viagem, na ordem da rota (Nodus: "Destinos e visitas"). */
export function tripVisits(value: TripFields): TripVisit[] {
  if (value.visits?.length) return value.visits;
  return addressText(value) ? [{ id: "legacy", clientId: value.clientId ?? "", clientAddressId: "", address: copyAddress(value) }] : [];
}

export function TripDestinationFields({ value, onChange }: { value: TripFields; onChange: (patch: Partial<TripFields>) => void }) {
  const { clients } = useClients();
  const [manual, setManual] = useState<string[]>([]);
  const visits = tripVisits(value);
  // O primeiro destino continua no endereço da viagem, usado por telas antigas.
  const commit = (next: TripVisit[]) => onChange({ visits: next.map(visit => visit.id === "legacy" ? { ...visit, id: newId() } : visit), ...copyAddress(next[0]?.address ?? {}) });
  const options = clients.flatMap(client => [
    { key: `${client.id}:`, label: `${client.name} · ${addressText(client) || "sem endereço"}`, address: copyAddress(client), clientId: client.id, addressId: "" },
    ...(client.addresses ?? []).map((address, index) => ({ key: `${client.id}:${address.id}`, label: `${client.name} · ${address.label || `Endereço ${index + 2}`} · ${addressText(address)}`, address: copyAddress(address), clientId: client.id, addressId: address.id })),
  ]).filter(option => addressText(option.address));
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= visits.length) return;
    const next = [...visits]; [next[index], next[target]] = [next[target], next[index]]; commit(next);
  }
  function add() {
    if (visits.length >= 20) return;
    const id = newId();
    commit([...visits, { id, clientId: "", clientAddressId: "", address: {} }]);
    setManual(previous => [...previous, id]);
  }
  return <CollapsibleFields title="Destinos e visitas">
    {!visits.length && <p className="text-xs text-muted-foreground">Adicione as visitas na ordem da rota. Escolha um endereço de cliente ou digite um endereço.</p>}
    {visits.map((visit, index) => {
      const linked = visit.clientId ? `${visit.clientId}:${visit.clientAddressId}` : "";
      const known = options.some(option => option.key === linked);
      const open = manual.includes(visit.id) || !known;
      return <div key={visit.id} className="space-y-3 border p-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">Visita {index + 1}</h4>
          <div className="flex">
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Subir visita ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}><RiArrowUpLine /></Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Descer visita ${index + 1}`} disabled={index === visits.length - 1} onClick={() => move(index, 1)}><RiArrowDownLine /></Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover visita ${index + 1}`} onClick={() => commit(visits.filter(item => item.id !== visit.id))}><RiDeleteBinLine /></Button>
          </div>
        </div>
        <Field label="Endereço de cliente"><Select value={known ? linked : ""} placeholder="Endereço manual" options={options.map(option => ({ value: option.key, label: option.label }))} onChange={event => {
          const option = options.find(item => item.key === event.target.value);
          setManual(previous => option ? previous.filter(id => id !== visit.id) : [...previous, visit.id]);
          commit(visits.map(item => item.id === visit.id ? option ? { ...item, clientId: option.clientId, clientAddressId: option.addressId, address: option.address } : { ...item, clientId: "", clientAddressId: "" } : item));
        }} /></Field>
        {open ? <AddressFields showTitle={false} value={visit.address} onChange={patch => commit(visits.map(item => item.id === visit.id ? { ...item, clientId: "", clientAddressId: "", address: { ...item.address, ...patch } } : item))} /> : <p className="text-xs text-muted-foreground">{addressText(visit.address)}</p>}
      </div>;
    })}
    {visits.length < 20 && <Button type="button" variant="outline" size="sm" onClick={add}><RiAddLine />Adicionar visita</Button>}
  </CollapsibleFields>;
}

export function TripRouteEstimate({ value, onChange }: { value: TripFields; onChange: (estimate: RouteEstimate) => void }) {
  const { company, loaded } = useCompany();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const destinations = tripVisits(value).map(visit => visit.address);
  const ready = routable(company) && destinations.length > 0 && destinations.every(routable);
  const estimate = value.routeEstimate;
  const current = !!estimate && estimate.originSignature === addressSignature(company) && estimate.destinationSignature === destinationsSignature(destinations)
    && estimate.transport === value.transport && estimate.roundTrip === !!value.returnDate;
  async function calculate() {
    if (!ready || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/travel-estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin: company, destinations, transport: value.transport, roundTrip: !!value.returnDate }) });
      if (!response.ok) throw new Error(await response.text() || "Não foi possível calcular a rota.");
      onChange(await response.json());
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  return <CollapsibleFields title="Distância e tempo"><div className="space-y-3 text-sm">
    <p><strong>Origem:</strong> {!loaded ? "Carregando…" : addressText(company) || <>não cadastrada. <Link href="/dashboard/settings/company" className="underline">Cadastrar endereço da empresa</Link></>}</p>
    <div><strong>Visitas na ordem da rota:</strong>{destinations.length ? <ol className="mt-1 list-inside list-decimal space-y-1">{destinations.map((destination, index) => <li key={index}>{addressText(destination) || "Endereço incompleto"}</li>)}</ol> : <p>Adicione ao menos uma visita.</p>}</div>
    {estimate && current && <div className={cn(surfaceVariants(), "grid gap-2 p-4 sm:grid-cols-2")}>
      <p><strong>Distância total:</strong> {estimate.distanceKm.toLocaleString("pt-BR")} km</p>
      <p><strong>Tempo total:</strong> {formatDuration(estimate.durationMinutes)}</p>
      <p className="text-xs text-muted-foreground sm:col-span-2">{estimate.roundTrip ? "Inclui o retorno da última visita à origem." : "Percurso da origem até a última visita, sem retorno."}</p>
      <p className="text-xs text-muted-foreground sm:col-span-2">{estimate.method === "road" ? "Estimativa por trajeto rodoviário, sem trânsito em tempo real." : "Estimativa aproximada; a rota rodoviária não estava disponível ou o transporte não usa estradas."}</p>
    </div>}
    {estimate && !current && <p className="text-xs text-muted-foreground">As visitas, o retorno, a origem ou o transporte mudaram. Recalcule a estimativa.</p>}
    {!ready && <p className="text-xs text-muted-foreground">Informe cidade e rua ou CEP na origem e em cada visita.</p>}
    <Button type="button" variant="outline" disabled={!ready || busy} onClick={() => void calculate()}>{busy && <RiLoader4Line className="animate-spin" />}{busy ? "Calculando…" : estimate ? "Recalcular rota" : "Calcular distância e tempo"}</Button>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">Dados de localização: © OpenStreetMap contributors.</p>
  </div></CollapsibleFields>;
}
