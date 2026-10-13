"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { RiArrowRightSLine as ArrowRight, RiImageAddLine as AddImage, RiDeleteBinLine as Trash } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import type { AdSlotData, AdPosition } from "@/lib/blog/ads";

const labels: Record<AdPosition, { title: string; description: string }> = {
  top: { title: "Após a capa", description: "Aparece antes do texto do artigo." },
  middle: { title: "Meio do conteúdo", description: "Aparece entre os blocos do artigo, quando há conteúdo suficiente." },
  bottom: { title: "Final do artigo", description: "Aparece depois do conteúdo." },
};

function AdEditor({ initial }: { initial: AdSlotData }) {
  const [ad, setAd] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const label = labels[ad.position];
  const fieldClass = "h-9 w-full border bg-background px-3 text-sm outline-none focus-visible:border-primary";

  function update(changes: Partial<AdSlotData>) { setAd((current) => ({ ...current, ...changes })); setMessage(""); }

  async function save() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/ads", { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: ad.position, enabled: ad.enabled, advertiser: ad.advertiser,
          headline: ad.headline, description: ad.description, targetUrl: ad.targetUrl }) });
      if (!response.ok) throw new Error(await response.text() || "Não foi possível salvar.");
      const saved = await response.json() as AdSlotData;
      setAd(saved); setMessage("Campanha salva.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }

  async function upload(file: File) {
    setBusy(true); setError(""); setMessage("");
    try {
      const form = new FormData(); form.set("position", ad.position); form.set("file", file);
      const response = await fetch("/api/ads/image", { method: "POST", body: form });
      if (!response.ok) throw new Error(await response.text() || "Não foi possível enviar a imagem.");
      const result = await response.json() as { imageUrl: string };
      update({ imageUrl: result.imageUrl }); setMessage("Imagem enviada para o bucket post.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar a imagem."); }
    finally { setBusy(false); }
  }

  async function removeImage() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/ads/image?position=${ad.position}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text() || "Não foi possível remover a imagem.");
      update({ imageUrl: "" }); setMessage("Imagem removida.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível remover a imagem."); }
    finally { setBusy(false); }
  }

  return <section className="border bg-card" aria-labelledby={`ad-${ad.position}`}>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3"><div><h2 id={`ad-${ad.position}`} className="text-sm font-semibold">{label.title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{label.description}</p></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={ad.enabled} disabled={busy} onChange={(event) => update({ enabled: event.target.checked })} />Ativa</label></div>
    <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="grid gap-3">
        <label className="grid gap-1 text-xs font-medium">Anunciante <input className={fieldClass} value={ad.advertiser} maxLength={80} onChange={(event) => update({ advertiser: event.target.value })} placeholder="Nome ou marca" /></label>
        <label className="grid gap-1 text-xs font-medium">Título <input className={fieldClass} value={ad.headline} maxLength={120} onChange={(event) => update({ headline: event.target.value })} placeholder="Mensagem principal" /></label>
        <label className="grid gap-1 text-xs font-medium">Texto de apoio <textarea className="min-h-20 w-full resize-y border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary" value={ad.description} maxLength={300} onChange={(event) => update({ description: event.target.value })} placeholder="Descrição opcional" /></label>
        <label className="grid gap-1 text-xs font-medium">Link de destino <input className={fieldClass} value={ad.targetUrl} maxLength={2048} type="url" onChange={(event) => update({ targetUrl: event.target.value })} placeholder="https://exemplo.com" /></label>
      </div>
      <div className="space-y-2"><p className="text-xs font-medium">Imagem (opcional)</p><div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border bg-muted/30">{ad.imageUrl ? <Image src={ad.imageUrl} alt="Prévia do anúncio" fill unoptimized sizes="224px" className="object-contain" /> : <span className="text-xs text-muted-foreground">Sem imagem</span>}</div><input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="hidden" aria-label={`Imagem: ${label.title}`} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} /><div className="flex gap-2"><Button size="xs" variant="outline" disabled={busy} onClick={() => input.current?.click()}><AddImage />Enviar</Button>{ad.imageUrl && <Button size="xs" variant="ghost" disabled={busy} onClick={() => void removeImage()}><Trash />Remover</Button>}</div><p className="text-[11px] text-muted-foreground">PNG, JPEG, WebP ou AVIF, até 5 MB. Bucket post.</p></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"><p role={error ? "alert" : "status"} className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{error || message || (ad.enabled ? "Campanha ativa após salvar." : "Campanha desativada.")}</p><Button size="sm" disabled={busy} onClick={() => void save()}>{busy ? "Aguarde…" : "Salvar campanha"}</Button></div>
  </section>;
}

export function AdManager({ initial }: { initial: AdSlotData[] }) {
  return <main className="flex w-full flex-col gap-6 px-4 pb-12 pt-6 sm:px-7"><div className="border-b pb-5"><p className="mb-2 text-xs text-muted-foreground">Console / Conteúdo</p><h1 className="text-2xl font-semibold">Publicidade</h1><p className="mt-1 text-sm text-muted-foreground">Configure a campanha exibida em cada posição dos artigos. Cada post escolhe quais posições usa.</p></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_15rem]"><div className="grid gap-5">{initial.map((ad) => <AdEditor key={ad.position} initial={ad} />)}</div><aside className="h-fit border bg-card p-4 xl:sticky xl:top-20"><h2 className="text-sm font-semibold">Onde aparece</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Ative uma campanha aqui e habilite a posição no editor de cada post. Sem campanha ativa, o artigo não exibe uma caixa vazia.</p><Link href="/dashboard/blog" className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">Gerenciar posts <ArrowRight className="size-4" /></Link></aside></div>
  </main>;
}
