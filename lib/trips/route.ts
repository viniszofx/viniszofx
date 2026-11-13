import type { AddressFieldsValue } from "@/lib/format/address";

export type RouteEstimate = {
  originSignature: string; destinationSignature: string; transport: string; roundTrip: boolean;
  distanceKm: number; durationMinutes: number; method: "road" | "approximate"; calculatedAt: string;
};

export function addressSignature(value: AddressFieldsValue) {
  return [value.postalCode, value.street, value.number, value.neighborhood, value.city, value.state]
    .map(part => (part ?? "").trim().toLocaleLowerCase("pt-BR")).join("|");
}
export function destinationsSignature(values: AddressFieldsValue[]) { return values.map(addressSignature).join(">"); }
/** Cidade e rua ou CEP: o mínimo para a geocodificação achar o ponto. */
export function routable(value?: AddressFieldsValue) { return !!value?.city?.trim() && !!(value.street?.trim() || value.postalCode?.trim()); }
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60); const rest = minutes % 60;
  return hours ? `${hours} h ${rest} min` : `${rest} min`;
}
