"use client";
import { RiLoader4Line } from "@remixicon/react";
import { usePostalAddress } from "@/components/trips/use-postal-address";
import { Input } from "@/components/ui/input";
import type { AddressFieldsValue } from "@/lib/format/address";
const fields = [ { name: "city", label: "Cidade", maxLength: 150 }, { name: "state", label: "Estado / UF", maxLength: 100 }, { name: "street", label: "Rua", maxLength: 300 }, { name: "number", label: "Número", maxLength: 30 }, { name: "complement", label: "Complemento", maxLength: 200 }, { name: "neighborhood", label: "Bairro", maxLength: 150 } ] as const;
export function AddressFields({ value, onChange, title = "Endereço", showTitle = true }: { value: AddressFieldsValue; onChange: (patch: Partial<AddressFieldsValue>) => void; title?: string; showTitle?: boolean }) {
 const { loading, error, changePostalCode, changeAddress } = usePostalAddress(onChange);
 return <section aria-label={title} className="space-y-4 border-t pt-5">{showTitle && <h3 className="text-sm font-semibold">{title}</h3>}<div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm sm:col-span-2">CEP<div className="flex items-center gap-2"><Input aria-label="CEP" inputMode="numeric" maxLength={9} placeholder="00000-000" value={value.postalCode ?? ""} onChange={event => changePostalCode(event.target.value)} />{loading && <RiLoader4Line aria-hidden="true" className="size-4 shrink-0 animate-spin" />}</div>{loading && <span role="status" className="sr-only">Buscando endereço…</span>}{error && <span role="alert" className="text-xs text-destructive">{error}</span>}</label>{fields.map(field => <label key={field.name} className="grid gap-2 text-sm">{field.label}<Input aria-label={field.label} maxLength={field.maxLength} value={value[field.name] ?? ""} onChange={event => changeAddress({ [field.name]: event.target.value })} /></label>)}</div>

 </section>;
}
