"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { RiArrowRightLine, RiBuilding2Line, RiGroupLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

type OrganizationRow = { id: string; name: string; slug: string; status: "active" | "suspended"; createdAt: Date | string; memberCount: number };
const inputClass = "h-11 w-full border border-input bg-background px-3 text-base sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

async function request<T>(url: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "Não foi possível concluir a ação.");
  return result as T;
}

export function OrganizationsManager({ initialOrganizations }: { initialOrganizations: OrganizationRow[] }) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const created = await request<Omit<OrganizationRow, "createdAt" | "memberCount">>("/api/admin/organizations", "POST", { name });
      setOrganizations((items) => [{ ...created, createdAt: new Date(), memberCount: 0 }, ...items]);
      setName("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar a organização."); }
    finally { setBusy(false); }
  }

  async function toggleStatus(organization: OrganizationRow) {
    setError("");
    try {
      const updated = await request<OrganizationRow>(`/api/admin/organizations/${organization.id}`, "PATCH", { status: organization.status === "active" ? "suspended" : "active" });
      setOrganizations((items) => items.map((item) => item.id === updated.id ? { ...item, status: updated.status } : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a organização."); }
  }

  return <div className="max-w-5xl space-y-7 pt-7">
    <section className="border bg-card p-5 sm:p-6"><div className="mb-4"><h2 className="text-base font-semibold">Nova organização</h2><p className="mt-1 text-sm text-muted-foreground">Cada organização pode ter membros e pessoas externas.</p></div>
      <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row"><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} placeholder="Nome da organização" required className={inputClass} /><Button type="submit" disabled={busy}>{busy ? "Criando…" : "Criar organização"}</Button></form>
    </section>
    {error && <p role="alert" className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
    <section><div className="mb-3 flex items-end justify-between"><div><h2 className="text-base font-semibold">Todas as organizações</h2><p className="text-sm text-muted-foreground">{organizations.length} cadastradas</p></div></div>
      {organizations.length === 0 ? <div className="border border-dashed px-5 py-10 text-center"><RiBuilding2Line className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="text-sm font-medium">Nenhuma organização criada</p><p className="mt-1 text-xs text-muted-foreground">Crie uma organização para começar a adicionar membros.</p></div> : <div className="divide-y border bg-card">{organizations.map((organization) => <article key={organization.id} className="flex flex-wrap items-center gap-4 p-4 sm:px-5"><div className="flex size-11 shrink-0 items-center justify-center border bg-primary/10 text-primary"><RiBuilding2Line className="size-5" /></div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{organization.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><RiGroupLine className="size-3.5" />{organization.memberCount} {organization.memberCount === 1 ? "membro" : "membros"} · {organization.slug}</p></div><span className={`border px-2 py-1 text-[11px] ${organization.status === "active" ? "border-emerald-600/30 text-emerald-700 dark:text-emerald-400" : "border-destructive/30 text-destructive"}`}>{organization.status === "active" ? "Ativa" : "Suspensa"}</span><Button type="button" variant="outline" size="sm" onClick={() => void toggleStatus(organization)}>{organization.status === "active" ? "Suspender" : "Reativar"}</Button><Button nativeButton={false} render={<Link href={`/dashboard/organizations/${organization.id}`} />} variant="ghost" size="icon-sm" aria-label={`Gerenciar ${organization.name}`}><RiArrowRightLine /></Button></article>)}</div>}
    </section>
  </div>;
}
