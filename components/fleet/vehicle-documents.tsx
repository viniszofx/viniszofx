"use client";
import { Input } from "@/components/ui/input";
import type { VehicleFields } from "@/lib/fleet/store";
export function VehicleDocuments({ value, onChange }: { value: VehicleFields; onChange: (patch: Partial<VehicleFields>) => void }) {
 return <section aria-label="Documentos do veículo" className="space-y-4 border-t pt-5"><h3 className="text-sm font-semibold">Documentos</h3><div className="grid gap-5 sm:grid-cols-2"> <label className="grid gap-2 text-sm">RENAVAM<Input name="renavam" aria-label="RENAVAM" maxLength={30} value={value.renavam ?? ""} onChange={event => onChange({ renavam: event.target.value })} /><span className="text-xs text-muted-foreground">Número de registro do veículo. Consulte o documento do veículo (CRLV).</span></label>
 <label className="grid gap-2 text-sm">Chassi<Input name="chassis" aria-label="Chassi" maxLength={40} value={value.chassis ?? ""} onChange={event => onChange({ chassis: event.target.value })} /><span className="text-xs text-muted-foreground">Código de identificação do veículo, também informado no CRLV.</span></label>
</div></section>;
}
