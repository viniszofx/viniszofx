"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { RiFileCopyLine, RiRefreshLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";

type Health = { state: "checking" | "ok" | "database" | "offline"; latencyMs?: number };

function Row({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className={alert ? "font-medium text-destructive" : "font-medium"}>{value}</dd></div>;
}
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className={cn(surfaceVariants())}><div className="border-b px-5 py-4"><h2 className="text-sm font-semibold">{title}</h2>{description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}</div>{children}</section>;
}

// Reúne o que costuma resolver um chamado (Nodus: Suporte). Aqui não há fila
// offline: os dados vão direto ao servidor, então o diagnóstico verifica a API e o banco.
export function SupportPage({ user }: { user: { id: string; name: string; email: string } }) {
  const [health, setHealth] = useState<Health>({ state: "checking" });
  const [online, setOnline] = useState(true);
  const check = useCallback(async () => {
    setHealth({ state: "checking" });
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      setHealth(response.ok ? { state: "ok", latencyMs: body.latencyMs } : { state: "database" });
    } catch { setHealth({ state: "offline" }); }
  }, []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    const first = setTimeout(() => { update(); void check(); }, 0);
    const timer = setInterval(() => void check(), 30_000);
    return () => { clearTimeout(first); clearInterval(timer); window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, [check]);
  const server = { checking: "Verificando…", ok: `Respondendo${health.latencyMs !== undefined ? ` (banco em ${health.latencyMs} ms)` : ""}`, database: "Servidor responde, banco indisponível", offline: "Sem resposta" }[health.state];
  async function copy() {
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } };
    const text = [
      `Data: ${new Date().toLocaleString("pt-BR")}`, "", "Usuário", `Nome: ${user.name}`, `E-mail: ${user.email}`, `ID: ${user.id}`, "",
      "Dispositivo", `Tela: ${screen.width}x${screen.height} (janela ${window.innerWidth}x${window.innerHeight}, escala ${window.devicePixelRatio})`,
      `Toque: ${navigator.maxTouchPoints > 0 ? "sim" : "não"}`, navigator.hardwareConcurrency ? `Processadores: ${navigator.hardwareConcurrency}` : null,
      device.deviceMemory ? `Memória: ${device.deviceMemory} GB ou mais` : null, `Idioma: ${navigator.language}`,
      `Fuso horário: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`, `Navegador: ${navigator.userAgent}`, "",
      "Aplicação", `Conexão: ${online ? "conectado" : "sem internet"}${device.connection?.effectiveType ? ` (${device.connection.effectiveType})` : ""}`, `Servidor: ${server}`, `Página: ${location.pathname}`,
    ].filter(line => line !== null).join("\n");
    try { await navigator.clipboard.writeText(text); notifySuccess("Diagnóstico copiado. Cole na mensagem para o suporte."); }
    catch { notifyError("Não foi possível copiar", "Seu navegador bloqueou a área de transferência."); }
  }
  const shortcuts = [
    { label: "Trocar meu nome ou senha", href: "/dashboard/settings/profile" },
    { label: "Dados da empresa, endereço de origem e cores dos serviços", href: "/dashboard/settings/company" },
    { label: "Organizações e membros", href: "/dashboard/organizations" },
  ];
  return <div className="max-w-3xl space-y-6">
    <Section title="Este aparelho"><dl className="divide-y">
      <Row label="Conexão" value={online ? "Conectado" : "Sem internet"} alert={!online} />
      <Row label="Servidor" value={server} alert={health.state === "offline" || health.state === "database"} />
      <Row label="Armazenamento" value="Dados salvos na sua conta, no servidor" />
    </dl><div className="flex flex-wrap gap-2 border-t px-5 py-4">
      <Button size="sm" variant="outline" onClick={() => void check()}><RiRefreshLine />Verificar de novo</Button>
      <Button size="sm" variant="outline" onClick={() => location.reload()}><RiRefreshLine />Recarregar o app</Button>
      <Button size="sm" variant="outline" onClick={() => void copy()}><RiFileCopyLine />Copiar diagnóstico</Button>
    </div></Section>
    <Section title="Ações frequentes"><ul className="divide-y">{shortcuts.map(item => <li key={item.href}><Link href={item.href} className="block px-5 py-3 text-sm outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">{item.label}</Link></li>)}</ul></Section>
  </div>;
}
