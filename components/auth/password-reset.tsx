"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RiKeyLine, RiLoader4Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";

type ResetClient = {
  requestPasswordReset: (input: { email: string; redirectTo: string }) => Promise<{ error?: { message?: string } | null }>;
  resetPassword: (input: { newPassword: string; token: string }) => Promise<{ error?: { message?: string } | null }>;
};
const resetClient = authClient as unknown as ResetClient;

/**
 * "Esqueci a senha". No Neon Auth envia o link por e-mail; no modo local (sem e-mail)
 * registra o pedido e a administração define uma senha nova, como no Nodus.
 */
export function ForgotPasswordButton({ localAuth }: { localAuth: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      if (localAuth) {
        const response = await fetch("/api/password-help", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Não foi possível enviar o pedido.");
      } else {
        const result = await resetClient.requestPasswordReset({ email, redirectTo: `${location.origin}/reset-password` });
        if (result.error) throw new Error(result.error.message || "Não foi possível enviar o e-mail.");
      }
      setSent(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  return <>
    <button type="button" className="text-sm text-primary underline-offset-4 hover:underline" onClick={() => { setOpen(true); setSent(false); setError(""); }}>Esqueci a senha</button>
    {open && <Dialog open onOpenChange={value => { if (!value && !busy) setOpen(false); }}><DialogContent className="sm:max-w-md">
      <DialogTitle>Redefinir senha</DialogTitle>
      <DialogDescription>{localAuth ? "Informe o e-mail da conta. A administração recebe o pedido e define uma senha nova para você." : "Informe o e-mail da conta. Enviaremos um link para criar uma senha nova."}</DialogDescription>
      {sent ? <div className="space-y-4"><p role="status" className="text-sm">{localAuth ? "Pedido registrado. Se o e-mail tiver conta, a administração vai definir uma senha nova e avisar você." : "Se o e-mail tiver conta, você vai receber o link em instantes. Confira também o spam."}</p><div className="flex justify-end"><Button onClick={() => setOpen(false)}>Entendi</Button></div></div>
        : <form onSubmit={event => void submit(event)} className="space-y-4">
          <Field label="E-mail" required><Input type="email" autoComplete="username" autoFocus required value={email} onChange={event => setEmail(event.target.value)} /></Field>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={busy || !email.trim()}>{busy ? <><RiLoader4Line className="animate-spin" />Enviando…</> : localAuth ? "Pedir nova senha" : "Enviar link"}</Button></div>
        </form>}
    </DialogContent></Dialog>}
  </>;
}

/** Página do link de redefinição (Neon Auth). */
export function ResetPasswordForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 8) return setError("A senha deve ter ao menos 8 caracteres.");
    if (password !== form.get("confirmPassword")) return setError("As senhas não coincidem.");
    setBusy(true); setError("");
    try {
      const result = await resetClient.resetPassword({ newPassword: password, token });
      if (result.error) throw new Error(result.error.message || "O link expirou ou já foi usado.");
      setDone(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  if (!token) return <p role="alert" className="text-sm text-destructive">Link inválido. Peça um novo em “Esqueci a senha”.</p>;
  if (done) return <div className="space-y-4"><p role="status" className="text-sm">Senha alterada. Entre com a senha nova.</p><Button onClick={() => location.replace("/login")}>Ir para o login</Button></div>;
  return <form onSubmit={event => void submit(event)} className="space-y-4">
    <Field label="Nova senha" required hint="Mínimo de 8 caracteres."><Input name="password" type="password" autoComplete="new-password" minLength={8} required autoFocus /></Field>
    <Field label="Confirme a senha" required><Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></Field>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={busy} className="w-full">{busy ? "Salvando…" : "Salvar nova senha"}</Button>
  </form>;
}

type Request = { id: string; userId: string; email: string; name: string; createdAt: string };

/** Administração: definir uma senha nova para alguém (pedidos de "Esqueci a senha" ou direto do membro). */
export function SetPasswordDialog({ userId, name, onClose, onDone }: { userId: string; name: string; onClose: () => void; onDone?: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const suggest = () => setPassword(Array.from(crypto.getRandomValues(new Uint8Array(9)), byte => "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"[byte % 55]).join(""));
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Não foi possível alterar a senha.");
      setDone(true); onDone?.();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={value => { if (!value && !busy) onClose(); }}><DialogContent className="sm:max-w-md">
    <DialogTitle>Definir nova senha</DialogTitle><DialogDescription>{name}. As sessões abertas da pessoa serão encerradas.</DialogDescription>
    {done ? <div className="space-y-4"><p role="status" className="text-sm">Senha alterada. Envie a senha nova para a pessoa por um canal seguro: <strong className="font-mono">{password}</strong></p><div className="flex justify-end"><Button onClick={onClose}>Concluir</Button></div></div>
      : <form onSubmit={event => void submit(event)} className="space-y-4">
        <Field label="Nova senha" required hint="Mínimo de 8 caracteres."><div className="flex gap-2"><Input autoFocus minLength={8} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} /><Button type="button" variant="outline" onClick={suggest}>Gerar</Button></div></Field>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy || password.length < 8}>Salvar senha</Button></div>
      </form>}
  </DialogContent></Dialog>;
}

export function PasswordRequests() {
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [current, setCurrent] = useState<Request | null>(null);
  const load = useCallback(async () => { const response = await fetch("/api/admin/password-requests", { cache: "no-store" }); if (response.ok) setRequests(await response.json()); }, []);
  useEffect(() => { const first = setTimeout(() => void load(), 0); return () => clearTimeout(first); }, [load]);
  if (!requests?.length) return null;
  return <section className="mt-7 max-w-5xl border border-primary/40 bg-primary/5" aria-labelledby="password-requests">
    <header className="flex items-center gap-2 border-b border-primary/30 px-5 py-3"><RiKeyLine className="size-4 text-primary" /><h2 id="password-requests" className="text-sm font-semibold">Pedidos de nova senha</h2></header>
    <ul className="divide-y">{requests.map(request => <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"><span className="min-w-0"><strong className="block truncate">{request.name}</strong><span className="text-xs text-muted-foreground">{request.email} · {new Date(request.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span></span><Button size="sm" onClick={() => setCurrent(request)}>Definir nova senha</Button></li>)}</ul>
    {current && <SetPasswordDialog userId={current.userId} name={`${current.name} (${current.email})`} onClose={() => setCurrent(null)} onDone={() => void load()} />}
  </section>;
}
