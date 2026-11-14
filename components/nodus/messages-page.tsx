"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  RiArchiveLine, RiArrowLeftSLine, RiAttachment2, RiCameraLine, RiCheckDoubleLine, RiCheckLine, RiCloseLine, RiDeleteBinLine, RiEditLine, RiEmotionHappyLine,
  RiErrorWarningLine, RiFileCopyLine, RiFileLine, RiForbidLine, RiInboxUnarchiveLine, RiMoreLine, RiNotificationOffLine, RiNotificationLine, RiReplyLine, RiSearchLine,
  RiSendPlaneFill, RiShareForwardLine, RiAddLine, RiUserLine, RiUserSharedLine, RiImageLine, RiPaletteLine, RiTimerLine, RiShieldLine, RiShieldCheckLine, RiFlagLine,
  RiEraserLine, RiEyeOffLine, RiEyeLine, RiAlarmWarningLine, RiWifiOffLine,
} from "@remixicon/react";
import { CatalogLayout, CatalogSearch } from "@/components/listing/catalog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { LoadingBlock } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { matchesText } from "@/lib/records/store";
import { notifyError, notifySuccess } from "@/lib/ui/notifications";
import { cn } from "@/lib/utils";
import { NoOrganization } from "./no-organization";
import { readTheme, saveTheme, sentBubble, themeBackground, type ChatTheme } from "./messages/chat-theme";
import {
  AutoDeleteDialog, autoDeleteLabel, bytes, Face, fileUrl, isImage, PeoplePicker, ProfileDialog, ReportDialog, ReportsDialog, seenLabel, SharedDialog, ThemeDialog,
  type Attachment, type Message, type Person,
} from "./messages/dialogs";
import { isNetworkError, readCopy, saveCopy, sinceLabel } from "./messages/offline";

type Thread = { archived: boolean; muted: boolean; blocked: boolean; blockedMe: boolean; protectContent: boolean; peerProtects: boolean; autoDeleteSeconds: number | null };
type Upload = Attachment & { uploading?: boolean; key: string };
type Overview = { me: string; admin: boolean; presenceHidden: boolean; people: Person[] };

