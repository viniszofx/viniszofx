"use client";
import { useRef } from "react";
import { RiPrinterLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { useBoards } from "@/lib/boards/store";
import { dateLabel, printElement } from "@/lib/browser/print";
import { useClients } from "@/lib/clients/store";
import { useEmployees } from "@/lib/employees/store";
import { useVehicles } from "@/lib/fleet/store";
import { addressText } from "@/lib/format/address";
import { useCompany } from "@/lib/nodus/company";
import { serviceLabel } from "@/lib/nodus/stores";
import { useReservations } from "@/lib/reservations/store";
import { tripSummary } from "@/lib/trips/info";
import { addressSignature, destinationsSignature, formatDuration } from "@/lib/trips/route";
import type { Trip } from "@/lib/trips/store";

function Item({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return value ? <div className={wide ? "wide" : undefined}><dt>{label}</dt><dd>{value}</dd></div> : null;
}

/** PDF compacto da viagem (programação, equipe, rota e transporte), como no Nodus. */
export function TripPrintButton({ trip }: { trip: Trip }) {
  const ref = useRef<HTMLDivElement>(null);
  const { clients } = useClients(); const { employees } = useEmployees(); const { vehicles } = useVehicles();
  const { reservations } = useReservations(); const { boards } = useBoards(); const { company } = useCompany();
  const summary = tripSummary(trip, { employees, vehicles, reservations });
  const client = clients.find(item => item.id === trip.clientId);
  const board = boards.find(item => item.id === trip.boardId);
  const destinations = trip.visits?.length ? trip.visits.map(visit => visit.address) : addressText(trip) ? [trip] : [];
  const estimate = trip.routeEstimate && trip.routeEstimate.originSignature === addressSignature(company) && trip.routeEstimate.destinationSignature === destinationsSignature(destinations)
    && trip.routeEstimate.transport === trip.transport && trip.routeEstimate.roundTrip === !!trip.returnDate ? trip.routeEstimate : null;
  const timestamp = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  return <>
    <Button type="button" variant="outline" size="xs" onClick={() => printElement(`Viagem ${trip.code}`, ref.current)}><RiPrinterLine />Exportar PDF</Button>
    <div ref={ref} hidden>
      <h1>Viagem {trip.code}</h1>
      <section><h2>Programação</h2><dl>
        <Item label="Serviço" value={serviceLabel(trip.service) || "Viagem"} /><Item label="Cliente" value={client?.name} />
        <Item label="Ida" value={dateLabel(trip.departureDate)} /><Item label="Retorno" value={dateLabel(trip.returnDate)} />
        <Item label="Quadro" value={board?.title} /><Item label="Equipe" value={summary.team.join(", ")} wide />
      </dl></section>
      <section><h2>Rota e transporte</h2><dl>
        <Item label="Origem" value={addressText(company)} wide /><Item label="Transporte" value={summary.transport} /><Item label="Veículo" value={summary.vehicle} />
        {estimate && <Item label="Distância estimada" value={`${estimate.distanceKm.toLocaleString("pt-BR")} km`} />}
        {estimate && <Item label="Tempo estimado" value={formatDuration(estimate.durationMinutes)} />}
        <Item label="KM inicial" value={trip.initialKm} /><Item label="KM final" value={trip.finalKm} />
      </dl>
      {summary.destinations.length > 0 && <><p><strong>{summary.destinations.length === 1 ? "Destino" : "Visitas"}</strong></p><ol>{summary.destinations.map((visit, index) => <li key={index}>{visit}</li>)}</ol></>}
      </section>
      {trip.needsLodging && <section><h2>Hospedagem</h2><p>{summary.lodging || "A definir"}</p></section>}
      {trip.description?.trim() && <section><h2>Descrição</h2><p className="text">{trip.description.trim()}</p></section>}
      <p className="muted">Criado em {timestamp(trip.createdAt)} · Atualizado em {timestamp(trip.updatedAt)}</p>
    </div>
  </>;
}
