"use client";
import { useId, type ReactNode } from "react";
import { TripDestinationFields } from "./trip-destination-fields";
import { TripReservationField } from "./trip-reservation-field";
import type { TripFields } from "@/lib/trips/store";
export function TripJourneyFields({ value, onChange, transportFields }: { transportFields: ReactNode; value: TripFields; onChange: (patch: Partial<TripFields>) => void }) {
 const id = useId();
 return <div className="space-y-5">
 <TripDestinationFields value={value} onChange={onChange} />
 <section aria-label="Transporte da viagem" className="space-y-4 border-t pt-5">{transportFields}</section>

 <section aria-label="Hospedagem" className="space-y-4 border-t pt-5"><fieldset className="space-y-3"><legend className="text-sm font-semibold">Precisa de hospedagem?</legend><div className="flex gap-5">{[{ label: "Sim", value: true }, { label: "Não", value: false }].map(option => <label key={option.label} className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name={`lodging-${id}`} checked={!!value.needsLodging === option.value} onChange={() => onChange({ needsLodging: option.value })} aria-controls={id} className="size-4 accent-primary" />{option.label}</label>)}</div></fieldset>{value.needsLodging && <div id={id}><TripReservationField value={value} onChange={onChange} /></div>}</section>
 </div>;
}
