"use client";

import { useState, type FormEvent } from "react";
import { RiGroupLine, RiUserAddLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { SetPasswordDialog } from "@/components/auth/password-reset";

type Member = { id: string; userId: string; role: "member" | "external"; status: "active" | "blocked"; createdAt: Date | string; name: string; email: string };
const inputClass = "h-11 w-full border border-input bg-background px-3 text-base sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

async function mutate(url: string, method: string, body?: Record<string, unknown>) {
  const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "Não foi possível concluir a ação.");
  return result;
}

export function OrganizationMembersManager({ organizationId, initialMembers, localAuth = false }: { organizationId: string; initialMembers: Member[]; localAuth?: boolean }) {
  const [settingPassword, setSettingPassword] = useState<Member | null>(null);
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "external">("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const base = `/api/admin/organizations/${organizationId}/members`;

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await mutate(base, "POST", { email, role });
      const response = await fetch(base, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível atualizar a lista.");
      setMembers(payload.members); setEmail("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível adicionar a pessoa."); }
    finally { setBusy(false); }
  }

  async function updateMember(member: Member, change: { role?: Member["role"]; status?: Member["status"] }) {
    setError("");
    try {
      const updated = await mutate(`${base}/${member.id}`, "PATCH", change) as Pick<Member, "id" | "role" | "status">;
      setMembers((items) => items.map((item) => item.id === updated.id ? { ...item, role: updated.role, status: updated.status } : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar a pessoa."); }
  }

  async function removeMember(member: Member) {
    if (!window.confirm(`Remover ${member.name} (${member.email}) desta organização?`)) return;
    setError("");
    try {
      await mutate(`${base}/${member.id}`, "DELETE");
      setMembers((items) => items.filter((item) => item.id !== member.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível remover a pessoa."); }
  }

  return <div className="max-w-5xl space-y-7 pt-7">
    <section className="border bg-card p-5 sm:p-6"><div className="mb-4 flex items-center gap-3"><div className="flex size-10 items-center justify-center border bg-primary/10 text-primary"><RiUserAddLine className="size-5" /></div><div><h2 className="text-base font-semibold">Adicionar pessoa</h2><p className="mt-0.5 text-sm text-muted-foreground">A conta precisa estar cadastrada no sistema.</p></div></div>
      <form onSubmit={addMember} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@exemplo.com" required className={inputClass} /><select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className={inputClass}><option value="member">Membro</option><option value="external">Externo</option></select><Button type="submit" disabled={busy}>{busy ? "Adicionando…" : "Adicionar"}</Button></form>
    </section>
    {error && <p role="alert" className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
    <section><div className="mb-3 flex items-end justify-between"><div><h2 className="text-base font-semibold">Membros</h2><p className="text-sm text-muted-foreground">Membros podem editar. Externos têm acesso somente leitura.</p></div><span className="flex items-center gap-1.5 border bg-muted px-2.5 py-1 text-xs text-muted-foreground"><RiGroupLine className="size-3.5" />{members.length}</span></div>
      {members.length === 0 ? <div className="border border-dashed px-5 py-10 text-center"><RiGroupLine className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="text-sm font-medium">Ainda não há membros</p><p className="mt-1 text-xs text-muted-foreground">Adicione alguém pelo e-mail cadastrado.</p></div> : <div className="divide-y border bg-card">{members.map((member) => <article key={member.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_150px_120px_auto] sm:items-center sm:px-5"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.name}</p><p className="truncate text-xs text-muted-foreground">{member.email}</p></div><select aria-label={`Função de ${member.name}`} value={member.role} onChange={(event) => void updateMember(member, { role: event.target.value as Member["role"] })} className="h-9 border border-input bg-background px-2 text-base sm:text-sm"><option value="member">Membro</option><option value="external">Externo</option></select><span className={`w-fit border px-2 py-1 text-[11px] ${member.status === "active" ? "border-emerald-600/30 text-emerald-700 dark:text-emerald-400" : "border-destructive/30 text-destructive"}`}>{member.status === "active" ? "Acesso ativo" : "Bloqueado"}</span><div className="flex flex-wrap gap-2">{localAuth && <Button type="button" variant="outline" size="sm" onClick={() => setSettingPassword(member)}>Senha</Button>}<Button type="button" variant="outline" size="sm" onClick={() => void updateMember(member, { status: member.status === "active" ? "blocked" : "active" })}>{member.status === "active" ? "Bloquear" : "Liberar"}</Button><Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void removeMember(member)}>Remover</Button></div></article>)}</div>}
    </section>
    {settingPassword && <SetPasswordDialog userId={settingPassword.userId} name={`${settingPassword.name} (${settingPassword.email})`} onClose={() => setSettingPassword(null)} />}
  </div>;
}
