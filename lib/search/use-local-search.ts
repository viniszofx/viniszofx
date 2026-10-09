"use client";
import { useEffect, useState } from "react";
import { addressText } from "@/lib/format/address";
import { useReservations } from "@/lib/reservations/store";
import { useVehicles } from "@/lib/fleet/store";
import { useTrips, transportModes } from "@/lib/trips/store";
import { useClients } from "@/lib/clients/store";
import { boardStatus } from "@/lib/boards/status";
import { useBoards } from "@/lib/boards/store";
import { listNotes } from "@/lib/notes/storage";
import type { Note } from "@/lib/notes/types";
export type SearchEntry = { id: string; title: string; context: string; text: string; href: string; kind: "Notes" | "Boards" | "Listas" | "Cards" | "Clients" | "Trip" | "Fleet" | "Reservations" | "Páginas" };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
export function useLocalSearch(query: string) {
  const { boards, loaded, error: boardError } = useBoards();
  const { reservations, loaded: reservationsLoaded, error: reservationsError } = useReservations();
  const { vehicles, loaded: fleetLoaded, error: fleetError } = useVehicles();
  const { trips, loaded: tripsLoaded, error: tripsError } = useTrips();
  const { clients, loaded: clientsLoaded, error: clientsError } = useClients();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => { void listNotes().then(items => { if (active) { setNotes(items); setError(""); } }).catch(() => { if (active) setError("Não foi possível consultar Notes neste navegador."); }); };
    refresh();window.addEventListener("focus", refresh);window.addEventListener("viniszofx:notes-changed", refresh);
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("viniszofx-notes") : undefined;
    if (channel) channel.onmessage = refresh;
    return () => { active = false;window.removeEventListener("focus", refresh);window.removeEventListener("viniszofx:notes-changed", refresh);channel?.close(); };
  }, []);
  const entries: SearchEntry[] = (notes ?? []).map(note => ({ id: note.id, title: note.title || "Sem título", context: "Nota pessoal", text: `${note.title} ${note.content}`, href: `/dashboard/notes?note=${encodeURIComponent(note.id)}`, kind: "Notes" }));
  clients.forEach(client => entries.push({ id: client.id, title: client.name, context: client.company || client.email || "Cliente", text: [client.name, client.company, client.email, client.phone, client.address, client.notes].join(" "), href: `/dashboard/clients?client=${encodeURIComponent(client.id)}`, kind: "Clients" }));
  trips.forEach(trip => { const context = [boards.find(board => board.id === trip.boardId)?.title, vehicles.filter(vehicle => vehicle.id === trip.vehicleId).map(vehicle => `${vehicle.name} ${vehicle.plate} ${vehicle.code}`).join(" "), vehicles.find(vehicle => vehicle.id === trip.vehicleId)?.type ?? transportModes.find(mode => mode.value === trip.transport)?.label, clients.find(client => client.id === trip.clientId)?.name].filter(Boolean).join(" · "); entries.push({ id: trip.id, title: trip.code, context, text: [trip.code, trip.description, context, trip.city, trip.state, trip.street, trip.number, trip.complement, trip.neighborhood, trip.postalCode, trip.departureDate, trip.returnDate, trip.location, trip.needsLodging ? reservations.filter(item=>item.id===trip.reservationId).map(item=>`${item.code} ${item.name}`).join(" ") : ""].join(" "), href: `/dashboard/trip/${encodeURIComponent(trip.id)}`, kind: "Trip" }); });
  vehicles.forEach(vehicle => entries.push({ id: vehicle.id, title: vehicle.name, context: [vehicle.plate, vehicle.model].filter(Boolean).join(" · "), text: [vehicle.code, vehicle.name, vehicle.plate, vehicle.brand, vehicle.model, vehicle.year, vehicle.color, vehicle.type, vehicle.notes, vehicle.renavam, vehicle.chassis, vehicle.attachments?.map(file => file.name).join(" ")].join(" "), href: `/dashboard/fleet?vehicle=${encodeURIComponent(vehicle.id)}`, kind: "Fleet" }));
  reservations.forEach(item=>entries.push({id:item.id,title:`${item.code} · ${item.name}`,context:addressText(item) || item.address || "",text:[item.code,item.name,addressText(item),item.address,item.phone,item.notes,item.departureDate,item.returnDate].join(" "),href:`/dashboard/reservations?reservation=${encodeURIComponent(item.id)}`,kind:"Reservations"}));
  boards.forEach(board => {
    entries.push({ id: board.id, title: board.title, context: `${board.lists.length} listas`, text: [board.title, board.description, boardStatus(board.status).label, clients.find(client => client.id === board.clientId)?.name].join(" "), href: `/dashboard/boards/${board.id}`, kind: "Boards" });
    board.lists.forEach(list => {
      entries.push({ id: list.id, title: list.title, context: board.title, text: `${board.title} ${list.title}`, href: `/dashboard/boards/${board.id}`, kind: "Listas" });
      list.cards.forEach(card => entries.push({ id: card.id, title: card.title, context: `${board.title} · ${list.title}`, text: `${card.title} ${card.description} ${board.title} ${list.title} ${card.attachments?.map(file => file.name).join(" ") ?? ""}`, href: `/dashboard/boards/${board.id}?card=${encodeURIComponent(card.id)}`, kind: "Cards" }));
    });
  });
  for (const [title, href, text] of [["Home", "/dashboard", "início painel"], ["Workspace", "/dashboard/workspace", "área de trabalho"], ["Notes", "/dashboard/notes", "notas anotações documentos"], ["Boards", "/dashboard/boards", "quadros tarefas"], ["Clients", "/dashboard/clients", "clientes contatos empresas"], ["Trip", "/dashboard/trip", "viagens transporte"], ["Fleet", "/dashboard/fleet", "frota veículos"], ["Reservations", "/dashboard/reservations", "reservas hotéis hospedagem"], ["Settings", "/dashboard/settings", "configurações preferências"]]) entries.push({ id: href, title, href, text: `${title} ${text}`, context: "Navegação", kind: "Páginas" });
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return { results: terms.length ? entries.filter(entry => terms.every(term => normalize(entry.text).includes(term))) : [], loaded: loaded && reservationsLoaded && fleetLoaded && clientsLoaded && tripsLoaded && (notes !== null || !!error), error: error || reservationsError || fleetError || boardError || clientsError || tripsError };
}
