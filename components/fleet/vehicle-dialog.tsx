"use client";
import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { VehicleOptionField } from "./vehicle-option-field";
import { defaultVehicleModels } from "@/lib/fleet/vehicle-options";
import { VehicleColorField } from "./vehicle-color-field";
import { vehicleIdentification } from "@/lib/fleet/identity";
import { VehicleAttachments } from "./vehicle-attachments";
import { VehicleDocuments } from "./vehicle-documents";
import { useVehicles, saveVehicle, type Vehicle, type VehicleFields } from "@/lib/fleet/store";

const empty: VehicleFields = { color: "", purchaseValue: "", appraisalValue: "", costPerLiter: "", name: "", plate: "", brand: "", model: "", year: "", type: "Car", notes: "" };
const fields = [
 { name: "plate", label: "Placa", maxLength: 20 },
] as const;
export function VehicleDialog({ vehicle, onClose }: { vehicle?: Vehicle; onClose: () => void }) {
  const { vehicles } = useVehicles();
  const [value, setValue] = useState<VehicleFields>(vehicle ?? empty);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(value).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])) as VehicleFields;
    trimmed.name = vehicleIdentification(trimmed);
    saveVehicle(trimmed, vehicle?.id); onClose();
  }
  const timestamp = (date: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-5xl"><DialogTitle>{vehicle ? "Edit vehicle" : "New vehicle"}</DialogTitle><DialogDescription>Cadastre as informações do veículo. A identificação é gerada automaticamente.</DialogDescription>
    <form onSubmit={submit} className="space-y-5"><div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_20rem]">
      <div aria-label="Detalhes do veículo" className="min-w-0 space-y-5"><section className="space-y-4"><h3 className="text-sm font-semibold">Identificação</h3><p className="font-mono text-xs text-muted-foreground">Código: {vehicle?.code ?? "Gerado ao salvar"}</p><label className="grid gap-2 text-sm">Identificação<Input name="name" aria-label="Identificação" readOnly value={vehicleIdentification(value)} /><span className="text-xs text-muted-foreground">Gerada automaticamente pelo tipo, marca, modelo, cor e ano.</span></label></section>
      <section className="space-y-4 border-t pt-5"><h3 className="text-sm font-semibold">Dados do veículo</h3>      <div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm">Tipo de veículo<select aria-label="Tipo de veículo" value={value.type} onChange={event => setValue({ ...value, type: event.target.value })} className="h-10 w-full border-b border-input bg-background text-sm outline-none focus-visible:border-ring">{["Car", "Motorcycle", "Bus", "Truck", "Van", "Plane", "Ship", "Other"].map(type => <option key={type}>{type}</option>)}</select></label><VehicleColorField value={value.color ?? ""} onChange={color => setValue(previous => ({ ...previous, color }))} /></div><div className="grid gap-5 sm:grid-cols-2"><VehicleOptionField label="Marca" value={value.brand} options={[...Object.keys(defaultVehicleModels), ...vehicles.map(vehicle => vehicle.brand)]} onChange={brand => setValue(previous => ({ ...previous, brand, model: "" }))} /><VehicleOptionField key={value.brand} label="Modelo" value={value.model} options={[...(defaultVehicleModels[value.brand] ?? []), ...vehicles.filter(vehicle => vehicle.brand.toLocaleLowerCase() === value.brand.toLocaleLowerCase()).map(vehicle => vehicle.model)]} onChange={model => setValue(previous => ({ ...previous, model }))} />{fields.map(field => <label key={field.name} className="grid gap-2 text-sm">{field.label}<Input name={field.name} maxLength={field.maxLength} type="text" aria-label={field.label} value={value[field.name]} onChange={event => setValue(previous => ({ ...previous, [field.name]: event.target.value }))} /></label>)}<label className="grid gap-2 text-sm">Ano<select aria-label="Ano" value={value.year} onChange={event => setValue(previous => ({ ...previous, year: event.target.value }))} className="h-10 w-full min-w-0 border-b border-input bg-background text-sm outline-none focus-visible:border-ring"><option value="">Selecione o ano</option>{value.year && (Number(value.year) < 1886 || Number(value.year) > new Date().getFullYear() + 2) && <option value={value.year}>{value.year}</option>}{Array.from({ length: new Date().getFullYear() + 2 - 1886 + 1 }, (_, index) => String(new Date().getFullYear() + 2 - index)).map(year => <option key={year}>{year}</option>)}</select></label></div>
</section>
      <section className="space-y-4 border-t pt-5"><h3 className="text-sm font-semibold">Valores e custos</h3>      <div className="grid gap-4 sm:grid-cols-3">{([{ name: "purchaseValue", label: "Valor de compra (R$)" }, { name: "appraisalValue", label: "Valor de avaliação (R$)" }, { name: "costPerLiter", label: "Custo por litro (R$)" }] as const).map(field => <label key={field.name} className="grid gap-2 text-sm">{field.label}<CurrencyInput name={field.name} aria-label={field.label} value={value[field.name]} onValueChange={amount => setValue(previous => ({ ...previous, [field.name]: amount }))} /></label>)}</div>
</section>
      <VehicleDocuments value={value} onChange={patch => setValue(previous => ({ ...previous, ...patch }))} /></div>
      <aside aria-label="Observações do veículo" className="min-w-0 space-y-5 border-t bg-muted/30 p-4 md:border-l md:border-t-0"><VehicleAttachments value={value} onChange={patch => setValue(previous => ({ ...previous, ...patch }))} />      <label className="grid gap-2 text-sm">Observações<textarea name="notes" aria-label="Observações" rows={10} maxLength={5000} value={value.notes} onChange={event => setValue(previous => ({ ...previous, notes: event.target.value }))} className="min-h-64 w-full resize-y rounded-none border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label></aside>
      </div>
      <footer className="flex flex-wrap items-center justify-end gap-2 border-t pt-4"><div className="mr-auto basis-full space-y-1 text-xs text-muted-foreground sm:basis-auto"><p>Salvo neste navegador.</p><p>Criado em {vehicle ? <time dateTime={vehicle.createdAt}>{timestamp(vehicle.createdAt)}</time> : "Após salvar"} · Atualizado em {vehicle ? <time dateTime={vehicle.updatedAt}>{timestamp(vehicle.updatedAt)}</time> : "Após salvar"}</p></div><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar veículo</Button></footer>
    </form>
  </DialogContent></Dialog>;
}
