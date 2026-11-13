"use client";
import type { Employee } from "@/lib/employees/store";
import type { Vehicle } from "@/lib/fleet/store";
import { addressText } from "@/lib/format/address";
import type { Reservation } from "@/lib/reservations/store";
import type { Trip, TripFields } from "./store";

export const transportNames: Record<string, string> = { car: "Carro", motorcycle: "Moto", bus: "Ônibus", plane: "Avião", ship: "Navio", truck: "Caminhão", van: "Van", other: "Outro" };

/** Resumo da viagem para impressões (ordem vinculada, PDF da viagem e da agenda). */
export function tripSummary(trip: TripFields & Partial<Pick<Trip, "code">>, data: { employees: Employee[]; vehicles: Vehicle[]; reservations: Reservation[] }) {
  const vehicle = data.vehicles.find(item => item.id === trip.vehicleId);
  const reservation = data.reservations.find(item => item.id === trip.reservationId);
  const team = (trip.employeeIds ?? []).map(id => data.employees.find(item => item.id === id)?.name).filter((name): name is string => !!name).concat(trip.otherEmployees ?? []);
  const destinations = trip.visits?.length ? trip.visits.map(visit => addressText(visit.address)).filter(Boolean) : [addressText(trip)].filter(Boolean);
  return {
    code: trip.code ?? "", team, destinations, employeeIds: trip.employeeIds ?? [],
    transport: transportNames[trip.transport] ?? trip.transport,
    vehicle: vehicle ? `${vehicle.name}${vehicle.plate ? ` · ${vehicle.plate}` : ""}` : "",
    lodging: reservation?.name || trip.lodging?.name || "",
  };
}
