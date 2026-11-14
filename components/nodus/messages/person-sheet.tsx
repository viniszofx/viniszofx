"use client";
// Copiado do Nodus: ficha da pessoa e o que foi compartilhado na conversa.
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiAttachment2, RiCloseLine, RiLinkM, RiLockLine, RiMailFill, RiMoreFill, RiNotification3Fill, RiNotificationOffFill, RiSearchLine } from "@remixicon/react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { avatarGradient, initials, lastSeenLabel } from "./people";
import { fileUrl, isImage, type Message } from "./dialogs";

type Profile = { id: string; name: string; email: string; role: string; username: string; bio: string; avatar: string | null; lastSeen: string | null };
type Kind = "media" | "files" | "links";
const tabs: [Kind, string][] = [["media", "Mídia"], ["files", "Arquivos"], ["links", "Links"]];
const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
function urlsIn(text: string) {
  return [...new Set(text.match(/https?:\/\/[^\s<>"']+/g) ?? [])];
}

// O que foi trocado na conversa, em abas (como nos apps de conversa): fotos em grade, arquivos e links.
// Só aparecem as abas com conteúdo; sem nada compartilhado, a seção não aparece.
export function SharedContent({ peerId }: { peerId: string }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [chosen, setChosen] = useState<Kind | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const swipeStart = useRef<number | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/org/messages?with=${encodeURIComponent(peerId)}&shared=1`, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null).then(data => { if (alive && data) setMessages(data.messages); }).catch(() => undefined);
    return () => { alive = false; };
  }, [peerId]);
  const all = messages ?? [];
  const media = all.flatMap(message => message.attachments.filter(item => isImage(item.type)).map(item => ({ message, item })));
  const files = all.flatMap(message => message.attachments.filter(item => !isImage(item.type)).map(item => ({ message, item })));
  const links = all.flatMap(message => urlsIn(message.body).map(url => ({ message, url })));
  const counts: Record<Kind, number> = { media: media.length, files: files.length, links: links.length };
  const available = tabs.filter(([value]) => counts[value] > 0);
  const kind: Kind = chosen && counts[chosen] > 0 ? chosen : available[0]?.[0] ?? "media";
  const locked = (message: Message) => !message.mine && message.protected;
  if (!messages || !available.length) return null;

  return <section aria-label="Compartilhado na conversa" className="grid gap-3">
    {available.length > 1 && <Tabs value={kind} onValueChange={value => setChosen(value as Kind)} className="justify-self-center">
      <TabsList aria-label="Tipo de conteúdo">{available.map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}</TabsList>
    </Tabs>}
    {available.length === 1 && <h3 className="text-sm font-semibold">{available[0][1]}</h3>}

    {kind === "media" && <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-xl">
      {media.map(({ message, item }, index) => <button key={`${message.id}-${item.fileId}`} type="button" aria-label="Ver foto" onClick={() => setViewing(index)}
        onContextMenu={event => { if (locked(message)) event.preventDefault(); }} className="aspect-square overflow-hidden bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <img src={fileUrl(message.id, item.fileId)} alt={item.name} loading="lazy" className="size-full object-cover" />
      </button>)}
    </div>}

    {kind === "files" && <ul className="glass-card divide-y divide-border overflow-hidden rounded-xl border">
      {files.map(({ message, item }) => {
        const content = <>
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{locked(message) ? <RiLockLine className="size-5" /> : <RiAttachment2 className="size-5" />}</span>
          <span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.name}</span>
            <span className="block text-xs text-muted-foreground">{item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB · ` : ""}{day.format(new Date(message.createdAt))}{locked(message) ? " · download desativado" : ""}</span></span>
        </>;
        return <li key={`${message.id}-${item.fileId}`}>{locked(message)
          ? <div className="flex items-center gap-3 px-4 py-3 text-sm">{content}</div>
          : <a href={fileUrl(message.id, item.fileId)} download={item.name} className="flex items-center gap-3 px-4 py-3 text-sm outline-none hover:bg-muted/50 focus-visible:bg-muted/50">{content}</a>}</li>;
      })}
    </ul>}

    {kind === "links" && <ul className="glass-card divide-y divide-border overflow-hidden rounded-xl border">
      {links.map(({ message, url }) => <li key={`${message.id}-${url}`}>
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 text-sm outline-none hover:bg-muted/50 focus-visible:bg-muted/50">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><RiLinkM className="size-5" /></span>
          <span className="min-w-0 flex-1"><span className="block truncate font-medium">{hostOf(url)}</span><span className="block truncate text-xs text-primary">{url}</span></span>
        </a>
      </li>)}
    </ul>}

    {/* Foto em tela cheia, sem sair da ficha. Passa de uma foto para outra pelas setas, deslizando o dedo ou pelo teclado. */}
    {viewing !== null && media[viewing] && (() => {
      const go = (step: number) => { if (media[viewing + step]) setViewing(viewing + step); };
      const current = media[viewing];
      const arrow = "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur-xl hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/70 outline-none";
      return <div role="dialog" aria-modal="true" aria-label={`Foto ${viewing + 1} de ${media.length}`} tabIndex={-1} ref={element => element?.focus()}
        className="fixed inset-0 z-[120] grid place-items-center bg-black/90 p-4 outline-none" onClick={() => setViewing(null)}
        onKeyDown={event => { if (event.key === "ArrowLeft") go(-1); if (event.key === "ArrowRight") go(1); if (event.key === "Escape") setViewing(null); }}
        onTouchStart={event => { swipeStart.current = event.touches[0].clientX; }}
        onTouchEnd={event => {
          const start = swipeStart.current; swipeStart.current = null;
          if (start === null) return;
          const distance = event.changedTouches[0].clientX - start;
          if (Math.abs(distance) > 50) go(distance < 0 ? 1 : -1);
        }}>
        <p className="absolute top-[max(1.4rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 text-sm font-medium text-white/85 tabular-nums">{viewing + 1} de {media.length}</p>
        <button type="button" aria-label="Fechar" title="Fechar" className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 grid size-10 place-items-center rounded-full bg-white/15 text-white" onClick={() => setViewing(null)}><RiCloseLine className="size-6" /></button>
        <img src={fileUrl(current.message.id, current.item.fileId)} alt="Foto" className="max-h-[90dvh] max-w-full object-contain" onClick={event => event.stopPropagation()}
          onContextMenu={event => { if (locked(current.message)) event.preventDefault(); }} />
        {viewing > 0 && <button type="button" aria-label="Foto anterior" title="Anterior" className={`${arrow} left-3`} onClick={event => { event.stopPropagation(); go(-1); }}><RiArrowLeftSLine className="size-7" /></button>}
        {viewing < media.length - 1 && <button type="button" aria-label="Próxima foto" title="Próxima" className={`${arrow} right-3`} onClick={event => { event.stopPropagation(); go(1); }}><RiArrowRightSLine className="size-7" /></button>}
      </div>;
    })()}
  </section>;
}

