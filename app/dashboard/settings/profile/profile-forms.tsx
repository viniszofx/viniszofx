"use client";

import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { RiCameraLine, RiDeleteBinLine } from "@remixicon/react";
import { AvatarCropper } from "@/components/ui/avatar-cropper";
import { Button } from "@/components/ui/button";

type SessionRow = { id: string; token: string; createdAt: string | Date; expiresAt: string | Date; userAgent?: string | null; ipAddress?: string | null };
type AuthSessionRow = SessionRow | { session: SessionRow; user: { id: string } };
const fieldClass = "h-11 w-full border border-input bg-background px-3 text-base sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

async function authRequest<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => null) as { message?: string; error?: string } | null;
  if (!response.ok) throw new Error(result?.message || result?.error || "A autenticação não concluiu a operação.");
  return result as T;
}

/** Nome legível do aparelho a partir do navegador informado na sessão. */
function deviceLabel(agent?: string | null) {
  if (!agent) return "Dispositivo conectado";
  const browser = /Edg\//.test(agent) ? "Edge" : /OPR\//.test(agent) ? "Opera" : /Firefox\//.test(agent) ? "Firefox" : /SamsungBrowser/.test(agent) ? "Samsung Internet" : /Chrome\//.test(agent) ? "Chrome" : /Safari\//.test(agent) ? "Safari" : "Navegador";
  const system = /iPhone/.test(agent) ? "iPhone" : /iPad/.test(agent) ? "iPad" : /Android/.test(agent) ? "Android" : /Windows/.test(agent) ? "Windows" : /Mac OS X|Macintosh/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "";
  return system ? `${browser} no ${system}` : browser;
}

async function listAuthSessions() {
  const result = await authRequest<AuthSessionRow[]>("list-sessions");
  return result.map((row) => "session" in row ? row.session : row);
}

