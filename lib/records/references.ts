"use client";

import { useClients } from "@/lib/clients/store";
import { useEmployees } from "@/lib/employees/store";
import { useVehicles } from "@/lib/fleet/store";
import { useTrips } from "@/lib/trips/store";
import { hotelStore, inventoryItemStore, inventoryLocationStore, orderStore } from "@/lib/nodus/stores";
import { useModuleEnabled } from "@/lib/modules-context";

export type ReferenceSource = "clients" | "employees" | "vehicles" | "trips" | "hotels" | "orders" | "inventory_items" | "inventory_locations";
export type ReferenceOption = { value: string; label: string };
export type Lookup = (source: ReferenceSource, id?: string) => string;

type Options = { loaded: boolean; options: ReferenceOption[] };
function useClientOptions(): Options { const { clients, loaded } = useClients(); return { loaded, options: clients.map(item => ({ value: item.id, label: item.company ? `${item.name} · ${item.company}` : item.name })) }; }
function useEmployeeOptions(): Options { const { employees, loaded } = useEmployees(); return { loaded, options: employees.filter(item => item.status !== "terminated").map(item => ({ value: item.id, label: item.name })) }; }
function useVehicleOptions(): Options { const { vehicles, loaded } = useVehicles(); return { loaded, options: vehicles.map(item => ({ value: item.id, label: [item.name || `${item.brand} ${item.model}`.trim(), item.plate].filter(Boolean).join(" · ") })) }; }
function useTripOptions(): Options { const { trips, loaded } = useTrips(); return { loaded, options: trips.map(item => ({ value: item.id, label: [item.code, item.description || item.location].filter(Boolean).join(" · ") })) }; }
function useHotelOptions(enabled: boolean): Options { const { records, loaded } = hotelStore.useRecords(enabled); return { loaded, options: records.map(item => ({ value: item.id, label: item.name })) }; }
function useOrderOptions(): Options { const { records, loaded } = orderStore.useRecords(); return { loaded, options: records.map(item => ({ value: item.id, label: [item.code, item.title].filter(Boolean).join(" · ") })) }; }
function useItemOptions(enabled: boolean): Options { const { records, loaded } = inventoryItemStore.useRecords(enabled); return { loaded, options: records.map(item => ({ value: item.id, label: item.name })) }; }
function useLocationOptions(enabled: boolean): Options { const { records, loaded } = inventoryLocationStore.useRecords(enabled); return { loaded, options: records.map(item => ({ value: item.id, label: item.name })) }; }

// Every source is subscribed on each call so hook order never depends on `source`;
// the stores share one fetch per collection, so extra subscriptions are cheap.
function useAllOptions(): Record<ReferenceSource, Options> {
  const enabled = useModuleEnabled();
  return {
    clients: useClientOptions(), employees: useEmployeeOptions(), vehicles: useVehicleOptions(), trips: useTripOptions(),
    hotels: useHotelOptions(enabled("lodging")), orders: useOrderOptions(), inventory_items: useItemOptions(enabled("inventory")), inventory_locations: useLocationOptions(enabled("inventory")),
  };
}

export function useReferenceOptions(source: ReferenceSource) { return useAllOptions()[source]; }

/** Resolves linked record ids to display names for cards and lists. */
export function useLookup(): Lookup {
  const all = useAllOptions();
  const maps = Object.fromEntries(Object.entries(all).map(([source, { options }]) => [source, new Map(options.map(option => [option.value, option.label]))])) as Record<ReferenceSource, Map<string, string>>;
  return (source, id) => (id && maps[source].get(id)) || "";
}
