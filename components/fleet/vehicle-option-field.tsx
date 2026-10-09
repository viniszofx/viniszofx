"use client";
import { useState } from "react";
import { RiAddLine } from "@remixicon/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function VehicleOptionField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
 const [adding, setAdding] = useState(false);
 const choices = Array.from(new Set([...options, value].filter(Boolean))).sort((a,b) => a.localeCompare(b,"pt-BR"));
 return <div className="min-w-0 space-y-2"><label className="grid gap-2 text-sm">{label}<div className="flex min-w-0 items-center gap-2"><select aria-label={label} value={value} onChange={event => { onChange(event.target.value);setAdding(false); }} className="h-10 min-w-0 flex-1 border-b border-input bg-background text-sm outline-none focus-visible:border-ring"><option value="">Selecione</option>{choices.map(option => <option key={option}>{option}</option>)}</select><Button type="button" variant="outline" size="sm" aria-label={`Novo ${label.toLocaleLowerCase("pt-BR")}`} aria-expanded={adding} onClick={() => setAdding(!adding)}><RiAddLine />Novo</Button></div></label>{adding && <label className="grid gap-2 text-sm">Novo {label.toLocaleLowerCase("pt-BR")}<Input aria-label={`Novo ${label.toLocaleLowerCase("pt-BR")}`} autoFocus required maxLength={100} value={value} onChange={event => onChange(event.target.value)} /><span className="text-xs text-muted-foreground">Disponível nos próximos cadastros após salvar.</span></label>}</div>;
}