export function ProfileForms({ name: initialName, email, image, username: initialUsername, bio: initialBio }: { name: string; email: string; image?: string | null; username: string; bio: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(image ?? null);
  const [cropping, setCropping] = useState<File | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{ error: boolean; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    listAuthSessions().then((data) => {
      if (!active) return;
      setSessions(data);
      setLoadingSessions(false);
    }).catch(() => { if (active) { setSessionMessage("Não foi possível carregar as sessões."); setLoadingSessions(false); } });
    authRequest<{ session?: { token?: string } } | null>("get-session").then((data) => { if (active) setCurrentToken(data?.session?.token ?? null); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingProfile) return;
    const nextName = name.trim();
    if (nextName.length < 2 || nextName.length > 80) { setProfileMessage({ error: true, text: "Informe um nome entre 2 e 80 caracteres." }); return; }
    setSavingProfile(true); setProfileMessage(null);
    try {
      await authRequest("update-user", { name: nextName });
      const result = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, bio }) });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.error || "Não foi possível salvar o perfil.");
      setUsername(payload.username); setBio(payload.bio);
      setProfileMessage({ error: false, text: "Perfil atualizado." });
      router.refresh();
    } catch (error) {
      setProfileMessage({ error: true, text: error instanceof Error ? error.message : "Não foi possível salvar o perfil." });
    } finally { setSavingProfile(false); }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingPassword) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    if (newPassword !== data.get("confirmPassword")) { setPasswordMessage({ error: true, text: "As novas senhas não coincidem." }); return; }
    if (newPassword.length < 8) { setPasswordMessage({ error: true, text: "Use pelo menos 8 caracteres na nova senha." }); return; }
    setSavingPassword(true); setPasswordMessage(null);
    try {
      await authRequest("change-password", { currentPassword, newPassword, revokeOtherSessions: true });
      form.reset();
      setPasswordMessage({ error: false, text: "Senha alterada. As outras sessões foram encerradas." });
      setSessions(await listAuthSessions());
    } catch { setPasswordMessage({ error: true, text: "Não foi possível alterar a senha. Confira a senha atual e tente novamente." }); }
    finally { setSavingPassword(false); }
  }

  async function revokeSession(token: string) {
    setSessionMessage(null);
    try { await authRequest("revoke-session", { token }); }
    catch { setSessionMessage("Não foi possível encerrar essa sessão."); return; }
    setSessions((current) => current.filter((row) => row.token !== token));
    setSessionMessage("Sessão encerrada.");
  }

  function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarMessage({ error: true, text: "Escolha um arquivo de imagem." }); return; }
    if (file.size > 15 * 1024 * 1024) { setAvatarMessage({ error: true, text: "A imagem pode ter até 15 MB." }); return; }
    setAvatarMessage(null); setCropping(file);
  }

  async function uploadPhoto(blob: Blob) {
    const form = new FormData();
    form.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    const response = await fetch("/api/profile/avatar", { method: "POST", body: form });
    const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
    if (!response.ok || !payload.url) throw new Error(payload.error || "Não foi possível salvar a foto.");
    setAvatar(payload.url); setCropping(null);
    setAvatarMessage({ error: false, text: "Foto atualizada." });
    router.refresh();
  }

  async function removePhoto() {
    setAvatarMessage(null);
    const response = await fetch("/api/profile/avatar", { method: "DELETE" }).catch(() => null);
    if (!response?.ok) { setAvatarMessage({ error: true, text: "Não foi possível remover a foto." }); return; }
    setAvatar(null); setAvatarMessage({ error: false, text: "Foto removida." });
    router.refresh();
  }

  async function revokeOthers() {
    setSessionMessage(null);
    try { await authRequest("revoke-other-sessions", {}); }
    catch { setSessionMessage("Não foi possível desconectar os outros aparelhos."); return; }
    setSessions((current) => current.filter((row) => row.token === currentToken));
    setSessionMessage("Os outros aparelhos foram desconectados.");
  }

  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
  return <div className="grid gap-6">
    <section className={cn(surfaceVariants(), "overflow-hidden shadow-sm")} aria-labelledby="profile-info">
      <div className="border-b bg-muted/40 px-6 py-7 sm:px-8">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileInput.current?.click()} className="group relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-background shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={avatar ? "Trocar foto de perfil" : "Adicionar foto de perfil"}>
            {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center bg-primary/15 font-heading text-xl font-semibold text-primary">{initials}</span>}
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><RiCameraLine className="size-5" /></span>
          </button>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickPhoto} />
          <div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Sua conta</p><h2 id="profile-info" className="mt-1 truncate font-heading text-xl font-semibold">{name || "Seu perfil"}</h2><p className="truncate text-sm text-muted-foreground">{email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}><RiCameraLine />{avatar ? "Trocar foto" : "Adicionar foto"}</Button>{avatar && <Button type="button" variant="ghost" size="sm" onClick={() => void removePhoto()}><RiDeleteBinLine />Remover</Button>}{avatarMessage && <span role={avatarMessage.error ? "alert" : "status"} className={avatarMessage.error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{avatarMessage.text}</span>}</div>
          </div>
        </div>
      </div>
      {cropping && <AvatarCropper file={cropping} onCancel={() => setCropping(null)} onDone={uploadPhoto} />}
      <form onSubmit={updateProfile} className="space-y-5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><label htmlFor="profile-name" className="block text-sm font-medium">Nome completo</label><input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} autoComplete="name" required className={fieldClass} /></div>
          <div className="space-y-2"><label htmlFor="profile-username" className="block text-sm font-medium">Nome de usuário</label><div className="flex h-11 items-center border border-input bg-background focus-within:ring-2 focus-within:ring-ring rounded-lg"><span className="pl-3 text-sm text-muted-foreground">@</span><input id="profile-username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={30} autoComplete="username" required className="h-full min-w-0 flex-1 bg-transparent px-2 text-base sm:text-sm outline-none" /></div><p className="text-xs text-muted-foreground">Letras minúsculas, números, ponto e sublinhado.</p></div>
        </div>
        <div className="space-y-2"><label htmlFor="profile-email" className="block text-sm font-medium">E-mail</label><input id="profile-email" type="email" value={email} readOnly className={`${fieldClass} cursor-default bg-muted/40 text-muted-foreground`} /><p className="text-xs text-muted-foreground">O e-mail é gerenciado pelo serviço de autenticação.</p></div>
        <div className="space-y-2"><div className="flex items-center justify-between"><label htmlFor="profile-bio" className="block text-sm font-medium">Sobre você</label><span className="text-xs text-muted-foreground">{bio.length}/240</span></div><textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value.slice(0, 240))} rows={4} maxLength={240} placeholder="Conte um pouco sobre você..." className="w-full resize-y border border-input bg-background px-3 py-2.5 text-base sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" /></div>
        <div className="flex flex-wrap items-center gap-4 border-t pt-5"><Button type="submit" disabled={savingProfile}>{savingProfile ? "Salvando…" : "Salvar alterações"}</Button>{profileMessage && <p role={profileMessage.error ? "alert" : "status"} className={profileMessage.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{profileMessage.text}</p>}</div>
      </form>
    </section>

    <section className={cn(surfaceVariants(), "p-6 shadow-sm sm:p-8")} aria-labelledby="profile-security">
      <div className="mb-6"><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Acesso</p><h2 id="profile-security" className="mt-1 font-heading text-xl font-semibold">Segurança</h2><p className="mt-1 text-sm text-muted-foreground">Atualize sua senha e acompanhe onde sua conta está conectada.</p></div>
      <form onSubmit={updatePassword} className="space-y-5">
        <div className="space-y-2"><label htmlFor="current-password" className="block text-sm font-medium">Senha atual</label><input id="current-password" name="currentPassword" type="password" autoComplete="current-password" required className={fieldClass} /></div>
        <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="new-password" className="block text-sm font-medium">Nova senha</label><input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} required className={fieldClass} /></div><div className="space-y-2"><label htmlFor="confirm-password" className="block text-sm font-medium">Confirme a nova senha</label><input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required className={fieldClass} /></div></div>
        <div className="flex flex-wrap items-center gap-4"><Button type="submit" disabled={savingPassword}>{savingPassword ? "Alterando…" : "Alterar senha"}</Button>{passwordMessage && <p role={passwordMessage.error ? "alert" : "status"} className={passwordMessage.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{passwordMessage.text}</p>}</div>
      </form>
      <div className="mt-8 border-t pt-6"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h3 className="font-heading text-lg font-semibold">Sessões ativas</h3><p className="text-sm text-muted-foreground">Dispositivos que acessaram sua conta.</p></div><div className="flex items-center gap-2"><span className="border bg-muted px-2.5 py-1 text-xs text-muted-foreground">{sessions.length} {sessions.length === 1 ? "sessão" : "sessões"}</span>{sessions.length > 1 && <Button type="button" variant="outline" size="sm" onClick={() => void revokeOthers()}>Desconectar os outros</Button>}</div></div>
        {loadingSessions ? <p className="text-sm text-muted-foreground">Carregando sessões…</p> : sessions.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma sessão encontrada.</p> : <ul className="divide-y border">{sessions.map((session) => <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="flex items-center gap-2 truncate text-sm font-medium">{deviceLabel(session.userAgent)}{session.token === currentToken && <span className="border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">Este aparelho</span>}</p><p className="mt-1 text-xs text-muted-foreground">{session.ipAddress || "IP indisponível"} · desde {new Date(session.createdAt).toLocaleDateString("pt-BR")} · expira {new Date(session.expiresAt).toLocaleDateString("pt-BR")}</p></div>{session.token !== currentToken && <Button type="button" variant="outline" size="sm" onClick={() => void revokeSession(session.token)}>Encerrar</Button>}</li>)}</ul>}
        {sessionMessage && <p role="status" className="mt-3 text-sm text-muted-foreground">{sessionMessage}</p>}
      </div>
    </section>
  </div>;
}
