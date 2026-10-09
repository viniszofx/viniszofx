"use client";
import { AttachmentsField } from "@/components/ui/attachments-field";
import type { VehicleFields } from "@/lib/fleet/store";
export function VehicleAttachments({ value, onChange }: { value: VehicleFields; onChange: (patch: Partial<VehicleFields>) => void }) {
 return <AttachmentsField files={value.attachments ?? []} onChange={attachments => onChange({ attachments })} label="Anexos do veículo" removalContext="o veículo" hint="Até 20 MB por arquivo. Anexe CRLV, seguro, nota fiscal ou outros documentos." />;
}
