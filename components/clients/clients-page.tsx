"use client";
import { useState } from "react";
import { RiBuildingLine as Building2, RiMailLine as Mail, RiPhoneLine as Phone, RiGroupLine as Users, RiAddLine as Plus, RiPencilLine as Pencil, RiDeleteBinLine as Trash2 } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CatalogLayout, CatalogSearch, CatalogTile, CatalogFooter, CatalogCreate, CatalogSkeleton, catalogGrid } from "@/components/listing/catalog";
import { useClients, deleteClient, retryClients, matchesClient, type Client } from "@/lib/clients/store";
import { ClientDialog } from "./client-dialog";

export function ClientsPage({ initialClientId = "" }: { initialClientId?: string }) {
  const { clients, loaded, pending, error } = useClients();
  const [manualEditing, setEditing] = useState<Client | "new" | null | undefined>();
  const editing = manualEditing === undefined ? clients.find(client => client.id === initialClientId) ?? null : manualEditing;
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const filtered = clients.filter(client => matchesClient(client, search)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return <CatalogLayout section="Meu painel" title="Clients" description="Organize seus clientes e informações de contato." action={<Button disabled={!loaded} onClick={() => setEditing("new")}><Plus />Novo cliente</Button>}>
    <CatalogSearch label="Buscar clientes" value={search} onChange={setSearch} />
    {!loaded ? <CatalogSkeleton label="Carregando clientes" /> : <><p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "cliente" : "clientes"}</p><div className={catalogGrid}>{filtered.map(client => <CatalogTile key={client.id}>
      <button className="min-w-0 flex-1 space-y-4 p-5 text-left outline-none hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Abrir cliente ${client.name}`} onClick={() => setEditing(client)}><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center bg-primary/10"><Users className="size-5 text-primary" /></span><div className="min-w-0"><h2 className="break-words font-semibold">{client.name}</h2>{client.company && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="size-3 shrink-0" /><span className="truncate">{client.company}</span></p>}</div></div><div className="space-y-2 text-xs text-muted-foreground">{client.email && <p className="flex gap-2"><Mail className="size-3.5 shrink-0" /><span className="break-all">{client.email}</span></p>}{client.phone && <p className="flex gap-2"><Phone className="size-3.5 shrink-0" /><span className="break-words">{client.phone}</span></p>}{!client.email && !client.phone && <p>Contato não informado.</p>}</div>{client.notes && <p className="line-clamp-2 break-words text-xs text-muted-foreground">{client.notes}</p>}</button>
      <CatalogFooter><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(client.createdAt))}</span><div className="flex"><Button variant="ghost" size="icon-sm" aria-label={`Editar cliente ${client.name}`} onClick={() => setEditing(client)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Excluir cliente ${client.name}`} onClick={() => setDeleting(client)}><Trash2 /></Button></div></CatalogFooter>
    </CatalogTile>)}{!search.trim() && <CatalogCreate label="Criar cliente" onClick={() => setEditing("new")} />}</div>{!filtered.length && <p className="text-sm text-muted-foreground">{search.trim() ? "Nenhum cliente encontrado. Tente outro termo." : "Cadastre seu primeiro cliente para começar."}</p>}</>}
    <div aria-live="polite" className="text-xs text-muted-foreground">{error ? <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">{error}<Button variant="outline" size="sm" onClick={retryClients}>Tentar novamente</Button></div> : pending ? "Salvando…" : loaded ? "Salvo no navegador" : "Carregando…"}</div>
    {editing && <ClientDialog key={editing === "new" ? "new" : editing.id} client={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    {deleting && <Dialog open onOpenChange={open => { if (!open) setDeleting(null); }}><DialogContent><DialogTitle>Excluir cliente?</DialogTitle><DialogDescription>O cadastro de {deleting.name} será removido deste navegador. Esta ação não pode ser desfeita.</DialogDescription><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button><Button variant="destructive" onClick={() => { deleteClient(deleting.id); setDeleting(null); }}>Excluir</Button></div></DialogContent></Dialog>}
  </CatalogLayout>;
}
