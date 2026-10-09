"use client";
import { addressText } from "@/lib/format/address";
import { useState } from "react";
import { RiBuildingLine as Building2, RiMailLine as Mail, RiPhoneLine as Phone, RiGroupLine as Users, RiAddLine as Plus, RiPencilLine as Pencil, RiDeleteBinLine as Trash2 } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CatalogLayout, CatalogSearch, CatalogTile, CatalogFooter, CatalogCreate, CatalogSkeleton, catalogGrid } from "@/components/listing/catalog";
import { useEmployees, deleteEmployee, retryEmployees, matchesEmployee, type Employee } from "@/lib/employees/store";
import { EmployeeDialog } from "./employee-dialog";

export function EmployeesPage({ initialEmployeeId = "" }: { initialEmployeeId?: string }) {
  const { employees, loaded, pending, error } = useEmployees();
  const [manualEditing, setEditing] = useState<Employee | "new" | null | undefined>();
  const editing = manualEditing === undefined ? employees.find(employee => employee.id === initialEmployeeId) ?? null : manualEditing;
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const filtered = employees.filter(employee => matchesEmployee(employee, search)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return <CatalogLayout section="Meu painel" title="Employees" description="Organize seus empregados e informações de contato." action={<Button disabled={!loaded} onClick={() => setEditing("new")}><Plus />Novo empregado</Button>}>
    <CatalogSearch label="Buscar empregados" value={search} onChange={setSearch} />
    {!loaded ? <CatalogSkeleton label="Carregando empregados" /> : <><p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "empregado" : "empregados"}</p><div className={catalogGrid}>{filtered.map(employee => <CatalogTile key={employee.id}>
      <button className="min-w-0 flex-1 space-y-4 p-5 text-left outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Abrir empregado ${employee.name}`} onClick={() => setEditing(employee)}><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center bg-primary/10"><Users className="size-5 text-primary" /></span><div className="min-w-0"><p className="mb-1 font-mono text-xs text-muted-foreground">{employee.code}</p><h2 className="break-words font-semibold">{employee.name}</h2><p className="mt-1 text-xs text-muted-foreground">{employee.status === "terminated" ? "Desligado" : "Ativo"}</p>{employee.role && <p className="mt-1 text-xs text-muted-foreground">{employee.role}</p>}{employee.department && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="size-3 shrink-0" /><span className="truncate">{employee.department}</span></p>}</div></div><div className="space-y-2 text-xs text-muted-foreground">{employee.email && <p className="flex gap-2"><Mail className="size-3.5 shrink-0" /><span className="break-all">{employee.email}</span></p>}{employee.phone && <p className="flex gap-2"><Phone className="size-3.5 shrink-0" /><span className="break-words">{employee.phone}</span></p>}{!employee.email && !employee.phone && <p>Contato não informado.</p>}</div>{(addressText(employee) || employee.address) && <p className="line-clamp-2 break-words text-xs text-muted-foreground">{addressText(employee) || employee.address}</p>}{!!employee.attachments?.length && <p className="text-xs text-muted-foreground">{employee.attachments.length} anexo(s)</p>}{employee.notes && <p className="line-clamp-2 break-words text-xs text-muted-foreground">{employee.notes}</p>}</button>
      <CatalogFooter><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(employee.createdAt))}</span><div className="flex"><Button variant="ghost" size="icon-sm" aria-label={`Editar empregado ${employee.name}`} onClick={() => setEditing(employee)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Excluir empregado ${employee.name}`} onClick={() => setDeleting(employee)}><Trash2 /></Button></div></CatalogFooter>
    </CatalogTile>)}{!search.trim() && <CatalogCreate label="Criar empregado" onClick={() => setEditing("new")} />}</div>{!filtered.length && <p className="text-sm text-muted-foreground">{search.trim() ? "Nenhum empregado encontrado. Tente outro termo." : "Cadastre seu primeiro empregado para começar."}</p>}</>}
    <div aria-live="polite" className="text-xs text-muted-foreground">{error ? <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">{error}<Button variant="outline" size="sm" onClick={retryEmployees}>Tentar novamente</Button></div> : pending ? "Salvando…" : loaded ? "Salvo no navegador" : "Carregando…"}</div>
    {editing && <EmployeeDialog key={editing === "new" ? "new" : editing.id} employee={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    {deleting && <ConfirmDialog title="Excluir empregado?" description={`O cadastro de ${deleting.name} será removido deste navegador. Esta ação não pode ser desfeita.`} onConfirm={() => deleteEmployee(deleting.id)} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