const emojis = ["😀", "😂", "😊", "😍", "🤔", "😅", "😉", "😎", "🙏", "👍", "👎", "👏", "🙌", "💪", "🔥", "✅", "❌", "⚠️", "🎉", "❤️", "📌", "📎", "📅", "⏰", "🚗", "🛠️", "📦", "💡", "👀", "🤝"];
const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const time = (value: string) => {
  const date = new Date(value); const today = new Date().toDateString() === date.toDateString();
  return date.toLocaleString("pt-BR", today ? { timeStyle: "short" } : { dateStyle: "short", timeStyle: "short" });
};
async function failure(response: Response) {
  if (response.status === 401) return "Entre em uma organização para acessar as mensagens.";
  // Só mostra o texto do servidor quando é uma frase nossa (não HTML de erro nem "Internal Server Error").
  const text = (await response.text().catch(() => "")).trim();
  const own = text && text.length < 300 && !text.startsWith("<") && !/internal server error|^error$/i.test(text) ? text : "";
  if (response.status === 403) return own || "Sua conta tem acesso somente para leitura.";
  if (response.status === 404) return own || "Essa pessoa não está mais disponível nesta organização.";
  if (response.status === 413) return "O arquivo é grande demais para enviar.";
  if (response.status >= 500) return "O servidor teve um problema ao buscar as mensagens. Tente de novo em instantes.";
  return own || "Não foi possível concluir a solicitação. Tente novamente.";
}
/** Junta a página mais recente com as anteriores já carregadas, sem duplicar. */
function merge(current: Message[], incoming: Message[]) {
  const map = new Map(current.filter(item => !item.local).map(item => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).concat(current.filter(item => item.local));
}

/** Mensagens diretas entre membros da organização (Nodus: Comunicação › Mensagens). */
export function MessagesPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [offlineSince, setOfflineSince] = useState("");
  const [noOrganization, setNoOrganization] = useState(false);
  const [tab, setTab] = useState<"inbox" | "archived">("inbox");
  const [search, setSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<{ id: string; with: string; body: string; createdAt: string; mine: boolean }[] | null>(null);
  const [selected, setSelected] = useState("");
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);
  const [threadError, setThreadError] = useState("");
  const [threadOffline, setThreadOffline] = useState("");
  const [text, setText] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState<Message | null>(null);
  const [forwarding, setForwarding] = useState<Message | null>(null);
  const [composing, setComposing] = useState(false);
  const [sharingContact, setSharingContact] = useState(false);
  const [photo, setPhoto] = useState<{ src: string; name: string; protected: boolean } | null>(null);
  const [profile, setProfile] = useState("");
  const [sharedOpen, setSharedOpen] = useState(false);
  const [reporting, setReporting] = useState<{ message: Message | null } | null>(null);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [autoDeleteOpen, setAutoDeleteOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [theme, setTheme] = useState<ChatTheme>("classic");
  const [findOpen, setFindOpen] = useState(false);
  const [find, setFind] = useState("");
  const [findResults, setFindResults] = useState<Message[] | null>(null);
  const selectedRef = useRef(selected);
  const threadRequest = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const localId = useRef(0);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  const people = overview?.people ?? null;

  const loadPeople = useCallback(async () => {
    try {
      const response = await fetch("/api/org/messages", { cache: "no-store" });
      if (response.status === 401) { setNoOrganization(true); return; }
      setNoOrganization(false);
      if (!response.ok) throw new Error(await failure(response));
      const data: Overview = await response.json();
      setOverview(data); setError(""); setOfflineSince("");
      saveCopy(data.me, "people", data);
    } catch (cause) {
      // Sem sinal: abre a última lista vista neste aparelho.
      const copy = isNetworkError(cause) ? readCopy<Overview>("people") : null;
      if (copy) { setOverview(current => current ?? copy.data); setOfflineSince(copy.savedAt); setError(""); return; }
      setError(cause instanceof Error && !isNetworkError(cause) ? cause.message : "Sem conexão com o servidor.");
    }
  }, []);
  const loadThread = useCallback(async (id: string) => {
    const request = ++threadRequest.current;
    try {
      const response = await fetch(`/api/org/messages?with=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await failure(response));
      const data = await response.json();
      if (threadRequest.current !== request || selectedRef.current !== id) return;
      setMessages(current => merge(current ?? [], data.messages));
      setHasMore(previous => previous || data.hasMore);
      setThread(data.thread); setThreadError(""); setThreadOffline("");
      const me = readCopy<Overview>("people")?.data.me;
      if (me) saveCopy(me, `thread:${id}`, { messages: data.messages, thread: data.thread });
    } catch (cause) {
      if (threadRequest.current !== request || selectedRef.current !== id) return;
      const copy = isNetworkError(cause) ? readCopy<{ messages: Message[]; thread: Thread }>(`thread:${id}`) : null;
      if (copy) { setMessages(current => current?.length ? current : copy.data.messages); setThread(current => current ?? copy.data.thread); setThreadOffline(copy.savedAt); setThreadError(""); return; }
      setThreadError(cause instanceof Error && !isNetworkError(cause) ? cause.message : "Sem conexão com o servidor.");
      setMessages(current => current ?? []);
    }
  }, []);
  async function loadOlder() {
    if (!messages?.length || !selected) return;
    const first = messages.find(item => !item.local);
    const response = await fetch(`/api/org/messages?with=${encodeURIComponent(selected)}&before=${encodeURIComponent(first?.createdAt ?? "")}`, { cache: "no-store" });
    if (!response.ok) return notifyError("Mensagens anteriores", await failure(response));
    const data = await response.json();
    setMessages(current => merge(current ?? [], data.messages)); setHasMore(data.hasMore);
  }

  useEffect(() => {
    const first = setTimeout(() => void loadPeople(), 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void loadPeople(); }, 15_000);
    window.addEventListener("online", loadPeople);
    return () => { clearTimeout(first); clearInterval(timer); window.removeEventListener("online", loadPeople); };
  }, [loadPeople]);
  useEffect(() => {
    if (!selected) return;
    const first = setTimeout(() => void loadThread(selected), 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void loadThread(selected); }, 6_000);
    return () => { clearTimeout(first); clearInterval(timer); threadRequest.current++; };
  }, [selected, loadThread]);
  const lastId = messages?.at(-1)?.id;
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [lastId]);
  // Busca em todas as conversas.
  useEffect(() => {
    const query = search.trim();
    if (query.length < 3) { const reset = setTimeout(() => setGlobalResults(null), 0); return () => clearTimeout(reset); }
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/org/messages?q=${encodeURIComponent(query)}`, { cache: "no-store" }).catch(() => null);
      if (response?.ok) setGlobalResults((await response.json()).results);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);
  // Busca dentro da conversa aberta.
  useEffect(() => {
    const query = find.trim();
    if (!findOpen || !selected || query.length < 2) { const reset = setTimeout(() => setFindResults(null), 0); return () => clearTimeout(reset); }
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/org/messages?with=${encodeURIComponent(selected)}&q=${encodeURIComponent(query)}`, { cache: "no-store" }).catch(() => null);
      if (response?.ok) setFindResults((await response.json()).messages);
    }, 300);
    return () => clearTimeout(timer);
  }, [find, findOpen, selected]);

  function open(id: string) {
    if (id === selected) return;
    setSelected(id); setMessages(null); setHasMore(false); setThread(null); setThreadError(""); setThreadOffline("");
    setReplyTo(null); setEditing(null); setUploads([]); setText(""); setFindOpen(false); setFind(""); setTheme(readTheme(id));
  }

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    for (const file of Array.from(list).slice(0, 10)) {
      if (file.size > 20 * 1024 * 1024) { notifyError("Arquivo muito grande", `${file.name} passa de 20 MB.`); continue; }
      const key = `${Date.now()}-${file.name}`;
      setUploads(current => [...current, { key, fileId: "", name: file.name, type: file.type, size: file.size, uploading: true }]);
      const form = new FormData(); form.set("file", file);
      try {
        const response = await fetch("/api/org/messages/attachments", { method: "POST", body: form });
        if (!response.ok) throw new Error(await failure(response));
        const saved: Attachment = await response.json();
        setUploads(current => current.map(item => item.key === key ? { ...saved, key } : item));
      } catch (cause) {
        setUploads(current => current.filter(item => item.key !== key));
        notifyError("Anexo não enviado", cause instanceof Error ? cause.message : "");
      }
    }
  }

  async function post(payload: Record<string, unknown>, local?: Message) {
    const id = local?.id ?? `local-${++localId.current}`;
    const contact = typeof payload.contact === "string" ? people?.find(item => item.id === payload.contact) : undefined;
    const draft: Message = local ?? { id, body: String(payload.body ?? ""), createdAt: new Date().toISOString(), mine: true, readAt: null, editedAt: null, deleted: false,
      forwarded: !!payload.forwardOf, forwardedFrom: null, expiresAt: null, protected: false, reactions: [],
      contact: contact ? { id: contact.id, name: contact.name, email: contact.email, avatar: contact.avatar } : null,
      attachments: (payload.attachments as Attachment[]) ?? [], replyTo: replyTo ? { id: replyTo.id, mine: replyTo.mine, body: replyTo.body } : null, local: "sending", payload };
    setMessages(current => [...(current ?? []).filter(item => item.id !== id), { ...draft, local: "sending" }]);
    try {
      const response = await fetch("/api/org/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(await failure(response));
      setMessages(current => (current ?? []).filter(item => item.id !== id));
      await Promise.all([loadThread(String(payload.to)), loadPeople()]);
    } catch (cause) {
      setMessages(current => (current ?? []).map(item => item.id === id ? { ...item, local: "failed" } : item));
      notifyError("Mensagem não enviada", isNetworkError(cause) ? "Sem conexão. Tente de novo quando o sinal voltar." : cause instanceof Error ? cause.message : "Tente novamente.");
    }
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!selected) return;
    const body = text.trim();
    if (editing) {
      if (!body) return;
      const response = await fetch(`/api/org/messages/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      if (!response.ok) return notifyError("Mensagem não editada", await failure(response));
      setEditing(null); setText(""); void loadThread(selected); return;
    }
    if (uploads.some(item => item.uploading)) return notifyError("Aguarde os anexos", "Ainda estou enviando os arquivos.");
    const attachments = uploads.map(({ fileId, name, type, size }) => ({ fileId, name, type, size }));
    if (!body && !attachments.length) return;
    const payload = { to: selected, body, attachments, replyToId: replyTo?.id };
    setText(""); setUploads([]); setReplyTo(null);
    await post(payload);
    field.current?.focus();
  }

  async function updateThread(change: Record<string, unknown>, notice: string) {
    const response = await fetch("/api/org/messages/threads", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ with: selected, ...change }) }).catch(() => null);
    if (!response) return notifyError("Conversa não alterada", "Sem conexão com o servidor.");
    if (!response.ok) return notifyError("Conversa não alterada", await failure(response));
    notifySuccess(notice); await Promise.all([loadThread(selected), loadPeople()]);
  }

  async function react(message: Message, emoji: string) {
    const current = message.reactions.find(item => item.mine);
    const remove = current?.emoji === emoji;
    // Mostra na hora; a próxima atualização traz o valor do servidor.
    setMessages(list => (list ?? []).map(item => item.id !== message.id ? item : { ...item, reactions: [
      ...item.reactions.map(group => group.mine ? { ...group, count: group.count - 1, mine: false } : group).filter(group => group.count > 0)
        .map(group => !remove && group.emoji === emoji ? { ...group, count: group.count + 1, mine: true } : group),
      ...(!remove && !item.reactions.some(group => group.emoji === emoji && !group.mine) ? [{ emoji, count: 1, mine: true }] : []),
    ] }));
    const response = await fetch(`/api/org/messages/${message.id}/reaction`, remove ? { method: "DELETE" } : { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emoji }) }).catch(() => null);
    if (!response?.ok) notifyError("Reação não salva", response ? await failure(response) : "Sem conexão com o servidor.");
    void loadThread(selected);
  }

  async function forwardTo(target: string) {
    if (!forwarding) return;
    const response = await fetch("/api/org/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: target, forwardOf: forwarding.id }) }).catch(() => null);
    if (!response?.ok) return notifyError("Mensagem não encaminhada", response ? await failure(response) : "Sem conexão com o servidor.");
    setForwarding(null); notifySuccess("Mensagem encaminhada"); void loadPeople();
  }

  async function setPresenceHidden(hidden: boolean) {
    const response = await fetch("/api/org/messages/presence", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hidden }) }).catch(() => null);
    if (!response?.ok) return notifyError("Privacidade não alterada", response ? await failure(response) : "Sem conexão com o servidor.");
    notifySuccess(hidden ? "Visto por último escondido" : "Visto por último visível"); void loadPeople();
  }

  const person = people?.find(item => item.id === selected);
  const list = useMemo(() => (people ?? []).filter(item => (tab === "archived" ? item.archived : !item.archived) && matchesText([item.name, item.email], search)), [people, tab, search]);
  const archivedCount = (people ?? []).filter(item => item.archived).length;
  const offline = !!offlineSince || !!threadOffline;
  const canSend = !!thread && !thread.blocked && !thread.blockedMe && !offline;
  const shown = findOpen && findResults ? findResults : messages;
  const sentStyle = sentBubble(theme);

  function bubble(message: Message) {
    const mine = message.mine;
    const actions = !message.deleted && !message.local && !offline;
    return <div key={message.id} id={`msg-${message.id}`} className={cn("group flex items-end gap-1", mine ? "justify-end" : "justify-start")}>
      {actions && <div className={cn("flex opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100", mine ? "order-first" : "order-last")}>
        <Dropdown trigger={<Button variant="ghost" size="icon-xs" aria-label="Ações da mensagem" title="Ações da mensagem" />} label={<RiMoreLine />} align={mine ? "end" : "start"}>
          <div className="flex justify-between gap-0.5 border-b px-1 pb-1" role="group" aria-label="Reagir">{quickReactions.map(emoji => <DropdownItem key={emoji} className={cn("justify-center px-1.5 text-lg", message.reactions.some(item => item.mine && item.emoji === emoji) && "bg-primary/15")} onClick={() => void react(message, emoji)}>{emoji}</DropdownItem>)}</div>
          <DropdownItem onClick={() => { setReplyTo(message); setEditing(null); field.current?.focus(); }}><RiReplyLine className="size-4" />Responder</DropdownItem>
          {message.body && !message.protected && <DropdownItem onClick={() => { void navigator.clipboard.writeText(message.body).then(() => notifySuccess("Mensagem copiada")); }}><RiFileCopyLine className="size-4" />Copiar</DropdownItem>}
          {!message.protected && <DropdownItem onClick={() => setForwarding(message)}><RiShareForwardLine className="size-4" />Encaminhar</DropdownItem>}
          {mine && !message.forwarded && !message.contact && <DropdownItem onClick={() => { setEditing(message); setReplyTo(null); setText(message.body); field.current?.focus(); }}><RiEditLine className="size-4" />Editar</DropdownItem>}
          {mine && <DropdownItem onClick={() => setDeleting(message)} className="text-destructive"><RiDeleteBinLine className="size-4" />Apagar</DropdownItem>}
          {!mine && <DropdownItem onClick={() => setReporting({ message })} className="text-destructive"><RiFlagLine className="size-4" />Denunciar</DropdownItem>}
        </Dropdown>
      </div>}
      <div className={cn("flex max-w-[80%] flex-col", mine ? "items-end" : "items-start")}>
        <div style={mine && !message.deleted ? sentStyle : undefined} className={cn("rounded-2xl px-3 py-2 text-sm", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted", message.deleted && "italic opacity-70", message.local === "failed" && "ring-2 ring-destructive", message.protected && "select-none")}>
          {message.forwarded && !message.deleted && <p className={cn("mb-1 flex items-center gap-1 text-[11px]", mine ? "opacity-75" : "text-muted-foreground")}><RiShareForwardLine className="size-3" />{message.forwardedFrom ? `Encaminhada de ${message.forwardedFrom}` : "Encaminhada"}</p>}
          {message.replyTo && !message.deleted && <button type="button" onClick={() => document.getElementById(`msg-${message.replyTo!.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className={cn("mb-1.5 block w-full rounded-lg border-l-2 px-2 py-1 text-left text-xs", mine ? "border-current/60 bg-white/10" : "border-primary bg-background/60")}><span className="block font-medium">{message.replyTo.mine ? "Você" : person?.name}</span><span className="line-clamp-2">{message.replyTo.body}</span></button>}
          {message.deleted ? <p>Mensagem apagada</p> : <>
            {message.contact && <button type="button" onClick={() => setProfile(message.contact!.id)} className={cn("mb-1 flex w-56 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left", mine ? "bg-white/15" : "bg-background/70")}>
              <Face person={message.contact} className="size-9" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{message.contact.name}</span><span className="block truncate text-xs opacity-75">{message.contact.email || "Contato"}</span></span><RiUserLine className="size-4 shrink-0 opacity-75" aria-hidden="true" />
            </button>}
            {message.attachments.length > 0 && <div className="mb-1 grid gap-1.5">{message.attachments.map(item => isImage(item.type) && !message.local
              ? <button key={item.fileId} type="button" aria-label={`Ver foto ${item.name} em tela cheia`} onClick={() => setPhoto({ src: fileUrl(message.id, item.fileId), name: item.name, protected: message.protected })} className="overflow-hidden rounded-xl"><img src={fileUrl(message.id, item.fileId)} alt={item.name} loading="lazy" draggable={!message.protected} onContextMenu={message.protected ? event => event.preventDefault() : undefined} className="max-h-64 w-full object-cover" /></button>
              : message.protected ? <p key={item.fileId} className="flex items-center gap-2 rounded-xl bg-background/70 px-2.5 py-2 text-xs"><RiFileLine className="size-5 shrink-0" /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.name}</span><span className="opacity-75">Protegido: não pode ser baixado</span></span></p>
              : <a key={item.fileId} href={message.local ? undefined : fileUrl(message.id, item.fileId)} download={item.name} className={cn("flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs", mine ? "bg-white/15" : "bg-background/70")}><RiFileLine className="size-5 shrink-0" /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.name}</span><span className="opacity-75">{bytes(item.size)}</span></span></a>)}</div>}
            {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
          </>}
          <p className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", mine ? "opacity-75" : "text-muted-foreground")}>
            {message.expiresAt && !message.deleted && <RiTimerLine className="size-3" aria-label={`Some em ${new Date(message.expiresAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`} />}
            {message.editedAt && !message.deleted && <span>editada ·</span>}{time(message.createdAt)}
            {mine && !message.deleted && (message.local === "sending" ? <span>· enviando…</span> : message.local === "failed" ? <RiErrorWarningLine className="size-3" aria-label="Não enviada" /> : message.readAt ? <RiCheckDoubleLine className="size-3.5" aria-label="Lida" /> : <RiCheckLine className="size-3.5" aria-label="Enviada, ainda não lida" />)}
          </p>
          {message.local === "failed" && <p className="mt-1 flex gap-2 text-xs"><button type="button" className="underline" onClick={() => message.payload && void post(message.payload, message)}>Tentar de novo</button><button type="button" className="underline opacity-80" onClick={() => setMessages(current => (current ?? []).filter(item => item.id !== message.id))}>Descartar</button></p>}
        </div>
        {message.reactions.length > 0 && <div className="-mt-1.5 flex flex-wrap gap-1 px-1">{message.reactions.map(group => <button key={group.emoji} type="button" disabled={offline} onClick={() => void react(message, group.emoji)} aria-label={`${group.emoji} ${group.count}${group.mine ? ", sua reação" : ""}`} aria-pressed={group.mine}
          className={cn("flex items-center gap-0.5 rounded-full border bg-background px-1.5 text-xs shadow-sm", group.mine && "border-primary bg-primary/10")}>{group.emoji}{group.count > 1 && <span className="tabular-nums text-[10px] text-muted-foreground">{group.count}</span>}</button>)}</div>}
      </div>
    </div>;
  }

  return <CatalogLayout section="Comunicação" title="Mensagens" description="Conversas diretas com as pessoas da sua organização.">
    {noOrganization ? <NoOrganization feature="Mensagens" /> : error && !people ? <div role="alert" className="grid min-h-48 place-content-center gap-3 text-center"><p className="text-sm text-destructive">Não foi possível carregar as conversas.</p><p className="max-w-md text-sm text-muted-foreground">{error}</p><Button variant="outline" onClick={() => void loadPeople()}>Tentar novamente</Button></div> : !people || !overview ? <LoadingBlock label="Carregando conversas" /> :
    <div className="grid min-h-[65dvh] border md:grid-cols-[19rem_minmax(0,1fr)]">
      <aside aria-label="Conversas" className={cn("flex min-w-0 flex-col border-r", selected && "max-md:hidden")}>
        <div className="space-y-2 border-b p-3">
          <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><CatalogSearch label="Buscar pessoas e mensagens" value={search} onChange={setSearch} /></div>
            <Button size="icon-sm" aria-label="Nova mensagem" title="Nova mensagem" disabled={offline} onClick={() => setComposing(true)}><RiAddLine /></Button>
            <Dropdown trigger={<Button variant="ghost" size="icon-sm" aria-label="Opções das mensagens" title="Opções" />} label={<RiMoreLine />} align="end">
              <DropdownItem disabled={offline} onClick={() => void setPresenceHidden(!overview.presenceHidden)}>{overview.presenceHidden ? <RiEyeLine className="size-4" /> : <RiEyeOffLine className="size-4" />}{overview.presenceHidden ? "Mostrar meu visto por último" : "Esconder meu visto por último"}</DropdownItem>
              {overview.admin && <DropdownItem disabled={offline} onClick={() => setReportsOpen(true)}><RiAlarmWarningLine className="size-4" />Denúncias</DropdownItem>}
            </Dropdown>
          </div>
          <div className="flex gap-1 text-xs" role="tablist">{([["inbox", "Conversas"], ["archived", `Arquivadas${archivedCount ? ` (${archivedCount})` : ""}`]] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={cn("rounded-full px-3 py-1", tab === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{label}</button>)}</div>
        </div>
        {offlineSince ? <p role="status" className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground"><RiWifiOffLine className="size-3.5 shrink-0" />Sem conexão. Mostrando o que foi visto em {sinceLabel(offlineSince)}.</p>
          : error && <p role="status" className="border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">A atualização falhou. {error}</p>}
        <ul className="min-h-0 flex-1 divide-y overflow-y-auto">{list.map(item => <li key={item.id}><button type="button" aria-current={selected === item.id ? "true" : undefined} onClick={() => open(item.id)} className={cn("flex w-full items-center gap-3 px-3 py-3 text-left outline-none hover:bg-muted/50 focus-visible:bg-muted", selected === item.id && "bg-muted")}>
          <Face person={item} className="size-10" presence />
          <span className="min-w-0 flex-1"><span className="flex items-center gap-1"><span className="truncate text-sm font-medium">{item.name}</span>{item.muted && <RiNotificationOffLine className="size-3.5 shrink-0 text-muted-foreground" aria-label="Silenciada" />}{item.blocked && <RiForbidLine className="size-3.5 shrink-0 text-destructive" aria-label="Bloqueada" />}</span>
            <span className="block truncate text-xs text-muted-foreground">{item.last ? `${item.last.mine ? "Você: " : ""}${item.last.body}` : item.role === "external" ? "Externo" : "Membro"}</span></span>
          <span className="flex shrink-0 flex-col items-end gap-1">{item.last && <span className="text-[10px] text-muted-foreground">{time(item.last.createdAt)}</span>}{item.unread > 0 && <span className={cn("grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-semibold", item.muted ? "bg-muted-foreground/30 text-foreground" : "bg-primary text-primary-foreground")}>{item.unread}</span>}</span>
        </button></li>)}
          {!list.length && <li className="p-4 text-sm text-muted-foreground">{tab === "archived" ? "Nenhuma conversa arquivada." : people.length ? "Ninguém encontrado." : "Ainda não há outras pessoas na organização."}</li>}
          {globalResults && globalResults.length > 0 && <li className="bg-muted/30 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Mensagens encontradas</li>}
          {globalResults?.map(result => <li key={result.id}><button type="button" onClick={() => { open(result.with); setTimeout(() => document.getElementById(`msg-${result.id}`)?.scrollIntoView({ block: "center" }), 900); }} className="w-full px-3 py-2 text-left hover:bg-muted/50"><span className="block truncate text-xs font-medium">{people.find(item => item.id === result.with)?.name ?? "Conversa"}</span><span className="line-clamp-2 text-xs text-muted-foreground">{result.mine ? "Você: " : ""}{result.body}</span></button></li>)}
        </ul>
      </aside>

      <section aria-label={person ? `Conversa com ${person.name}` : "Conversa"} className={cn("flex min-w-0 flex-col", !selected && "max-md:hidden")}>
        {!person ? <p className="m-auto p-6 text-sm text-muted-foreground">Escolha uma conversa ou comece uma nova.</p> : <>
          <header className="flex items-center gap-2 border-b px-3 py-2">
            <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Voltar às conversas" onClick={() => setSelected("")}><RiArrowLeftSLine /></Button>
            <button type="button" onClick={() => setProfile(person.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Ver perfil de ${person.name}`}>
              <Face person={person} className="size-9" presence />
              <span className="min-w-0"><span className="block truncate font-semibold">{person.name}</span><span className="block truncate text-xs text-muted-foreground">{seenLabel(person.lastSeen) || person.email}{thread?.autoDeleteSeconds ? ` · autoexclusão: ${autoDeleteLabel(thread.autoDeleteSeconds)}` : ""}</span></span>
            </button>
            <Button variant="ghost" size="icon-sm" aria-label="Buscar na conversa" title="Buscar na conversa" onClick={() => { setFindOpen(value => !value); setFind(""); }}><RiSearchLine /></Button>
            <Dropdown trigger={<Button variant="ghost" size="icon-sm" aria-label="Mais ações da conversa" title="Mais" />} label={<RiMoreLine />} align="end">
              <DropdownItem onClick={() => setProfile(person.id)}><RiUserLine className="size-4" />Ver perfil</DropdownItem>
              <DropdownItem disabled={offline} onClick={() => setSharedOpen(true)}><RiImageLine className="size-4" />Mídia e arquivos</DropdownItem>
              <DropdownItem onClick={() => setThemeOpen(true)}><RiPaletteLine className="size-4" />Tema da conversa</DropdownItem>
              {!offline && thread && <>
                <DropdownItem onClick={() => setAutoDeleteOpen(true)}><RiTimerLine className="size-4" />Autoexclusão: {autoDeleteLabel(thread.autoDeleteSeconds)}</DropdownItem>
                <DropdownItem onClick={() => void updateThread({ protectContent: !thread.protectContent }, thread.protectContent ? "Seu conteúdo pode ser encaminhado e baixado" : "Conteúdo protegido")}>{thread.protectContent ? <RiShieldCheckLine className="size-4 text-primary" /> : <RiShieldLine className="size-4" />}{thread.protectContent ? "Desproteger meu conteúdo" : "Proteger meu conteúdo"}</DropdownItem>
                <DropdownItem onClick={() => void updateThread({ archived: !thread.archived }, thread.archived ? "Conversa desarquivada" : "Conversa arquivada")}>{thread.archived ? <RiInboxUnarchiveLine className="size-4" /> : <RiArchiveLine className="size-4" />}{thread.archived ? "Desarquivar" : "Arquivar"}</DropdownItem>
                <DropdownItem onClick={() => void updateThread({ muted: !thread.muted }, thread.muted ? "Notificações reativadas" : "Conversa silenciada")}>{thread.muted ? <RiNotificationLine className="size-4" /> : <RiNotificationOffLine className="size-4" />}{thread.muted ? "Reativar notificações" : "Silenciar"}</DropdownItem>
                <DropdownItem onClick={() => setClearing(true)}><RiEraserLine className="size-4" />Apagar conversa para mim</DropdownItem>
                <DropdownItem className={thread.blocked ? undefined : "text-destructive"} onClick={() => void updateThread({ blocked: !thread.blocked }, thread.blocked ? "Pessoa desbloqueada" : "Pessoa bloqueada")}><RiForbidLine className="size-4" />{thread.blocked ? "Desbloquear" : "Bloquear"}</DropdownItem>
                <DropdownItem className="text-destructive" onClick={() => setReporting({ message: null })}><RiFlagLine className="size-4" />Denunciar</DropdownItem>
              </>}
            </Dropdown>
          </header>
          {findOpen && <div className="flex items-center gap-2 border-b px-3 py-2"><RiSearchLine className="size-4 shrink-0 text-muted-foreground" /><Input autoFocus aria-label="Buscar na conversa" placeholder="Buscar nesta conversa" value={find} onChange={event => setFind(event.target.value)} className="h-8" />{findResults && <span className="shrink-0 text-xs text-muted-foreground">{findResults.length} encontrada(s)</span>}<Button variant="ghost" size="icon-xs" aria-label="Fechar busca" onClick={() => { setFindOpen(false); setFind(""); }}><RiCloseLine /></Button></div>}
          {thread?.peerProtects && <p className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground"><RiShieldCheckLine className="size-3.5 shrink-0 text-primary" />{person.name} protegeu o conteúdo: você não pode encaminhar nem baixar o que for enviado.</p>}
          <div style={themeBackground(theme)} className="max-h-[58dvh] min-h-64 flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-label="Mensagens da conversa" aria-live="polite">
            {hasMore && !findResults && !offline && <div className="flex justify-center"><Button variant="outline" size="xs" onClick={() => void loadOlder()}>Carregar anteriores</Button></div>}
            {shown === null ? <LoadingBlock label="Carregando conversa" /> : threadError && !shown.length ? <div role="alert" className="grid content-center justify-items-center gap-3 py-10 text-center"><p className="text-sm text-destructive">{threadError}</p><Button variant="outline" onClick={() => void loadThread(selected)}>Tentar novamente</Button></div>
              : !shown.length ? <p className="py-10 text-center text-sm text-muted-foreground">{findResults ? "Nada encontrado nesta conversa." : "Nenhuma mensagem ainda. Diga olá! 👋"}</p> : shown.map(bubble)}
            <div ref={bottom} />
          </div>
          {threadOffline && <p role="status" className="flex items-center gap-2 border-t px-3 py-1.5 text-xs text-muted-foreground"><RiWifiOffLine className="size-3.5 shrink-0" />Sem conexão. Conversa como estava em {sinceLabel(threadOffline)}.</p>}
          {threadError && messages?.length ? <p role="status" className="px-3 py-1 text-xs text-destructive">Falha ao atualizar. <button className="underline" onClick={() => void loadThread(selected)}>Tentar novamente</button></p> : null}
          {thread && !canSend ? <p className="border-t px-4 py-3 text-center text-sm text-muted-foreground">{offline ? "Sem conexão: dá para ler, mas não para enviar." : thread.blocked ? <>Você bloqueou {person.name}. <button className="text-primary underline" onClick={() => void updateThread({ blocked: false }, "Pessoa desbloqueada")}>Desbloquear</button></> : "Não é possível enviar mensagens para esta pessoa."}</p> :
          <form onSubmit={event => void submit(event)} className="space-y-2 border-t p-3">
            {(replyTo || editing) && <div className="flex items-start gap-2 rounded-xl border-l-2 border-primary bg-muted/50 px-3 py-2 text-xs"><div className="min-w-0 flex-1"><p className="font-medium">{editing ? "Editando mensagem" : `Respondendo ${replyTo!.mine ? "a você" : `a ${person.name}`}`}</p><p className="line-clamp-2 text-muted-foreground">{(editing ?? replyTo)!.body || "📎 anexo"}</p></div><button type="button" aria-label="Cancelar" onClick={() => { setReplyTo(null); if (editing) { setEditing(null); setText(""); } }}><RiCloseLine className="size-4" /></button></div>}
            {uploads.length > 0 && <ul className="flex flex-wrap gap-2">{uploads.map(item => <li key={item.key} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">{item.uploading ? <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Enviando" /> : <RiAttachment2 className="size-3.5" />}<span className="max-w-40 truncate">{item.name}</span><button type="button" aria-label={`Tirar ${item.name}`} onClick={() => setUploads(current => current.filter(entry => entry.key !== item.key))}><RiCloseLine className="size-3.5" /></button></li>)}</ul>}
            <div className="flex items-end gap-1.5">
              <input ref={files} type="file" multiple hidden aria-label="Anexar arquivos" onChange={event => { void upload(event.target.files); event.target.value = ""; }} />
              <input ref={camera} type="file" accept="image/*" capture="environment" hidden aria-label="Tirar foto" onChange={event => { void upload(event.target.files); event.target.value = ""; }} />
              {!editing && <Dropdown trigger={<Button type="button" variant="ghost" size="icon-sm" aria-label="Anexar" title="Anexar" />} label={<RiAttachment2 />}>
                <DropdownItem onClick={() => files.current?.click()}><RiFileLine className="size-4" />Arquivo ou foto</DropdownItem>
                <DropdownItem onClick={() => camera.current?.click()}><RiCameraLine className="size-4" />Câmera</DropdownItem>
                <DropdownItem onClick={() => setSharingContact(true)}><RiUserSharedLine className="size-4" />Contato</DropdownItem>
              </Dropdown>}
              <Dropdown trigger={<Button type="button" variant="ghost" size="icon-sm" aria-label="Inserir emoji" title="Inserir emoji" />} label={<RiEmotionHappyLine />} className="grid w-64 grid-cols-6 gap-0.5">
                {emojis.map(emoji => <DropdownItem key={emoji} className="justify-center px-0 text-lg" onClick={() => { setText(value => value + emoji); field.current?.focus(); }}>{emoji}</DropdownItem>)}
              </Dropdown>
              <textarea ref={field} aria-label="Escrever mensagem" rows={1} maxLength={5000} placeholder={editing ? "Editar mensagem" : "Mensagem"} value={text} onChange={event => setText(event.target.value)}
                onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } if (event.key === "Escape") { setReplyTo(null); if (editing) { setEditing(null); setText(""); } } }}
                className="max-h-40 min-h-10 flex-1 resize-none rounded-2xl border bg-background px-3.5 py-2 text-base outline-none [field-sizing:content] focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" />
              <Button type="submit" size="icon" className="rounded-full" aria-label={editing ? "Salvar edição" : "Enviar"} disabled={!text.trim() && !uploads.length}>{editing ? <RiCheckLine /> : <RiSendPlaneFill />}</Button>
            </div>
          </form>}
        </>}
      </section>
    </div>}

    {composing && people && <PeoplePicker title="Nova mensagem" description="Escolha com quem conversar." people={people} onPick={id => { setComposing(false); setTab("inbox"); open(id); }} onClose={() => setComposing(false)} />}
    {forwarding && people && <PeoplePicker title="Encaminhar mensagem" description="Escolha para quem encaminhar." people={people.filter(item => !item.blocked)} onPick={id => void forwardTo(id)} onClose={() => setForwarding(null)} />}
    {sharingContact && people && <PeoplePicker title="Compartilhar contato" description={`Envie o cartão de alguém da organização${person ? ` para ${person.name}` : ""}.`} people={people.filter(item => item.id !== selected)} onPick={id => { setSharingContact(false); void post({ to: selected, contact: id }); }} onClose={() => setSharingContact(false)} />}
    {deleting && <ConfirmDialog title="Apagar mensagem?" description="A mensagem e os anexos somem para as duas pessoas; fica o aviso “Mensagem apagada”." confirmLabel="Apagar" onConfirm={async () => { const response = await fetch(`/api/org/messages/${deleting.id}`, { method: "DELETE" }); if (!response.ok) throw new Error(await failure(response)); void loadThread(selected); }} onClose={() => setDeleting(null)} />}
    {clearing && person && <ConfirmDialog title="Apagar conversa para você?" description={`As mensagens somem só para você. ${person.name} continua vendo tudo. Mensagens novas aparecem normalmente.`} confirmLabel="Apagar conversa" onConfirm={async () => { await updateThread({ clear: true }, "Conversa apagada para você"); setMessages([]); setHasMore(false); }} onClose={() => setClearing(false)} />}
    {photo && <Dialog open onOpenChange={value => { if (!value) setPhoto(null); }}><DialogContent className="max-w-[min(64rem,calc(100vw-2rem))] p-2 sm:max-w-[min(64rem,calc(100vw-2rem))]"><DialogTitle className="sr-only">{photo.name}</DialogTitle><DialogDescription className="sr-only">Foto em tela cheia</DialogDescription><img src={photo.src} alt={photo.name} draggable={!photo.protected} onContextMenu={photo.protected ? event => event.preventDefault() : undefined} className="max-h-[80dvh] w-full object-contain" />{photo.protected ? <p className="justify-self-end px-2 pb-1 text-xs text-muted-foreground">Protegida por quem enviou</p> : <a href={photo.src} download={photo.name} className="justify-self-end px-2 pb-1 text-sm text-primary underline">Baixar</a>}</DialogContent></Dialog>}
    {profile && <ProfileDialog userId={profile} onClose={() => setProfile("")}
      onShared={profile === selected ? () => { setProfile(""); setSharedOpen(true); } : undefined}
      onMessage={profile !== selected && people?.some(item => item.id === profile) ? () => { const id = profile; setProfile(""); setTab("inbox"); open(id); } : undefined} />}
    {sharedOpen && person && <SharedDialog peerId={person.id} name={person.name} onClose={() => setSharedOpen(false)} onPhoto={value => { setSharedOpen(false); setPhoto(value); }} />}
    {reporting && person && <ReportDialog peerId={person.id} name={person.name} message={reporting.message} onClose={() => setReporting(null)} />}
    {reportsOpen && <ReportsDialog onClose={() => setReportsOpen(false)} />}
    {autoDeleteOpen && thread && <AutoDeleteDialog current={thread.autoDeleteSeconds} onPick={seconds => { setAutoDeleteOpen(false); void updateThread({ autoDeleteSeconds: seconds }, seconds ? `Autoexclusão: ${autoDeleteLabel(seconds)}` : "Autoexclusão desligada"); }} onClose={() => setAutoDeleteOpen(false)} />}
    {themeOpen && selected && <ThemeDialog current={theme} onPick={value => { setTheme(value); saveTheme(selected, value); setThemeOpen(false); }} onClose={() => setThemeOpen(false)} />}
  </CatalogLayout>;
}
