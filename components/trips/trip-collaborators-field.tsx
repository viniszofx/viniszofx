"use client";
import { CollapsibleFields } from "@/components/ui/collapsible-fields";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEmployees, matchesEmployee, retryEmployees } from "@/lib/employees/store";
export function TripCollaboratorsField({ selectedIds, onChange }: { selectedIds: string[]; onChange: (ids: string[]) => void }) {
 const { employees, loaded, error } = useEmployees();
 const [search, setSearch] = useState("");
 const filtered = employees.filter(employee => matchesEmployee(employee, search)).sort((a,b) => a.name.localeCompare(b.name,"pt-BR"));
 function toggle(id: string) { onChange(selectedIds.includes(id) ? selectedIds.filter(item => item !== id) : [...selectedIds, id]); }
 return <CollapsibleFields title="Colaboradores (opcional)"><p className="text-xs text-muted-foreground">{selectedIds.length} selecionado(s)</p><Input aria-label="Buscar colaboradores" placeholder="Buscar nome, cargo ou código…" value={search} onChange={event => setSearch(event.target.value)} />{!loaded && <p role="status" className="text-xs">Carregando colaboradores…</p>}{error && <div role="alert" className="text-xs text-destructive">{error}<Button type="button" variant="outline" size="sm" onClick={retryEmployees}>Tentar novamente</Button></div>}{loaded && !employees.length && <p className="text-xs text-muted-foreground">Cadastre colaboradores em <Link href="/dashboard/employees" className="underline">Employees</Link>.</p>}<div className="max-h-48 space-y-2 overflow-y-auto">{filtered.map(employee => <label key={employee.id} className="flex cursor-pointer items-start gap-3 border p-3 text-sm"><input type="checkbox" aria-label={`Selecionar colaborador ${employee.name}`} checked={selectedIds.includes(employee.id)} onChange={() => toggle(employee.id)} className="mt-1 size-4 shrink-0 accent-primary" /><span className="min-w-0"><span className="block break-words">{employee.name}</span><span className="block break-words text-xs text-muted-foreground">{[employee.code, employee.role, employee.department, employee.status === "terminated" ? "Desligado" : "Ativo"].filter(Boolean).join(" · ")}</span></span></label>)}{loaded && search && !filtered.length && <p className="text-xs text-muted-foreground">Nenhum colaborador encontrado.</p>}{loaded && selectedIds.filter(id => !employees.some(employee => employee.id === id)).map(id => <div key={id} className="flex items-center justify-between gap-2 border p-3 text-xs text-muted-foreground"><span>Colaborador removido</span><Button type="button" variant="ghost" size="xs" onClick={() => toggle(id)}>Remover vínculo</Button></div>)}</div></CollapsibleFields>;
}
