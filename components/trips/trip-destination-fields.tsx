"use client";
import { AddressFields } from "@/components/ui/address-fields";
import type { TripFields } from "@/lib/trips/store";
export function TripDestinationFields({ value, onChange }: { value: TripFields; onChange: (patch: Partial<TripFields>) => void }) {
 return <AddressFields value={value} onChange={onChange} title="Informações da viagem" />;
}
