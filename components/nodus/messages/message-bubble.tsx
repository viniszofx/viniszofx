"use client";
// Balões da conversa: mensagem enviada ou recebida e mensagem na fila de envio.
import type { HTMLAttributes, ReactNode } from "react";
import { RiAttachment2, RiCheckDoubleLine, RiCheckLine, RiErrorWarningLine, RiLockLine, RiMoreLine, RiReplyLine, RiTimeLine, RiTimerLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { bytes, fileUrl, isImage, isPdf, type Attachment, type Message } from "./dialogs";
import { time } from "./format";
import type { Outgoing } from "./offline";
import { PdfAttachmentPreview } from "./pdf-attachment-preview";
import { Avatar } from "./people";

export function MessageBubble({ message, locked, isLast, highlighted, peerName, showReceipts, menu, gestures, canChatWith, onChat, onReply, onReact, onView, onJumpReply }: {
  message: Message;
  /** Quem enviou impediu encaminhar e baixar. */
  locked: boolean;
  isLast: boolean;
  highlighted: boolean;
  peerName: string;
  /** Confirmação de leitura (não aparece em Mensagens salvas). */
  showReceipts: boolean;
  /** Conteúdo do menu "⋯" do balão. */
  menu: ReactNode;
  /** Toque longo, deslizar e botão direito, tratados pela tela. */
  gestures: HTMLAttributes<HTMLDivElement>;
  canChatWith: (id: string) => boolean;
  onChat: (id: string) => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onView: (item: Attachment) => void;
  onJumpReply: (id: string) => void;
}) {
  const mine = message.mine;
  return (
    <div id={`message-${message.id}`} tabIndex={0} {...gestures}
      className={`chat-swipeable flex max-w-[85%] flex-col gap-1 outline-none max-md:select-none max-md:[-webkit-touch-callout:none] focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-ring md:max-w-xl ${isLast ? "chat-message-enter" : ""} ${mine ? "chat-message-sent ml-auto items-end" : "chat-message-received mr-auto items-start"}`}>
      <div className={`min-w-0 rounded-2xl px-3 py-2 text-sm shadow-md inset-ring inset-ring-white/10 transition-[box-shadow] duration-300 ${highlighted ? "ring-3 ring-amber-400 ring-offset-2 ring-offset-transparent" : ""} ${locked ? "select-none" : ""} ${message.deleted ? "italic opacity-75" : ""} ${mine ? "rounded-br-md bg-linear-to-b from-(--chat-sent) to-(--chat-sent-2) text-(--chat-sent-ink)" : "rounded-bl-md bg-(--chat-received)/85 text-(--chat-received-ink) backdrop-blur-2xl backdrop-saturate-125 reduced-transparency:bg-(--chat-received) reduced-transparency:backdrop-blur-none"}`}>
        {message.forwarded && !message.deleted && <p className="mb-1 text-xs font-semibold opacity-75">{message.forwardedFrom ? `Encaminhada de ${message.forwardedFrom}` : "Encaminhada"}</p>}
        {message.replyTo && !message.deleted && <button type="button" onClick={() => onJumpReply(message.replyTo!.id)} className="mb-2 block w-full rounded border-l-2 border-current bg-background/10 px-2 py-1 text-left text-xs"><span className="block font-semibold">{message.replyTo.mine ? "Você" : peerName}</span><span className="line-clamp-2 whitespace-pre-wrap wrap-break-word opacity-80">{message.replyTo.body}</span></button>}
        {message.deleted ? <p>Mensagem apagada</p> : <>
          {message.contact && <div className="mb-1 flex min-w-52 items-center gap-3 rounded-xl border border-current/20 bg-background/10 px-3 py-2">
            <Avatar person={message.contact} />
            <span className="min-w-0 flex-1"><span className="block truncate font-medium">{message.contact.name}</span><span className="block text-xs opacity-75">Contato</span></span>
            {canChatWith(message.contact.id) && <Button type="button" size="xs" variant="ghost" className="text-inherit normal-case tracking-normal hover:bg-background/20" onClick={() => onChat(message.contact!.id)}>Conversar</Button>}
          </div>}
          {message.attachments.map(item => isImage(item.type)
            ? <button key={item.fileId} type="button" aria-label="Ver foto em tela cheia" onClick={() => onView(item)}
              onContextMenu={event => { if (locked) event.preventDefault(); }} className="-mx-1.5 -mt-1 mb-1 block overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <img src={fileUrl(message.id, item.fileId)} alt={message.body || "Foto"} loading="lazy" draggable={!locked} className="max-h-80 w-full min-w-40 object-cover" />
            </button>
            : isPdf(item) ? <PdfAttachmentPreview key={item.fileId} url={fileUrl(message.id, item.fileId)} name={item.name} size={item.size} noDownload={locked} />
            : locked ? <span key={item.fileId} className="mb-1 flex max-w-72 items-center gap-2 rounded-xl border border-current/20 bg-background/10 px-3 py-2">
              <RiLockLine className="size-5 shrink-0" /><span className="min-w-0"><span className="block truncate font-medium">{item.name}</span><span className="block text-xs opacity-75">Download desativado por quem enviou</span></span>
            </span>
            : <a key={item.fileId} href={fileUrl(message.id, item.fileId)} download={item.name} className="mb-1 flex max-w-72 items-center gap-2 rounded-xl border border-current/20 bg-background/10 px-3 py-2 outline-none hover:bg-background/20 focus-visible:ring-2 focus-visible:ring-ring">
              <RiAttachment2 className="size-5 shrink-0" /><span className="min-w-0"><span className="block truncate font-medium">{item.name}</span><span className="block text-xs opacity-75">{bytes(item.size)} · Baixar</span></span>
            </a>)}
          {message.body && <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>}
        </>}
        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-80">
          {message.expiresAt && !message.deleted && <RiTimerLine className="size-3.5" aria-label={`Some em ${time.format(new Date(message.expiresAt))}`} />}
          {message.editedAt && !message.deleted && <span>editada</span>}
          <time dateTime={message.createdAt}>{time.format(new Date(message.createdAt))}</time>
          {mine && showReceipts && !message.deleted && (message.readAt
            ? <span role="img" aria-label={`Lida ${time.format(new Date(message.readAt))}`} title={`Lida ${time.format(new Date(message.readAt))}`} className="-my-0.5 inline-flex items-center rounded-full bg-black/20 px-1 text-cyan-300 opacity-100 drop-shadow-[0_0_3px_rgb(103_232_249/.55)]"><RiCheckDoubleLine className="size-4" /></span>
            : <span role="img" aria-label="Enviada, ainda não lida" title="Enviada, ainda não lida" className="inline-flex opacity-60"><RiCheckLine className="size-3.5" /></span>)}
          {!message.deleted && <>
            <Button type="button" variant="ghost" size="icon-xs" className="chat-action ml-1 size-6 rounded-full text-inherit hover:bg-background/15" aria-label="Responder à mensagem" title="Responder" onClick={onReply}><RiReplyLine /></Button>
            <Popover>
              <PopoverTrigger render={<Button type="button" variant="ghost" size="icon-xs" className="chat-action ml-1 size-6 rounded-full text-inherit hover:bg-background/15" aria-label="Ações da mensagem" title="Ações da mensagem" />}><RiMoreLine /></PopoverTrigger>
              <PopoverContent align="end" sideOffset={6} className="w-48 p-1">{menu}</PopoverContent>
            </Popover>
          </>}
        </div>
      </div>
      {!!message.reactions.length && <div className="flex flex-wrap gap-1">{message.reactions.map(reaction => <button key={reaction.emoji} type="button" aria-label={`${reaction.count} reação com ${reaction.emoji}${reaction.mine ? ", sua reação" : ""}`} aria-pressed={reaction.mine} className={`chat-reaction glass-float rounded-full border px-2 py-0.5 text-xs ${reaction.mine ? "border-primary" : ""}`} onClick={() => onReact(reaction.emoji)}>{reaction.emoji} {reaction.count}</button>)}</div>}
    </div>
  );
}

/** Mensagem que ainda está na fila (aguardando sinal, enviando ou que falhou). */
export function OutgoingBubble({ item, onRetry, onDrop }: { item: Outgoing; onRetry: () => void; onDrop: () => void }) {
  return (
    <div className="chat-message-sent chat-message-enter ml-auto flex max-w-[85%] flex-col items-end gap-1 md:max-w-xl" aria-live="polite">
              <div className={`min-w-0 rounded-2xl rounded-br-md bg-linear-to-b from-(--chat-sent) to-(--chat-sent-2) px-3 py-2 text-sm text-(--chat-sent-ink) shadow-md inset-ring inset-ring-white/10 ${item.status === "failed" ? "ring-2 ring-destructive" : "opacity-80"}`}>
                {item.preview.forwarded && <p className="mb-1 text-xs font-semibold opacity-75">Encaminhada</p>}
                {item.preview.replyTo && <blockquote className="mb-2 rounded border-l-2 border-current bg-background/10 px-2 py-1 text-xs"><span className="line-clamp-2 opacity-80">{item.preview.replyTo.body}</span></blockquote>}
                {item.preview.body && <p className="whitespace-pre-wrap wrap-break-word">{item.preview.body}</p>}
                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-80">
                  <time dateTime={item.createdAt}>{time.format(new Date(item.createdAt))}</time>
                  {item.status === "failed"
                    ? <span role="img" aria-label="Não enviada" title="Não enviada"><RiErrorWarningLine className="size-3.5" /></span>
                    : <span role="img" aria-label={item.status === "waiting" ? "Aguardando conexão" : "Enviando"} title={item.status === "waiting" ? "Aguardando conexão" : "Enviando"}><RiTimeLine className="size-3.5" /></span>}
                </div>
              </div>
              {item.status === "failed" && <div className="flex items-center gap-2 text-xs">
                <span className="text-destructive">{item.error || "Não enviada."}</span>
                <Button type="button" size="xs" variant="outline" className="normal-case tracking-normal" onClick={onRetry}>Tentar de novo</Button>
                <Button type="button" size="xs" variant="ghost" className="normal-case tracking-normal" onClick={onDrop}>Descartar</Button>
              </div>}
            </div>
  );
}
