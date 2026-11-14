"use client";
// Copiado do Nodus.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { loadChatTheme } from "./chat-theme";
import { ChatBackdrop, chatThemeProps } from "./chat-theme-picker";
import type { Message } from "./dialogs";

const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Prévia da conversa (toque longo ou botão direito na lista): últimas mensagens, no tema da conversa,
// sem marcar como lidas. "Abrir conversa" abre de verdade (e aí marca).
export function ConversationPreview({ userId, person, avatar, onOpenChange, onOpen }: {
  userId: string;
  person: { id: string; name: string } | null;
  avatar: ReactNode;
  onOpenChange: (open: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ id: string; messages: Message[] | null; error: boolean } | null>(null);
  useEffect(() => {
    if (!person) return;
    let alive = true;
    fetch(`/api/org/messages?with=${encodeURIComponent(person.id)}&peek=1`, { cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (alive) setState({ id: person.id, messages: data.messages, error: false }); })
      .catch(() => { if (alive) setState({ id: person.id, messages: null, error: true }); });
    return () => { alive = false; };
  }, [person]);
  const current = state && person && state.id === person.id ? state : null;
  const messages = current?.messages?.slice(-20) ?? [];
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight; }, [messages.length, person?.id]);
  const theme = person ? loadChatTheme(userId, person.id) : null;
  const themeProps = theme ? chatThemeProps(theme) : null;
  const title = person ? person.id === userId ? "Mensagens salvas" : person.name : "";

  return <Dialog open={!!person} onOpenChange={onOpenChange}>
    <DialogContent className="flex max-h-[80dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md sm:p-0 max-md:top-auto max-md:bottom-0 max-md:w-full max-md:max-w-full max-md:translate-y-0 max-md:rounded-b-none max-md:data-open:zoom-in-100 max-md:data-open:slide-in-from-bottom max-md:data-closed:zoom-out-100 max-md:data-closed:slide-out-to-bottom">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {avatar}
        <DialogTitle className="min-w-0 flex-1 truncate text-base">{title}</DialogTitle>
      </div>
      <div style={themeProps?.style} className={`${themeProps?.className ?? ""} relative isolate min-h-48 flex-1 overflow-hidden`}>
        {theme && <ChatBackdrop theme={theme} />}
        <div ref={list} className="flex h-full max-h-[50dvh] flex-col gap-2 overflow-y-auto p-4">
          {!current && <p className="m-auto text-sm text-muted-foreground">Carregando…</p>}
          {current?.error && <p role="alert" className="m-auto text-sm text-destructive">Não foi possível carregar a prévia.</p>}
          {current?.messages && !messages.length && <p className="m-auto text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>}
          {messages.map(message => {
            const photo = message.attachments.some(item => item.type.startsWith("image/"));
            const file = message.attachments.find(item => !item.type.startsWith("image/"));
            return <div key={message.id} className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm shadow-sm ${message.mine
              ? "ml-auto rounded-br-md bg-linear-to-b from-(--chat-sent) to-(--chat-sent-2) text-(--chat-sent-ink)"
              : "mr-auto rounded-bl-md bg-(--chat-received)/90 text-(--chat-received-ink) backdrop-blur-xl"}`}>
              <p className="line-clamp-6 whitespace-pre-wrap wrap-break-word">{photo && <span className="mr-1">📷</span>}{file && <span className="mr-1">📎 {file.name}</span>}{message.deleted ? "Mensagem apagada" : message.contact ? `👤 ${message.contact.name}` : message.body || (photo ? "Foto" : "")}</p>
              <time dateTime={message.createdAt} className="mt-0.5 block text-right text-[11px] opacity-75">{time.format(new Date(message.createdAt))}</time>
            </div>;
          })}
        </div>
      </div>
      <div className="grid gap-2 border-t p-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button type="button" onClick={() => person && onOpen(person.id)}>Abrir conversa</Button>
        <p className="text-center text-xs text-muted-foreground">Prévia: as mensagens continuam como não lidas.</p>
      </div>
    </DialogContent>
  </Dialog>;
}
