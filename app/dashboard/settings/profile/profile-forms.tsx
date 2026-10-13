"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

const fieldClass = "h-11 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProfileForms({ name: initialName, email }: { name: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ error: boolean; text: string } | null>(null);

  async function updateName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingName) return;
    const nextName = name.trim();
    if (nextName.length < 2 || nextName.length > 80) {
      setNameMessage({ error: true, text: "Informe um nome entre 2 e 80 caracteres." });
      return;
    }
    setSavingName(true);
    setNameMessage(null);
    try {
      const result = await authClient.updateUser({ name: nextName });
      if (result.error) throw new Error(result.error.message);
      setName(nextName);
      setNameMessage({ error: false, text: "Nome atualizado." });
      router.refresh();
    } catch {
      setNameMessage({ error: true, text: "Não foi possível atualizar o nome. Tente novamente." });
    } finally { setSavingName(false); }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingPassword) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    if (newPassword !== data.get("confirmPassword")) {
      setPasswordMessage({ error: true, text: "As novas senhas não coincidem." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ error: true, text: "Use pelo menos 8 caracteres na nova senha." });
      return;
    }
    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword });
      if (result.error) throw new Error(result.error.message);
      form.reset();
      setPasswordMessage({ error: false, text: "Senha alterada com sucesso." });
    } catch {
      setPasswordMessage({ error: true, text: "Não foi possível alterar a senha. Confira a senha atual e tente novamente." });
    } finally { setSavingPassword(false); }
  }

  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
  return <div className="grid gap-6">
    <section className="border bg-card p-6 sm:p-8" aria-labelledby="profile-info">
      <div className="mb-6 flex items-center gap-4"><div className="flex size-14 shrink-0 items-center justify-center bg-primary/10 font-heading text-xl font-semibold text-primary" aria-hidden="true">{initials}</div><div><h2 id="profile-info" className="font-heading text-xl font-semibold">Dados pessoais</h2><p className="text-sm text-muted-foreground">Nome exibido na sua conta.</p></div></div>
      <form onSubmit={updateName} className="space-y-5">
        <div className="space-y-2"><label htmlFor="profile-name" className="block text-sm font-medium">Nome</label><input id="profile-name" name="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} autoComplete="name" required className={fieldClass} /></div>
        <div className="space-y-2"><label htmlFor="profile-email" className="block text-sm font-medium">E-mail</label><input id="profile-email" type="email" value={email} readOnly className={`${fieldClass} cursor-default bg-muted/40 text-muted-foreground`} /><p className="text-xs text-muted-foreground">O e-mail da conta é gerenciado pelo serviço de autenticação.</p></div>
        <div className="flex flex-wrap items-center gap-4"><Button type="submit" disabled={savingName}>{savingName ? "Salvando…" : "Salvar nome"}</Button>{nameMessage && <p role={nameMessage.error ? "alert" : "status"} className={nameMessage.error ? "text-sm text-destructive" : "text-sm"}>{nameMessage.text}</p>}</div>
      </form>
    </section>
    <section className="border bg-card p-6 sm:p-8" aria-labelledby="profile-security">
      <div className="mb-6 space-y-1"><h2 id="profile-security" className="font-heading text-xl font-semibold">Segurança</h2><p className="text-sm text-muted-foreground">Altere a senha usada para entrar no painel.</p></div>
      <form onSubmit={updatePassword} className="space-y-5">
        <div className="space-y-2"><label htmlFor="current-password" className="block text-sm font-medium">Senha atual</label><input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required className={fieldClass} /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="new-password" className="block text-sm font-medium">Nova senha</label><input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} required className={fieldClass} /></div><div className="space-y-2"><label htmlFor="confirm-password" className="block text-sm font-medium">Confirme a nova senha</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required className={fieldClass} /></div></div>
        <div className="flex flex-wrap items-center gap-4"><Button type="submit" disabled={savingPassword}>{savingPassword ? "Alterando…" : "Alterar senha"}</Button>{passwordMessage && <p role={passwordMessage.error ? "alert" : "status"} className={passwordMessage.error ? "text-sm text-destructive" : "text-sm"}>{passwordMessage.text}</p>}</div>
      </form>
    </section>
  </div>;
}
