"use client";
import { useRef, useState } from "react";
import { RiAttachmentLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { CardAttachments } from "@/components/boards/card-attachments";
import type { CardAttachment } from "@/lib/boards/store";
export function AttachmentsField({ files, onChange, label = "Anexos", removalContext = "o registro", hint = "Até 20 MB por arquivo." }: { files: CardAttachment[]; onChange: (files: CardAttachment[]) => void; label?: string; removalContext?: string; hint?: string }) {
 const input = useRef<HTMLInputElement>(null); const [error, setError] = useState("");
 function attach(selectedFiles: File[]) {
   const accepted = selectedFiles.filter(file => file.size <= 20 * 1024 * 1024);
   setError(accepted.length === selectedFiles.length ? "" : "Cada arquivo pode ter até 20 MB.");
   const attachments: CardAttachment[] = accepted.map(file => ({ id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join(""), name: file.name, type: file.type, size: file.size, blob: file }));
   if (attachments.length) onChange([...files, ...attachments]);
 }
 return <section aria-label={label} className="space-y-4"><h3 className="text-sm font-semibold">Anexos</h3>
 <input ref={input} type="file" multiple aria-label={`Anexar arquivos: ${label}`} className="hidden" onChange={event => { attach(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
 <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => input.current?.click()}><RiAttachmentLine />Anexos</Button><p className="text-xs text-muted-foreground">{hint}</p>
 {error && <p role="alert" className="text-xs text-destructive">{error}</p>}<CardAttachments files={files} removalContext={removalContext} onRemove={id => onChange(files.filter(file => file.id !== id))} />
 </section>;
}
