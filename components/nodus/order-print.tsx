"use client";
import { useRef } from "react";
import { RiPrinterLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { dateLabel, printElement } from "@/lib/browser/print";
import { useClients } from "@/lib/clients/store";
import { useEmployees } from "@/lib/employees/store";
import { useVehicles } from "@/lib/fleet/store";
import { addressText } from "@/lib/format/address";
import { useCompany } from "@/lib/nodus/company";
import { orderStatuses, serviceLabel, type Order } from "@/lib/nodus/stores";
import { useReservations } from "@/lib/reservations/store";
import { tripSummary } from "@/lib/trips/info";
import { useTrips } from "@/lib/trips/store";

const sameTeam = (left: string[], right: string[]) => left.length === right.length && left.every(id => right.includes(id));

/** Documento compacto da ordem, com materiais em tabela e assinaturas (Nodus). */
export function OrderPrintButton({ order }: { order: Order }) {
  const ref = useRef<HTMLDivElement>(null);
  const { company } = useCompany(); const { clients } = useClients(); const { employees } = useEmployees();
  const { trips } = useTrips(); const { vehicles } = useVehicles(); const { reservations } = useReservations();
  const client = clients.find(item => item.id === order.clientId);
  const clientAddress = client ? addressText(client) || (client.addresses?.[0] ? addressText(client.addresses[0]) : "") || client.address : "";
  const trip = trips.find(item => item.id === order.tripId);
  const tripInfo = trip ? tripSummary(trip, { employees, vehicles, reservations }) : null;
  const team = (order.employeeIds ?? []).map(id => employees.find(item => item.id === id)?.name).filter((name): name is string => !!name);
  const headerTeam = team.length ? team : tripInfo?.team ?? [];
  const release = employees.find(item => item.id === order.releaseEmployeeId)?.name ?? "";
  const tripService = trip?.service && trip.service !== order.service ? serviceLabel(trip.service) : "";
  return <>
    <Button variant="ghost" size="icon-sm" aria-label={`Imprimir ordem ${order.code}`} title="Imprimir / PDF" onClick={() => printElement(`Ordem de serviço ${order.code}`, ref.current)}><RiPrinterLine /></Button>
    <div ref={ref} hidden>
      <div className="provider">
        <div>{company.name && <strong>{company.name}</strong>}{company.document && <span>CNPJ/CPF: {company.document}</span>}{addressText(company) && <span>{addressText(company)}</span>}</div>
        <div>{company.phone && <span>{company.phone}</span>}{company.email && <span>{company.email}</span>}<span>Responsável: {release || company.responsible || "—"}</span><span>Técnico(s): {headerTeam.join(", ") || "—"}</span></div>
      </div>
      <div className="heading"><h1>Ordem de serviço {order.code}</h1><span>{dateLabel(order.createdAt)}</span></div>
      <section><h2>Identificação</h2><dl>
        <div><dt>Título</dt><dd>{order.title}</dd></div>
        <div><dt>Situação</dt><dd>{orderStatuses.find(status => status.value === order.status)?.label}</dd></div>
        <div><dt>{tripService ? "Serviço da ordem" : "Serviço"}</dt><dd>{serviceLabel(order.service) || "—"}</dd></div>
      </dl></section>
      <section><h2>Dados do cliente</h2><dl>
        <div><dt>Cliente</dt><dd>{client?.name || "—"}</dd></div>
        {client?.company && <div><dt>Empresa</dt><dd>{client.company}</dd></div>}
        {client && <div><dt>CPF/CNPJ</dt><dd>{client.document || "____________________"}</dd></div>}
        {client?.phone && <div><dt>Telefone</dt><dd>{client.phone}</dd></div>}
        {client?.email && <div><dt>E-mail</dt><dd>{client.email}</dd></div>}
        {clientAddress && <div className="wide"><dt>Endereço</dt><dd>{clientAddress}</dd></div>}
      </dl></section>
      <section><h2>Programação</h2><dl>
        <div><dt>Início</dt><dd>{dateLabel(order.startDate, "__/__/____")}</dd></div>
        <div><dt>Término</dt><dd>{dateLabel(order.endDate, "__/__/____")}</dd></div>
      </dl></section>
      {tripInfo && trip && <section><h2>Viagem vinculada · {trip.code}</h2><dl>
        {tripService && <div><dt>Serviço da viagem</dt><dd>{tripService}</dd></div>}
        {trip.departureDate && <div><dt>Ida</dt><dd>{dateLabel(trip.departureDate)}</dd></div>}
        {trip.returnDate && <div><dt>Retorno</dt><dd>{dateLabel(trip.returnDate)}</dd></div>}
        <div><dt>Transporte</dt><dd>{tripInfo.transport}</dd></div>
        {tripInfo.vehicle && <div><dt>Veículo</dt><dd>{tripInfo.vehicle}</dd></div>}
        {team.length > 0 && tripInfo.team.length > 0 && !sameTeam(order.employeeIds ?? [], tripInfo.employeeIds) && <div className="wide"><dt>Equipe da viagem</dt><dd>{tripInfo.team.join(", ")}</dd></div>}
        {tripInfo.destinations.length > 0 && <div className="wide"><dt>{tripInfo.destinations.length === 1 ? "Destino" : "Destinos"}</dt><dd>{tripInfo.destinations.join("; ")}</dd></div>}
        {trip.needsLodging && <div><dt>Hospedagem</dt><dd>{tripInfo.lodging || "A definir"}</dd></div>}
      </dl></section>}
      <section><h2>Materiais</h2><table><thead><tr><th style={{ width: "12%" }}>Qtd.</th><th>Nome</th><th>Descrição</th><th>Obs.</th></tr></thead><tbody>
        {order.materials?.length ? order.materials.map(material => <tr key={material.id}><td>{material.quantity}</td><td>{material.name}</td><td>{material.description || "—"}</td><td>{material.notes || "—"}</td></tr>) : <tr><td colSpan={4}>Nenhum material informado.</td></tr>}
      </tbody></table></section>
      {order.execution?.trim() && <section><h2>Execução</h2><p className="text">{order.execution.trim()}</p></section>}
      {order.notes?.trim() && <section><h2>Observações</h2><p className="text">{order.notes.trim()}</p></section>}
      <footer className="signatures">
        <div><span className="line" /><strong>Técnico responsável</strong><small>Assinatura</small></div>
        <div><span className="line" /><strong>Responsável pela liberação</strong><small>{release || "Nome e assinatura"}</small></div>
      </footer>
    </div>
  </>;
}