const CIRCLE = 96; // avatar em círculo (sem foto, ou foto recolhida)
const COLLAPSED = 196; // altura do topo recolhido: círculo, nome e situação
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

// Ficha da pessoa (toque no nome ou na foto da conversa), como nos apps de conversa. Tela cheia no celular.
// Com foto: a foto ocupa o topo, com nome e ações por cima; ao rolar, encolhe até virar um círculo com o nome embaixo.
// Sem foto: já começa no formato recolhido (círculo, nome e ações em cartões claros).
export function PersonSheet({ personId, self, open, onOpenChange, muted, onToggleMute, onSearch, moreActions }: {
  personId: string; self: boolean; open: boolean; onOpenChange: (open: boolean) => void;
  muted: boolean; onToggleMute: () => void; onSearch: () => void; moreActions: ReactNode;
}) {
  const [width, setWidth] = useState(390);
  const [scroll, setScroll] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetch(`/api/org/messages/people/${encodeURIComponent(personId)}`, { cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (alive) { setProfile(data); setFailed(false); } }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [open, personId]);
  const name = self ? "Mensagens salvas" : profile?.name ?? "";
  const status = self ? "Só você vê estas mensagens" : profile ? lastSeenLabel(profile.lastSeen) : "";
  const photo = self ? null : profile?.avatar ?? null;
  // Mede a largura da ficha para a foto ocupar o topo inteiro.
  const measure = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const height = Math.round(Math.min(width * 1.1, 470));
  const progress = photo ? clamp(scroll / (height - COLLAPSED)) : 1;

  // Ações rápidas: vidro sobre a foto, ou cartões claros com ícone azul (sem foto).
  function actions(onPhoto: boolean) {
    const tile = onPhoto
      ? "flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/18 py-2.5 text-xs font-medium text-white outline-none backdrop-blur-xl hover:bg-white/28 focus-visible:ring-2 focus-visible:ring-white/70 [&_svg]:size-6"
      : "glass-card flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-medium text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5";
    const columns = self ? "grid-cols-2" : profile?.email ? "grid-cols-4" : "grid-cols-3";
    return <div className={`grid gap-2 ${columns}`}>
      {!self && <button type="button" className={tile} onClick={onToggleMute}>{muted ? <RiNotification3Fill /> : <RiNotificationOffFill />}{muted ? "reativar" : "silenciar"}</button>}
      <button type="button" className={tile} onClick={onSearch}><RiSearchLine />buscar</button>
      {!self && profile?.email && <a href={`mailto:${profile.email}`} className={tile}><RiMailFill />e-mail</a>}
      <Popover>
        <PopoverTrigger render={<button type="button" className={tile} />}><RiMoreFill />mais</PopoverTrigger>
        <PopoverContent align="end" side="bottom" sideOffset={10} collisionPadding={12} className="max-h-[min(36rem,calc(100dvh-6rem))] w-72 overflow-y-auto rounded-2xl p-1.5">{moreActions}</PopoverContent>
      </Popover>
    </div>;
  }

  const details = <div className="grid gap-4 px-4 pt-4 pb-8">
    {!photo && actions(false)}
    {failed && <p role="alert" className="text-sm text-destructive">Não foi possível carregar a ficha.</p>}
    {profile && !self && <dl className="glass-card divide-y divide-border overflow-hidden rounded-xl border text-sm">
      {profile.username && <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Usuário</dt><dd>@{profile.username}</dd></div>}
      {profile.bio && <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Sobre</dt><dd className="whitespace-pre-wrap">{profile.bio}</dd></div>}
      {profile.email && <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">E-mail</dt><dd><a href={`mailto:${profile.email}`} className="break-all text-primary hover:underline">{profile.email}</a></dd></div>}
      <div className="px-4 py-3"><dt className="text-xs text-muted-foreground">Acesso</dt><dd className="text-muted-foreground">{profile.role === "external" ? "Externo (somente leitura)" : "Membro"}</dd></div>
    </dl>}
    {open && <SharedContent peerId={personId} />}
  </div>;

  // Posições do topo, entre a foto inteira (0) e o círculo recolhido (1).
  const headerHeight = photo ? Math.max(COLLAPSED, height - scroll) : COLLAPSED;
  const size = { width: lerp(width, CIRCLE, progress), height: lerp(height, CIRCLE, progress) };
  const circleTop = 14;
  const dark = progress > 0.6;

  return <Dialog open={open} onOpenChange={next => { if (!next) setScroll(0); onOpenChange(next); }}>
    <DialogContent showCloseButton={false}
      className="block h-[min(46rem,calc(100dvh-2rem))] gap-0 overflow-hidden bg-background p-0 sm:max-w-sm sm:p-0 max-md:inset-0 max-md:h-dvh max-md:max-h-dvh max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:ring-0">
      <DialogTitle className="sr-only">{name || "Ficha da pessoa"}</DialogTitle>
      <DialogDescription className="sr-only">{status}</DialogDescription>
      <div ref={measure} className="relative size-full">
        {/* Topo: foto que vira círculo, nome e situação. Fica fixo enquanto o restante rola por baixo. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 overflow-hidden pt-[env(safe-area-inset-top)]" style={{ height: headerHeight }}>
          <div aria-hidden="true" className="absolute inset-0 border-b bg-background/85 backdrop-blur-xl" style={{ opacity: photo ? progress : clamp(scroll / 24) }} />
          <div aria-hidden="true" className={`absolute overflow-hidden ${photo ? "bg-black" : `${avatarGradient(personId)} grid place-items-center font-semibold text-white`}`}
            style={{ ...size, left: lerp(0, (width - CIRCLE) / 2, progress), top: lerp(0, circleTop, progress), borderRadius: lerp(0, CIRCLE / 2, progress), fontSize: 40 }}>
            {photo ? <img src={photo} alt="" className="size-full object-cover" /> : self ? "★" : initials(profile?.name ?? "?")}
          </div>
          {photo && <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/70 via-black/25 to-transparent" style={{ opacity: 1 - progress }} />}
          {/* Nome sobre a foto (aberta) e nome centralizado sob o círculo (recolhida). */}
          {photo && <div aria-hidden="true" className="absolute inset-x-4 text-white" style={{ bottom: 92, opacity: clamp(1 - progress * 2.5) }}>
            <p className="truncate text-2xl font-semibold">{name}</p><p className="text-sm text-white/80">{status}</p>
          </div>}
          <div aria-hidden="true" className="absolute inset-x-4 text-center" style={{ top: circleTop + CIRCLE + 10, opacity: photo ? clamp((progress - 0.6) / 0.4) : 1 }}>
            <p className="truncate text-xl font-semibold">{name || " "}</p><p className="text-sm text-muted-foreground">{status || " "}</p>
          </div>
          {photo && <div className="absolute inset-x-4 bottom-4" style={{ opacity: clamp(1 - progress * 2), pointerEvents: progress > 0.3 ? "none" : "auto" }}>{actions(true)}</div>}
        </div>
        <DialogClose className={`absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-20 grid size-11 place-items-center rounded-full outline-none backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-ring ${dark ? "bg-card text-foreground shadow-sm" : "bg-black/25 text-white hover:bg-black/35"}`}
          aria-label="Voltar" title="Voltar"><RiArrowLeftSLine className="size-7" /></DialogClose>
        {/* Rola por baixo do topo: começa logo abaixo da foto (ou do círculo, sem foto). */}
        <div className="absolute inset-0 overflow-y-auto overscroll-contain" onScroll={event => setScroll(event.currentTarget.scrollTop)}>
          <div style={{ paddingTop: photo ? height : COLLAPSED }}>{details}</div>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
