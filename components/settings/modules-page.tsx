"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiCheckboxCircleLine, RiCloseCircleLine, RiForbidLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { appModules, type AppModule } from "@/lib/modules";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";

const sections = [...new Set(appModules.map(module => module.section))];

/** Sistema › Módulos (Nodus): cada função liga e desliga para todas as organizações. */
export function ModulesPage({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [disabled, setDisabled] = useState(initial);
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState<AppModule | null>(null);
  async function setEnabled(module: AppModule, enabled: boolean) {
    setBusy(module.key);
    try {
      const response = await fetch("/api/system/modules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: module.key, enabled }) });
      if (!response.ok) throw new Error(await response.text());
      setDisabled(previous => enabled ? previous.filter(item => item !== module.key) : [...previous, module.key]);
      notifySuccess(`${module.name} ${enabled ? "ativado" : "desativado"}.`);
      setConfirm(null);
      router.refresh();
    } catch (cause) { notifyError("Módulo não alterado", cause instanceof Error ? cause.message : ""); }
    finally { setBusy(""); }
  }
  const active = appModules.length - disabled.filter(key => appModules.some(module => module.key === key)).length;
  return <div className="max-w-3xl space-y-7">
    <p className="text-sm text-muted-foreground">{active} de {appModules.length} módulos ativos. Desligado, o módulo some do menu, do Início e dos atalhos, a página e as APIs ficam indisponíveis, e os dados continuam guardados.</p>
    {sections.map(section => <section key={section} aria-labelledby={`modules-${section}`}>
      <h2 id={`modules-${section}`} className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{section}</h2>
      <ul className={cn(surfaceVariants({ list: true }))}>{appModules.filter(module => module.section === section).map(module => {
        const enabled = !disabled.includes(module.key);
        return <li key={module.key} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <div className="min-w-0"><p className="flex flex-wrap items-center gap-2 text-sm font-medium">{module.name}<span className={`inline-flex items-center gap-1 text-xs font-normal ${enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{enabled ? <RiCheckboxCircleLine className="size-3.5" /> : <RiCloseCircleLine className="size-3.5" />}{enabled ? "Ativo" : "Inativo"}</span></p><p className="mt-0.5 text-xs text-muted-foreground">{module.description}{module.off && " · Desligado por padrão"}</p></div>
          <Switch checked={enabled} disabled={!!busy} hideLabel label={`${module.name}: ${enabled ? "ativo" : "inativo"}`} onChange={value => value ? void setEnabled(module, true) : setConfirm(module)} />
        </li>;
      })}</ul>
    </section>)}
    {confirm && <Dialog open onOpenChange={open => { if (!open && !busy) setConfirm(null); }}><DialogContent>
      <DialogTitle>Desativar {confirm.name}?</DialogTitle>
      <DialogDescription>O módulo ficará indisponível em todas as organizações até ser ativado novamente. Os dados existentes serão preservados.</DialogDescription>
      <DialogFooter><Button variant="outline" disabled={!!busy} onClick={() => setConfirm(null)}>Cancelar</Button><Button variant="destructive" disabled={!!busy} onClick={() => void setEnabled(confirm, false)}><RiForbidLine />{busy ? "Aguarde…" : "Desativar módulo"}</Button></DialogFooter>
    </DialogContent></Dialog>}
  </div>;
}
