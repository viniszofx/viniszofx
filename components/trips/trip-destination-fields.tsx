"use client";
import { CollapsibleFields } from "@/components/ui/collapsible-fields";
import { AddressFields } from "@/components/ui/address-fields";
import type { TripFields } from "@/lib/trips/store";
export function TripDestinationFields({ value, onChange }: { value: TripFields; onChange: (patch: Partial<TripFields>) => void }) {
 return <CollapsibleFields title="Informações da viagem"><AddressFields showTitle={false} value={value} onChange={onChange} title="Informações da viagem" /></CollapsibleFields>;
}
