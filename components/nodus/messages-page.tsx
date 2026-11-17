"use client";
// Mensagens, copiadas do Nodus (Comunicação › Mensagens): lista no estilo dos apps de conversa, conversa com
// tema e fundo que se move, gestos (deslizar para responder, segurar para o menu), ficha da pessoa,
// "Mensagens salvas", busca com salto até a mensagem, edição da lista, cópia e fila de envio offline.
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import {
  RiAddLine, RiAlarmWarningLine, RiArchiveLine, RiArrowDownSLine, RiArrowLeftLine, RiArrowUpSLine, RiAttachment2, RiCameraLine, RiChat3Line,
  RiCheckLine, RiCloseLine, RiContactsLine, RiDeleteBinLine, RiEditBoxLine, RiEmotionHappyLine, RiEyeLine, RiEyeOffLine, RiFileCopyLine,
  RiForbidLine, RiImageLine, RiInboxUnarchiveLine, RiLockLine, RiMoreLine, RiNotification3Line, RiNotificationOffLine, RiPaletteLine, RiPencilLine, RiReplyLine,
  RiSearchLine, RiSendPlane2Fill, RiShareForwardLine, RiShieldCheckLine, RiTimerLine, RiWifiOffLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { CameraCaptureDialog } from "@/components/ui/camera-capture-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverClose, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { preparePhoto, compressImage } from "@/lib/image-compress";
import { notifyError } from "@/lib/ui/notifications";
import { NoOrganization } from "./no-organization";
import { defaultChatTheme, loadChatTheme, loadChatWallpaper, saveChatTheme, saveChatWallpaper, type ChatTheme } from "./messages/chat-theme";
import { ChatBackdrop, ChatThemePicker, chatThemeProps } from "./messages/chat-theme-picker";
import { ConversationPreview } from "./messages/conversation-preview";
import { autoDeleteLabel, autoDeleteOptions, fileUrl, PeoplePicker, ReportDialog, ReportsDialog, type Attachment, type Message, type Person } from "./messages/dialogs";
import { DriveFilePicker } from "./messages/drive-file-picker";
import { EmojiPicker } from "./messages/emoji-picker";
import { NewMessageSheet } from "./messages/new-message-sheet";
import { isNetworkError, readCopy, readOutbox, saveCopy, saveThreadCopy, writeOutbox, type Outgoing } from "./messages/offline";
import { Avatar, lastSeenLabel } from "./messages/people";
import { MessageBubble, OutgoingBubble } from "./messages/message-bubble";
import { PersonSheet } from "./messages/person-sheet";
import { DaySeparator, failure, Highlight, merge, previewOf, quickReactions, sameDay, time, touchKeyboard } from "./messages/format";
import { PhotoSelectionDialog, type SelectedPhoto } from "./messages/photo-selection-dialog";

type Thread = { archived: boolean; muted: boolean; blocked: boolean; blockedMe: boolean; protectContent: boolean; peerProtects: boolean; autoDeleteSeconds: number | null };
type Overview = { me: string; admin: boolean; presenceHidden: boolean; people: Person[] };
type PhotoDraft = { peerId: string; photos: SelectedPhoto[]; caption: string; reply: Message | null };

export function MessagesPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [listOffline, setListOffline] = useState(false);
  const [noOrganization, setNoOrganization] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);
  const [threadError, setThreadError] = useState("");
  const [offline, setOffline] = useState(false);
  const [outbox, setOutbox] = useState<Outgoing[]>([]);
  // Editar a lista (como no app de mensagens do iPhone): seleciona conversas para arquivar ou apagar.
  const [listEditing, setListEditing] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [listBusy, setListBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<{ id: string; with: string; body: string; createdAt: string; mine: boolean }[] | null>(null);
  const [newMessage, setNewMessage] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ message: Message | null } | null>(null);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [autoDeleteOpen, setAutoDeleteOpen] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState<Message | null>(null);
  const [forwarding, setForwarding] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ message: Message; x: number; y: number } | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{ term: string; items: Message[] | null; error: boolean } | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Person | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [photoSending, setPhotoSending] = useState(false);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [viewing, setViewing] = useState<{ message: Message; item: Attachment } | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [chatTheme, setChatTheme] = useState<ChatTheme>(defaultChatTheme);
  const [loadedWallpaper, setLoadedWallpaper] = useState<{ key: string; url: string } | null>(null);
  const [wallpaperVersion, setWallpaperVersion] = useState(0);
  const [wallStep, setWallStep] = useState(0);
  const selectedRef = useRef(selected);
  const threadRequest = useRef(0);
  const messageList = useRef<HTMLDivElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const photoUrls = useRef(new Set<string>());
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ id: string; x: number; y: number } | null>(null);
  // Segurar o dedo na mensagem abre o menu de ações (como no Telegram), em vez de selecionar texto.
  const longPress = useRef<{ timer: number; fired: boolean } | null>(null);
  // Toque longo numa conversa da lista abre a prévia (sem marcar como lida).
  const listPress = useRef<{ timer: number; fired: boolean; x: number; y: number } | null>(null);
  const flushing = useRef(false);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => () => { for (const url of photoUrls.current) URL.revokeObjectURL(url); photoUrls.current.clear(); }, []);

  const me = overview?.me ?? "";
  const people = useMemo(() => overview?.people ?? [], [overview]);
  const peer = people.find(person => person.id === selected) ?? null;
  const self = !!peer?.self;
  const chatBlocked = !!thread?.blocked || !!thread?.blockedMe;

  const loadPeople = useCallback(async () => {
    try {
      const response = await fetch("/api/org/messages", { cache: "no-store" });
      if (response.status === 401) { setNoOrganization(true); return; }
      setNoOrganization(false);
      if (!response.ok) throw new Error(await failure(response));
      const data: Overview = await response.json();
      setOverview(data); setLoadError(""); setListOffline(false);
      saveCopy(data.me, "people", data);
    } catch (cause) {
      // Sem sinal: abre a última lista vista neste aparelho.
      const copy = isNetworkError(cause) ? readCopy<Overview>("people") : null;
      if (copy) { setOverview(current => current ?? copy.data); setListOffline(true); setLoadError(""); return; }
      setLoadError(isNetworkError(cause) ? "Sem conexão. As conversas aparecem aqui depois de abertas uma vez com sinal." : cause instanceof Error ? cause.message : "Não foi possível carregar as conversas.");
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
      setHasOlder(previous => previous || data.hasMore);
      setThread(data.thread); setThreadError(""); setOffline(false);
      const owner = readCopy<Overview>("people")?.data.me;
      if (owner) saveThreadCopy(owner, id, { messages: data.messages, thread: data.thread });
    } catch (cause) {
      if (threadRequest.current !== request || selectedRef.current !== id) return;
      const copy = isNetworkError(cause) ? readCopy<{ messages: Message[]; thread: Thread }>(`thread:${id}`) : null;
      if (copy) { setMessages(current => current?.length ? current : copy.data.messages); setThread(current => current ?? copy.data.thread); setOffline(true); setThreadError(""); return; }
      setOffline(isNetworkError(cause));
      setThreadError(isNetworkError(cause) ? "" : cause instanceof Error ? cause.message : "Não foi possível carregar as mensagens.");
      setMessages(current => current ?? []);
    }
  }, []);

  // Fila de envio: o que foi escrito sem sinal sai quando a conexão volta.
  const flushOutbox = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      for (const item of readOutbox()) {
        if (item.status === "failed") continue;
        const update = (change: Partial<Outgoing>) => { const next = readOutbox().map(entry => entry.id === item.id ? { ...entry, ...change } : entry); writeOutbox(next); setOutbox(next); };
        update({ status: "sending" });
        try {
          const response = await fetch("/api/org/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item.payload) });
          if (!response.ok) { update({ status: "failed", error: await failure(response) }); continue; }
          const next = readOutbox().filter(entry => entry.id !== item.id); writeOutbox(next); setOutbox(next);
          if (selectedRef.current === item.peerId) await loadThread(item.peerId);
        } catch (cause) {
          update({ status: isNetworkError(cause) ? "waiting" : "failed", error: isNetworkError(cause) ? undefined : "Não enviada." });
          if (isNetworkError(cause)) break;
        }
      }
      void loadPeople();
    } finally { flushing.current = false; }
  }, [loadPeople, loadThread]);

  useEffect(() => {
    const first = setTimeout(() => { setOutbox(readOutbox()); void loadPeople().then(flushOutbox); }, 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void loadPeople(); }, 5_000);
    const online = () => { void loadPeople(); void flushOutbox(); };
    window.addEventListener("online", online);
    return () => { clearTimeout(first); clearInterval(timer); window.removeEventListener("online", online); };
  }, [loadPeople, flushOutbox]);
  useEffect(() => {
    if (!selected) return;
    const first = setTimeout(() => void loadThread(selected), 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void loadThread(selected); }, 5_000);
    return () => { clearTimeout(first); clearInterval(timer); threadRequest.current++; };
  }, [selected, loadThread]);

  // A imagem de fundo vale só para a conversa e a versão em que foi lida; trocar de conversa a descarta.
  const showWallpaper = chatTheme.name === "custom" && !!chatTheme.custom.image;
  const wallpaperKey = selected && showWallpaper ? `${selected}:${wallpaperVersion}` : null;
  const wallpaper = loadedWallpaper && loadedWallpaper.key === wallpaperKey ? loadedWallpaper.url : null;
  useEffect(() => {
    if (!selected || !wallpaperKey || !me) return;
    let url: string | null = null;
    let active = true;
    void loadChatWallpaper(me, selected).then(blob => {
      if (!active || !blob) return;
      url = URL.createObjectURL(blob);
      setLoadedWallpaper({ key: wallpaperKey, url });
    });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [selected, wallpaperKey, me]);

  // A caixa de escrita cresce com o texto até cerca de seis linhas; depois rola por dentro.
  useLayoutEffect(() => {
    const input = messageInput.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 152)}px`;
    input.style.overflowY = input.scrollHeight > 152 ? "auto" : "hidden";
  }, [body, selected, peer?.id]);

  const outgoing = outbox.filter(item => item.peerId === selected);
  const lastMessageId = messages?.at(-1)?.id;
  useEffect(() => { if (messageList.current) messageList.current.scrollTop = messageList.current.scrollHeight; }, [selected, lastMessageId, outgoing.length]);

  useEffect(() => {
    if (!contextMenu) return;
    const onPointerDown = (event: PointerEvent) => { if (!contextMenuRef.current?.contains(event.target as Node)) setContextMenu(null); };
    const onKeyDown = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setContextMenu(null); };
    const onScroll = () => setContextMenu(null);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    contextMenuRef.current?.focus();
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); window.removeEventListener("scroll", onScroll, true); };
  }, [contextMenu]);

  // A busca espera a pessoa parar de digitar.
  useEffect(() => { const timer = window.setTimeout(() => setSearchTerm(searchText.trim()), 300); return () => window.clearTimeout(timer); }, [searchText]);
  useEffect(() => {
    if (!selected || searchTerm.length < 2) return;
    let alive = true;
    const term = searchTerm;
    const start = setTimeout(() => setSearchResults({ term, items: null, error: false }), 0);
    fetch(`/api/org/messages?with=${encodeURIComponent(selected)}&q=${encodeURIComponent(term)}`, { cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { if (alive) setSearchResults({ term, items: [...data.messages].reverse(), error: false }); })
      .catch(cause => {
        if (!alive) return;
        // Sem sinal, a busca procura nas mensagens guardadas no aparelho.
        if (isNetworkError(cause)) setSearchResults({ term, items: (messages ?? []).filter(message => message.body.toLocaleLowerCase("pt-BR").includes(term.toLocaleLowerCase("pt-BR"))).reverse(), error: false });
        else setSearchResults({ term, items: null, error: true });
      });
    return () => { alive = false; clearTimeout(start); };
  }, [selected, searchTerm, messages]);
  // Busca na lista: pessoas pelo nome e, com 3 letras ou mais, mensagens de todas as conversas.
  useEffect(() => {
    const query = search.trim();
    if (query.length < 3 || listEditing) { const reset = setTimeout(() => setGlobalResults(null), 0); return () => clearTimeout(reset); }
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/org/messages?q=${encodeURIComponent(query)}`, { cache: "no-store" }).catch(() => null);
      if (response?.ok) setGlobalResults((await response.json()).results);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, listEditing]);

  const conversations = people;
  // Seta de voltar no celular: não lidas das outras conversas (sem as silenciadas).
  const otherUnread = conversations.filter(item => item.id !== selected && !item.muted).reduce((total, item) => total + item.unread, 0);
  const archivedCount = conversations.filter(item => item.archived).length;
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const visiblePeople = term && !listEditing
    ? people.filter(person => person.name.toLocaleLowerCase("pt-BR").includes(term) || person.email.toLocaleLowerCase("pt-BR").includes(term))
    : people.filter(person => person.archived === showArchived);
  const themeProps = chatThemeProps(chatTheme);

  function closeSearch() { setSearchOpen(false); setSearchText(""); setSearchTerm(""); setSearchResults(null); }

  async function loadOlder() {
    if (!selected || loadingOlder || !messages?.length) return false;
    setLoadingOlder(true);
    try {
      const response = await fetch(`/api/org/messages?with=${encodeURIComponent(selected)}&before=${encodeURIComponent(messages[0].createdAt)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await failure(response));
      const data = await response.json();
      setMessages(current => merge(current ?? [], data.messages)); setHasOlder(data.hasMore);
      return data.hasMore as boolean;
    } catch (cause) {
      notifyError("Mensagens anteriores", isNetworkError(cause) ? "Sem conexão. As mensagens mais antigas aparecem quando o sinal voltar." : cause instanceof Error ? cause.message : "");
      return false;
    } finally { setLoadingOlder(false); }
  }

  // Carrega as páginas anteriores até a mensagem encontrada, rola até ela e destaca por um instante.
  async function jumpTo(result: Message) {
    if (!selected) return;
    let loaded = messages ?? [];
    let more = hasOlder;
    while (!loaded.some(message => message.id === result.id) && more && loaded.length) {
      setLoadingOlder(true);
      try {
        const response = await fetch(`/api/org/messages?with=${encodeURIComponent(selected)}&before=${encodeURIComponent(loaded[0].createdAt)}`, { cache: "no-store" });
        if (!response.ok) break;
        const data = await response.json();
        loaded = merge(loaded, data.messages); more = data.hasMore;
      } catch { break; } finally { setLoadingOlder(false); }
    }
    setMessages(loaded); setHasOlder(more);
    setHighlighted(result.id);
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`message-${result.id}`)?.scrollIntoView({ block: "center", behavior: "smooth" })));
    window.setTimeout(() => setHighlighted(current => current === result.id ? null : current), 2200);
  }

  function stopListEditing() { setListEditing(false); setPicked([]); }
  function togglePick(id: string) { setPicked(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }

  async function threadRequestPut(peerId: string, change: Record<string, unknown>) {
    const response = await fetch("/api/org/messages/threads", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ with: peerId, ...change }) });
    if (!response.ok) throw new Error(await failure(response));
  }
  // Vale só para esta pessoa: a outra ponta continua com a conversa como estava.
  async function changeConversations(action: "archive" | "unarchive" | "clear", ids = picked) {
    if (!ids.length || listBusy) return;
    setListBusy(true);
    try {
      await Promise.all(ids.map(id => threadRequestPut(id, action === "clear" ? { clear: true } : { archived: action === "archive" })));
      if (action === "clear" && selected && ids.includes(selected)) { setMessages([]); setHasOlder(false); }
      if (action === "archive" && selected && ids.includes(selected)) setSelected(null);
      await loadPeople();
      setConfirmClear(false);
      stopListEditing();
      if (action === "unarchive" && archivedCount <= ids.length) setShowArchived(false);
    } catch (cause) {
      notifyError("Conversas não alteradas", isNetworkError(cause) ? "Sem conexão. Tente de novo quando o sinal voltar." : cause instanceof Error ? cause.message : "");
    } finally { setListBusy(false); }
  }

  async function updateSettings(patch: Partial<Pick<Thread, "muted" | "blocked" | "protectContent" | "autoDeleteSeconds">>) {
    if (!selected) return;
    try {
      await threadRequestPut(selected, patch);
      await Promise.all([loadThread(selected), loadPeople()]);
    } catch (cause) {
      notifyError("Conversa não alterada", isNetworkError(cause) ? "Sem conexão. Tente de novo quando o sinal voltar." : cause instanceof Error ? cause.message : "");
    }
  }

  async function setPresenceHidden(hidden: boolean) {
    const response = await fetch("/api/org/messages/presence", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hidden }) }).catch(() => null);
    if (!response?.ok) return notifyError("Privacidade não alterada", response ? await failure(response) : "Sem conexão com o servidor.");
    void loadPeople();
  }

  // Ações da conversa: mesmas no "⋯" do cabeçalho e no "Mais" da ficha da pessoa.
  // Visual de menu de app de conversa: linhas altas, ícone à esquerda, grupos separados e o destrutivo no fim.
  function conversationActions() {
    if (!selected || !peer) return null;
    const row = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] outline-none hover:bg-foreground/5 focus-visible:bg-foreground/5 [&_svg]:size-5 [&_svg]:shrink-0";
    const current = thread?.autoDeleteSeconds ?? null;
    return <div className="grid">
      <PopoverClose className={row} onClick={() => { setSheetOpen(false); setThemeOpen(true); }}><RiPaletteLine />Tema e fundo</PopoverClose>
      {!self && <PopoverClose className={row} onClick={() => void updateSettings({ muted: !thread?.muted })}>
        {thread?.muted ? <><RiNotification3Line />Reativar notificações</> : <><RiNotificationOffLine />Silenciar</>}</PopoverClose>}
      {!chatBlocked && <PopoverClose className={row} onClick={() => { setSheetOpen(false); setContactPickerOpen(true); }}><RiContactsLine />Compartilhar contato</PopoverClose>}
      <div className="mx-3 my-1 border-t border-foreground/10" />
      <button type="button" className={row} aria-expanded={autoDeleteOpen} onClick={() => setAutoDeleteOpen(value => !value)}>
        <RiTimerLine /><span className="flex-1">Mensagens temporárias</span>
        <span className="text-sm text-muted-foreground">{autoDeleteLabel(current)}</span>
        <RiArrowDownSLine className={`text-muted-foreground transition-transform ${autoDeleteOpen ? "rotate-180" : ""}`} />
      </button>
      {autoDeleteOpen && <div className="mb-1 ml-11 grid">{autoDeleteOptions.map(([value, label]) =>
        <PopoverClose key={label} className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-foreground/5 focus-visible:bg-foreground/5"
          aria-pressed={current === value} onClick={() => { setAutoDeleteOpen(false); void updateSettings({ autoDeleteSeconds: value }); }}>
          {label}{current === value && <RiCheckLine className="size-4 text-primary" />}
        </PopoverClose>)}</div>}
      {!self && <PopoverClose className={row} aria-pressed={!!thread?.protectContent} onClick={() => void updateSettings({ protectContent: !thread?.protectContent })}>
        <RiLockLine />{thread?.protectContent ? "Permitir encaminhar e baixar" : "Impedir encaminhar e baixar"}</PopoverClose>}
      <PopoverClose className={row} onClick={() => { setSheetOpen(false); void changeConversations(peer.archived ? "unarchive" : "archive", [selected]); }}>{peer.archived ? <><RiInboxUnarchiveLine />Desarquivar</> : <><RiArchiveLine />Arquivar</>}</PopoverClose>
      <PopoverClose className={row} onClick={() => { setSheetOpen(false); setPicked([selected]); setConfirmClear(true); }}><RiDeleteBinLine />Apagar mensagens</PopoverClose>
      {!self && <PopoverClose className={row} onClick={() => { setSheetOpen(false); setReportTarget({ message: null }); }}><RiAlarmWarningLine />Denunciar</PopoverClose>}
      {!self && <PopoverClose className={`${row} text-destructive`} onClick={() => { setSheetOpen(false); if (thread?.blocked) void updateSettings({ blocked: false }); else setConfirmBlock(true); }}>
        <RiForbidLine />{thread?.blocked ? "Desbloquear" : "Bloquear"}</PopoverClose>}
    </div>;
  }

  function startListPress(event: TouchEvent<HTMLButtonElement>, person: Person) {
    if (listEditing) return;
    const touch = event.touches[0];
    const press = { timer: 0, fired: false, x: touch.clientX, y: touch.clientY };
    press.timer = window.setTimeout(() => { press.fired = true; navigator.vibrate?.(10); setPreviewing(person); }, 450);
    listPress.current = press;
  }
  function moveListPress(event: TouchEvent<HTMLButtonElement>) {
    const press = listPress.current;
    if (press && Math.hypot(event.touches[0].clientX - press.x, event.touches[0].clientY - press.y) > 8) window.clearTimeout(press.timer);
  }
  function endListPress(event: TouchEvent<HTMLButtonElement>) {
    const press = listPress.current;
    listPress.current = null;
    if (!press) return;
    window.clearTimeout(press.timer);
    // Depois do toque longo, soltar não abre a conversa.
    if (press.fired) event.preventDefault();
  }

  function selectPerson(id: string) {
    closePhotoDraft(); closeSearch(); setContextMenu(null);
    if (id !== selected) { setMessages(null); setThread(null); setThreadError(""); setOffline(false); setHasOlder(false); }
    setSelected(id);
    setChatTheme(me ? loadChatTheme(me, id) : defaultChatTheme);
    setThemeOpen(false); setNewMessage(false); setSearch(""); setBody(""); setReplyTo(null); setEditing(null); setEmojiOpen(false);
  }

  function closePhotoDraft() {
    if (photoSending) return;
    for (const photo of photoDraft?.photos ?? []) { URL.revokeObjectURL(photo.url); photoUrls.current.delete(photo.url); }
    setPhotoDraft(null); setPhotoError("");
  }
  function openPhotoSelector() {
    if (!selected) return;
    setPhotoDraft({ peerId: selected, photos: [], caption: body, reply: replyTo });
    setPhotoError(""); setCameraOpen(false);
  }
  function stagePhotos(files: File[]) {
    if (!selected || !files.length) return;
    const images = files.filter(file => file.type.startsWith("image/"));
    if (!images.length) { notifyError("Selecione fotos para enviar."); return; }
    const room = 25 - (photoDraft?.photos.length ?? 0);
    if (room <= 0) { setPhotoError("O limite é de 25 fotos por envio."); return; }
    if (images.length > room) { setPhotoError(`Você escolheu ${images.length} fotos; há ${room} vagas neste envio. Escolha menos fotos.`); return; }
    const photos = images.map(file => { const url = URL.createObjectURL(file); photoUrls.current.add(url); return { id: crypto.randomUUID(), file, url }; });
    setPhotoDraft(current => current ? { ...current, photos: [...current.photos, ...photos] } : { peerId: selected, photos, caption: body, reply: replyTo });
    setPhotoError(""); setCameraOpen(false);
  }
  function removePhoto(id: string) {
    const photo = photoDraft?.photos.find(item => item.id === id);
    if (photo) { URL.revokeObjectURL(photo.url); photoUrls.current.delete(photo.url); }
    setPhotoDraft(current => current && { ...current, photos: current.photos.filter(item => item.id !== id) });
    setPhotoError("");
  }

  async function uploadFile(file: File): Promise<Attachment> {
    const form = new FormData(); form.set("file", file);
    const response = await fetch("/api/org/messages/attachments", { method: "POST", body: form });
    if (!response.ok) throw new Error(await failure(response));
    return response.json();
  }
  async function postNow(payload: Record<string, unknown>) {
    const response = await fetch("/api/org/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(await failure(response));
  }

  // Uma mensagem por foto; a legenda e a resposta vão na primeira.
  async function sendSelectedPhotos() {
    const draft = photoDraft;
    if (!draft?.photos.length || photoSending) return;
    setPhotoSending(true); setPhotoError("");
    try {
      for (const [index, photo] of draft.photos.entries()) {
        const saved = await uploadFile(await preparePhoto(photo.file));
        await postNow({ to: draft.peerId, body: index === 0 ? draft.caption.trim() : "", attachments: [saved], replyToId: index === 0 ? draft.reply?.id : undefined });
      }
      for (const photo of draft.photos) { URL.revokeObjectURL(photo.url); photoUrls.current.delete(photo.url); }
      setPhotoDraft(null); setBody(""); setReplyTo(null); setWallStep(step => step + 1);
      await Promise.all([loadThread(draft.peerId), loadPeople()]);
    } catch (cause) {
      setPhotoError(isNetworkError(cause) ? "Sem conexão. As fotos precisam de sinal para serem enviadas." : cause instanceof Error ? cause.message : "Não foi possível enviar as fotos.");
    } finally { setPhotoSending(false); }
  }

  async function sendFile(file: File) {
    if (!selected) return;
    if (!file.size || file.size > 20 * 1024 * 1024) { notifyError("Selecione um arquivo de até 20 MB."); return; }
    const peerId = selected;
    const reply = replyTo;
    setReplyTo(null);
    try {
      const saved = await uploadFile(file);
      await postNow({ to: peerId, body: "", attachments: [saved], replyToId: reply?.id });
      setWallStep(step => step + 1);
      await Promise.all([loadThread(peerId), loadPeople()]);
    } catch (cause) { notifyError("Arquivo não enviado", isNetworkError(cause) ? "Sem conexão. Arquivos precisam de sinal para serem enviados." : cause instanceof Error ? cause.message : ""); }
  }

  // Texto, contato e encaminhamento passam pela fila: aparecem na hora e saem quando houver sinal.
  function queue(peerId: string, payload: Record<string, unknown>, preview: Outgoing["preview"]) {
    const item: Outgoing = { id: crypto.randomUUID(), peerId, payload, preview, createdAt: new Date().toISOString(), status: "waiting" };
    const next = [...readOutbox(), item];
    writeOutbox(next); setOutbox(next);
    setWallStep(step => step + 1);
    void flushOutbox();
  }
  function retryOutgoing(id: string) { const next = readOutbox().map(item => item.id === id ? { ...item, status: "waiting" as const, error: undefined } : item); writeOutbox(next); setOutbox(next); void flushOutbox(); }
  function dropOutgoing(id: string) { const next = readOutbox().filter(item => item.id !== id); writeOutbox(next); setOutbox(next); }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !body.trim()) return;
    const text = body.trim();
    if (editing) {
      setBody(""); setEditing(null); setEmojiOpen(false);
      if (text === editing.body) return;
      setMessages(current => (current ?? []).map(item => item.id === editing.id ? { ...item, body: text, editedAt: new Date().toISOString() } : item));
      const response = await fetch(`/api/org/messages/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) }).catch(() => null);
      if (!response?.ok) notifyError("Mensagem não editada", response ? await failure(response) : "Sem conexão. Tente de novo quando o sinal voltar.");
      void loadThread(selected);
      return;
    }
    const reply = replyTo;
    setBody(""); setReplyTo(null); setEmojiOpen(false);
    queue(selected, { to: selected, body: text, replyToId: reply?.id }, { body: text, replyTo: reply && { id: reply.id, mine: reply.mine, body: previewOf(reply) }, forwarded: false });
  }

  function reply(message: Message) { setEditing(null); setReplyTo(message); messageInput.current?.focus(); }
  function edit(message: Message) { setReplyTo(null); setEditing(message); setBody(message.body); messageInput.current?.focus(); }

  function startSwipe(event: TouchEvent<HTMLDivElement>, message: Message) {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const touch = event.touches[0];
    swipe.current = { id: message.id, x: touch.clientX, y: touch.clientY };
    clearLongPress();
    const press = { fired: false, timer: 0 };
    press.timer = window.setTimeout(() => { press.fired = true; swipe.current = null; navigator.vibrate?.(10); showContextMenu(message, touch.clientX, touch.clientY); }, 450);
    longPress.current = press;
  }
  function clearLongPress() { if (longPress.current) window.clearTimeout(longPress.current.timer); }
  function moveSwipe(event: TouchEvent<HTMLDivElement>, message: Message) {
    const start = swipe.current;
    if (!start || start.id !== message.id) return;
    const touch = event.touches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.hypot(dx, dy) > 8) clearLongPress();
    if (dx <= 0 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    event.currentTarget.classList.add("chat-swipe-active");
    event.currentTarget.style.transform = `translateX(${Math.min(36, dx * .35)}px)`;
  }
  function endSwipe(event: TouchEvent<HTMLDivElement>, message: Message) {
    const start = swipe.current;
    const pressed = longPress.current?.fired;
    cancelSwipe(event);
    if (pressed) { event.preventDefault(); return; }
    if (!start || start.id !== message.id) return;
    const touch = event.changedTouches[0];
    if (touch.clientX - start.x > 72 && Math.abs(touch.clientY - start.y) < 40) reply(message);
  }
  function cancelSwipe(event: TouchEvent<HTMLDivElement>) {
    clearLongPress(); longPress.current = null; swipe.current = null;
    event.currentTarget.classList.remove("chat-swipe-active");
    event.currentTarget.style.transform = "";
  }
  function showContextMenu(message: Message, x: number, y: number) {
    setContextMenu({ message, x: Math.max(8, Math.min(x, window.innerWidth - 192)), y: Math.max(8, Math.min(y, window.innerHeight - 300)) });
  }
  function openContextMenu(event: MouseEvent<HTMLDivElement>, message: Message) {
    event.preventDefault();
    // No Android o toque longo também dispara contextmenu; o menu já foi aberto pelo toque longo.
    if (longPress.current?.fired || message.deleted) return;
    showContextMenu(message, event.clientX, event.clientY);
  }
  function openContextMenuFromKeyboard(event: KeyboardEvent<HTMLDivElement>, message: Message) {
    if (event.target !== event.currentTarget || (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10"))) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setContextMenu({ message, x: Math.max(8, Math.min(rect.left + 24, window.innerWidth - 192)), y: Math.max(8, Math.min(rect.bottom, window.innerHeight - 260)) });
  }
  async function copyMessage(message: Message) {
    setContextMenu(null);
    try { await navigator.clipboard.writeText(message.body); } catch { notifyError("Não foi possível copiar a mensagem."); }
  }

  async function removeMessage() {
    if (!selected || !deleting) return;
    const target = deleting;
    setDeleting(null);
    if (editing?.id === target.id || replyTo?.id === target.id) { setEditing(null); setReplyTo(null); setBody(""); }
    setMessages(current => (current ?? []).map(item => item.id === target.id ? { ...item, deleted: true, body: "", attachments: [], reactions: [] } : item));
    const response = await fetch(`/api/org/messages/${target.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) notifyError("Mensagem não excluída", response ? await failure(response) : "Sem conexão. Tente de novo quando o sinal voltar.");
    void loadThread(selected);
  }

  async function react(message: Message, emoji: string) {
    if (!selected) return;
    const remove = message.reactions.find(reaction => reaction.mine)?.emoji === emoji;
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

  function forwardTo(personId: string) {
    if (!forwarding) return;
    queue(personId, { to: personId, forwardOf: forwarding.id }, { body: previewOf(forwarding), replyTo: null, forwarded: true });
    setForwarding(null);
  }
  function shareContact(contactId: string) {
    if (!selected) return;
    setContactPickerOpen(false);
    const contact = people.find(person => person.id === contactId);
    queue(selected, { to: selected, contact: contactId }, { body: `👤 ${contact?.name ?? "Contato"}`, replyTo: null, forwarded: false });
  }

  function insertEmoji(emoji: string) {
    const input = messageInput.current;
    const start = input?.selectionStart ?? body.length;
    const end = input?.selectionEnd ?? body.length;
    if (body.length - (end - start) + emoji.length > 5000) return;
    setBody(body.slice(0, start) + emoji + body.slice(end));
    setEmojiOpen(false);
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + emoji.length, start + emoji.length); });
  }

  function updateTheme(next: ChatTheme) {
    if (!selected || !me) return;
    setChatTheme(next);
    saveChatTheme(me, selected, next);
  }
  async function chooseWallpaper(file: File) {
    if (!selected || !me) return;
    const peerId = selected;
    try {
      const image = await compressImage(file, "fundo.jpg", 1920, 0.8);
      await saveChatWallpaper(me, peerId, image);
      const next: ChatTheme = { name: "custom", custom: { ...chatTheme.custom, image: true } };
      setChatTheme(next); saveChatTheme(me, peerId, next);
      setWallpaperVersion(value => value + 1);
    } catch { notifyError("Não foi possível usar essa imagem."); }
  }
  function removeWallpaper() {
    if (!selected || !me) return;
    void saveChatWallpaper(me, selected, null).catch(() => {});
    const next: ChatTheme = { name: "custom", custom: { ...chatTheme.custom, image: false } };
    setChatTheme(next); saveChatTheme(me, selected, next);
  }

  const lockedFor = (message: Message) => !message.mine && message.protected;
  const shown = messages ?? [];

  if (noOrganization) return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"><NoOrganization feature="Mensagens" /></main>;

  return <main className="flex w-full flex-col md:h-[calc(100dvh-57px)] md:gap-4 md:p-6">
    <header className="hidden shrink-0 items-end justify-between gap-4 md:flex">
      <div><p className="text-xs uppercase tracking-widest text-primary">Comunicação</p><h1 className="mt-1 font-heading text-2xl font-semibold">Mensagens</h1><p className="mt-1 text-sm text-muted-foreground">Converse em particular com pessoas da sua organização.</p></div>
      {overview && <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" className="normal-case tracking-normal" onClick={() => void setPresenceHidden(!overview.presenceHidden)}>{overview.presenceHidden ? <RiEyeLine /> : <RiEyeOffLine />}{overview.presenceHidden ? "Mostrar meu visto por último" : "Esconder meu visto por último"}</Button>
        {overview.admin && <Button type="button" variant="outline" size="sm" className="normal-case tracking-normal" onClick={() => setReportsOpen(true)}><RiAlarmWarningLine />Denúncias</Button>}
      </div>}
    </header>
    <div className="glass-bar grid h-[calc(100dvh-3.5rem-1px-3.5rem-env(safe-area-inset-bottom))] grid-rows-[minmax(0,1fr)] overflow-hidden md:h-auto md:min-h-0 md:flex-1 md:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)] md:rounded-2xl md:border md:shadow-sm">
      <section aria-label="Conversas" className={`relative min-h-0 min-w-0 flex-col border-r ${selected ? "hidden md:flex" : "flex"}`}>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_0%_0%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent_55%)]">
          {/* No celular: título centralizado e Nova mensagem redonda à direita, com a busca em pílula embaixo. */}
          <div className="glass-bar sticky top-0 z-10 border-b px-4 pt-2 pb-2.5 md:flex md:h-15 md:items-center md:gap-2 md:py-0">
            <div className="mb-2.5 grid grid-cols-[5rem_minmax(0,1fr)_5rem] items-center md:hidden">
              <Button type="button" variant="ghost" size="sm" className="h-8 justify-self-start rounded-full border-transparent bg-foreground/6 px-3.5 text-[15px] font-normal normal-case tracking-normal shadow-none hover:bg-foreground/10"
                aria-pressed={listEditing} onClick={() => listEditing ? stopListEditing() : setListEditing(true)}>{listEditing ? "OK" : "Editar"}</Button>
              <h2 className="truncate text-center text-lg font-semibold">
                {listEditing ? (picked.length ? `${picked.length} ${picked.length === 1 ? "selecionada" : "selecionadas"}` : "Selecionar") : showArchived ? "Arquivadas" : "Conversas"}
              </h2>
              {listEditing ? <span aria-hidden="true" /> : <div className="flex justify-self-end gap-1">
                {overview && <Popover>
                  <PopoverTrigger render={<Button type="button" size="icon" variant="ghost" aria-label="Opções das mensagens" title="Opções" className="size-9 rounded-full" />}><RiMoreLine /></PopoverTrigger>
                  <PopoverContent align="end" className="w-64 rounded-2xl p-1.5">
                    <PopoverClose className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] hover:bg-foreground/5 [&_svg]:size-5" onClick={() => void setPresenceHidden(!overview.presenceHidden)}>{overview.presenceHidden ? <RiEyeLine /> : <RiEyeOffLine />}{overview.presenceHidden ? "Mostrar meu visto por último" : "Esconder meu visto por último"}</PopoverClose>
                    {overview.admin && <PopoverClose className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] hover:bg-foreground/5 [&_svg]:size-5" onClick={() => setReportsOpen(true)}><RiAlarmWarningLine />Denúncias</PopoverClose>}
                  </PopoverContent>
                </Popover>}
                <Button type="button" size="icon" aria-label="Nova mensagem" title="Nova mensagem" className="chat-action size-9 rounded-full [&_svg]:size-[18px]" onClick={() => setNewMessage(true)}><RiEditBoxLine /></Button>
              </div>}
            </div>
            {/* Busca leve, em pílula cinza, como nos apps de conversa. */}
            <label className="relative block min-w-0 md:flex-1">
              <RiSearchLine aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input type="search" aria-label="Buscar pessoas e mensagens" placeholder="Buscar" value={search} onChange={event => setSearch(event.target.value)}
                className="h-9 w-full rounded-full bg-foreground/6 pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 sm:text-[15px] [&::-webkit-search-cancel-button]:hidden" />
            </label>
            <Button type="button" size="sm" variant={listEditing ? "secondary" : "ghost"} className="shrink-0 normal-case tracking-normal max-md:hidden" aria-pressed={listEditing}
              onClick={() => listEditing ? stopListEditing() : setListEditing(true)}>{listEditing ? "OK" : "Editar"}</Button>
            <Button type="button" size="icon-sm" variant="ghost" className={`shrink-0 max-md:hidden ${listEditing ? "hidden" : ""}`} aria-label="Nova mensagem" title="Nova mensagem" onClick={() => setNewMessage(true)}><RiEditBoxLine /></Button>
          </div>
          <div className="space-y-0.5 px-2 py-2">
            {!overview && !loadError && Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-3 px-2 py-2.5"><span className="size-10 shrink-0 animate-pulse rounded-full bg-muted motion-reduce:animate-none" /><span className="grid flex-1 gap-1.5"><span className="h-3.5 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none" /><span className="h-3 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" /></span></div>)}
            {listOffline && <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"><RiWifiOffLine className="size-4 shrink-0" />Sem conexão. Mostrando as conversas salvas neste aparelho.</p>}
            {loadError && !overview && <div role="alert" className="grid gap-2 p-4 text-sm text-muted-foreground"><p>{loadError}</p><Button variant="outline" size="sm" className="justify-self-start" onClick={() => void loadPeople()}>Tentar novamente</Button></div>}
            {showArchived && !term && <button type="button" onClick={() => { setShowArchived(false); stopListEditing(); }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-primary outline-none hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring">
              <RiArrowLeftLine className="size-4" />Conversas
            </button>}
            {!showArchived && !term && archivedCount > 0 && <button type="button" onClick={() => { setShowArchived(true); stopListEditing(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm outline-none hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><RiArchiveLine className="size-5" /></span>
              <span className="flex-1 font-medium">Arquivadas</span><span className="text-xs text-muted-foreground tabular-nums">{archivedCount}</span>
            </button>}
            {listEditing && visiblePeople.length > 0 && <div className="flex justify-end px-1">
              <Button type="button" size="xs" variant="ghost" className="text-primary normal-case tracking-normal" onClick={() => setPicked(picked.length === visiblePeople.length ? [] : visiblePeople.map(person => person.id))}>
                {picked.length === visiblePeople.length ? "Limpar seleção" : "Selecionar todas"}
              </Button>
            </div>}
            {visiblePeople.map(person => {
              const unread = person.unread;
              const isPicked = picked.includes(person.id);
              return <button key={person.id} type="button" onClick={() => listEditing ? togglePick(person.id) : selectPerson(person.id)}
                aria-current={(!listEditing && selected === person.id) || undefined} aria-pressed={listEditing ? isPicked : undefined}
                onTouchStart={event => startListPress(event, person)} onTouchMove={moveListPress} onTouchEnd={endListPress} onTouchCancel={endListPress}
                onContextMenu={event => { event.preventDefault(); if (!listEditing) setPreviewing(person); }}
                className={`flex w-full select-none items-center gap-3 rounded-xl border px-2 py-2.5 text-left outline-none transition-colors [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none md:px-3 ${selected === person.id ? "border-white/50 bg-card/90 shadow-sm dark:border-white/10" : "border-transparent hover:bg-card/70"}`}>
                {listEditing && <span aria-hidden="true" className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${isPicked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>{isPicked && <RiCheckLine className="size-3.5" />}</span>}
                <Avatar person={person} presence />
                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2 text-sm font-medium"><span className={`truncate ${unread ? "font-semibold" : ""}`}>{person.name}</span>{person.muted && <RiNotificationOffLine aria-label="Silenciada" className="size-3.5 shrink-0 text-muted-foreground" />}{person.blocked && <RiForbidLine aria-label="Bloqueada" className="size-3.5 shrink-0 text-destructive" />}{person.last && <time dateTime={person.last.createdAt} className="shrink-0 text-[11px] font-normal text-muted-foreground">{new Date(person.last.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</time>}</span>
                  <span className={`block truncate text-xs ${unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>{person.self ? person.last ? person.last.body : "Envie algo para você mesmo" : person.last ? `${person.last.mine ? "Você: " : ""}${person.last.body}` : lastSeenLabel(person.lastSeen ?? null)}</span></span>
                {!!unread && <span className={`grid min-w-5 place-items-center rounded-full px-1 text-xs font-semibold ${person.muted ? "bg-muted-foreground/40 text-background" : "bg-primary text-primary-foreground"}`} aria-label={`${unread} não ${unread === 1 ? "lida" : "lidas"}`}>{unread > 99 ? "99+" : unread}</span>}
              </button>;
            })}
            {overview && !visiblePeople.length && <p className="p-4 text-sm text-muted-foreground">{term ? "Nenhuma pessoa encontrada." : showArchived ? "Nenhuma conversa arquivada." : "Nenhuma conversa ainda. Toque em Nova mensagem."}</p>}
            {globalResults && globalResults.length > 0 && <>
              <p className="px-3 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mensagens</p>
              {globalResults.map(result => { const owner = people.find(person => person.id === result.with); return <button key={result.id} type="button"
                onClick={() => { selectPerson(result.with); setTimeout(() => { setHighlighted(result.id); document.getElementById(`message-${result.id}`)?.scrollIntoView({ block: "center" }); }, 900); }}
                className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left outline-none hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring md:px-3">
                {owner && <Avatar person={owner} size="size-8" />}
                <span className="min-w-0 flex-1"><span className="flex justify-between gap-2 text-xs text-muted-foreground"><span className="truncate font-medium text-foreground">{owner?.name ?? "Conversa"}</span><time dateTime={result.createdAt}>{time.format(new Date(result.createdAt))}</time></span>
                  <span className="line-clamp-2 text-sm">{result.mine && "Você: "}<Highlight text={result.body} term={search.trim()} /></span></span>
              </button>; })}
            </>}
            {listEditing && <div aria-hidden="true" className="h-16" />}
          </div>
        </div>
        {/* Barra da edição: age só nas conversas selecionadas e só para quem está editando. */}
        {listEditing && <div className="glass-bar absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 border-t px-3 py-2.5">
          {showArchived
            ? <Button type="button" variant="ghost" size="sm" className="normal-case tracking-normal" disabled={!picked.length || listBusy} onClick={() => void changeConversations("unarchive")}><RiInboxUnarchiveLine />Desarquivar</Button>
            : <Button type="button" variant="ghost" size="sm" className="normal-case tracking-normal" disabled={!picked.length || listBusy} onClick={() => void changeConversations("archive")}><RiArchiveLine />Arquivar</Button>}
          <Button type="button" variant="ghost" size="sm" className="text-destructive normal-case tracking-normal" disabled={!picked.length || listBusy} onClick={() => setConfirmClear(true)}><RiDeleteBinLine />Apagar</Button>
        </div>}
      </section>

      <section aria-label="Mensagens da conversa" style={themeProps.style} className={`${themeProps.className} relative isolate min-h-0 min-w-0 flex-col ${selected ? "flex" : "hidden md:flex"}`}>
        <ChatBackdrop theme={chatTheme} step={wallStep} image={wallpaper} />
        {selected && peer ? <div ref={messageList} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <header className="glass-bar sticky top-0 z-10 flex h-15 shrink-0 items-center gap-1.5 border-b px-2 sm:gap-3 sm:px-4">
            <Button type="button" variant="ghost" size="sm" className="-ml-1 gap-1 px-1.5 md:hidden" title="Voltar às conversas"
              aria-label={otherUnread ? `Voltar às conversas, ${otherUnread} não ${otherUnread === 1 ? "lida" : "lidas"}` : "Voltar às conversas"} onClick={() => setSelected(null)}>
              <RiArrowLeftLine />{otherUnread > 0 && <span aria-hidden="true" className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground tabular-nums">{otherUnread > 99 ? "99+" : otherUnread}</span>}
            </Button>
            {/* Nome e foto abrem a ficha da pessoa. */}
            <h2 className="min-w-0 flex-1">
              <button type="button" onClick={() => setSheetOpen(true)} className="flex w-full min-w-0 items-center gap-2 rounded-lg sm:gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar person={peer} presence />
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-1 font-semibold"><span className="truncate">{peer.name}</span>{thread?.muted && <RiNotificationOffLine aria-label="Silenciada" className="size-3.5 shrink-0 text-muted-foreground" />}</span>
                  {!self && <span className="block truncate text-xs font-normal text-muted-foreground">{thread?.blocked ? "Bloqueado por você" : lastSeenLabel(peer.lastSeen ?? null)}</span>}
                </span>
              </button>
            </h2>
            <Button type="button" variant={searchOpen ? "secondary" : "ghost"} size="icon-sm" className="shrink-0" aria-label="Buscar na conversa" title="Buscar na conversa" aria-expanded={searchOpen}
              onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}><RiSearchLine /></Button>
            <Popover>
              <PopoverTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Mais ações da conversa" title="Mais" className="shrink-0" />}><RiMoreLine /></PopoverTrigger>
              <PopoverContent align="end" side="bottom" collisionPadding={12} className="max-h-[min(36rem,calc(100dvh-6rem))] w-72 overflow-y-auto rounded-2xl p-1.5">{conversationActions()}</PopoverContent>
            </Popover>
          </header>
          {searchOpen && <div className="glass-bar sticky top-15 z-10 border-b px-4 py-2">
            <div className="flex items-center gap-2">
              <Input autoFocus type="search" aria-label="Buscar mensagens" placeholder="Buscar nesta conversa..." value={searchText}
                onChange={event => setSearchText(event.target.value)} onKeyDown={event => { if (event.key === "Escape") closeSearch(); }}
                className="h-8 rounded-full border-white/50 bg-card/70 dark:border-white/10 dark:bg-white/5" />
              <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" aria-label="Fechar busca" onClick={closeSearch}><RiCloseLine /></Button>
            </div>
            {searchTerm.length >= 2 && <div role="listbox" aria-label="Mensagens encontradas" className="mt-2 max-h-[min(18rem,45dvh)] overflow-y-auto rounded-xl">
              {(!searchResults || searchResults.term !== searchTerm || (!searchResults.items && !searchResults.error)) && <p className="px-2 py-3 text-xs text-muted-foreground">Buscando...</p>}
              {searchResults?.term === searchTerm && searchResults.error && <p role="alert" className="px-2 py-3 text-xs text-destructive">Não foi possível buscar.</p>}
              {searchResults?.term === searchTerm && searchResults.items && !searchResults.items.length && <p className="px-2 py-3 text-xs text-muted-foreground">Nenhuma mensagem encontrada.</p>}
              {searchResults?.term === searchTerm && searchResults.items?.map(result => <button key={result.id} type="button" role="option" aria-selected={highlighted === result.id} disabled={loadingOlder}
                onClick={() => void jumpTo(result)}
                className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm outline-none hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
                <RiArrowUpSLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{result.mine ? "Você" : peer.name}</span><time dateTime={result.createdAt}>{time.format(new Date(result.createdAt))}</time></span>
                  <span className="line-clamp-2 wrap-break-word"><Highlight text={result.body} term={searchTerm} /></span>
                </span>
              </button>)}
            </div>}
          </div>}
          {thread?.peerProtects && <p className="glass-float mx-auto mt-3 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground"><RiShieldCheckLine className="size-3.5 shrink-0 text-primary" />{peer.name} impediu encaminhar e baixar o que envia.</p>}
          <div className="flex flex-1 flex-col gap-3 px-4 py-4" aria-live="polite">
            {hasOlder && <Button type="button" size="sm" variant="ghost" className="self-center normal-case tracking-normal" disabled={loadingOlder} onClick={() => void loadOlder()}>Carregar anteriores</Button>}
            {messages === null && <div className="grid gap-3" aria-label="Carregando mensagens">{[["mr-auto", "w-48"], ["ml-auto", "w-40"], ["mr-auto", "w-56"], ["ml-auto", "w-32"]].map(([side, width], index) => <span key={index} className={`h-10 ${width} ${side} animate-pulse rounded-2xl bg-(--chat-received)/70 motion-reduce:animate-none`} />)}</div>}
            {offline && <p className="glass-float mx-auto flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground"><RiWifiOffLine className="size-3.5 shrink-0" />Sem conexão · o que você enviar sai quando o sinal voltar</p>}
            {threadError && !shown.length && <div role="alert" className="m-auto grid justify-items-center gap-2 text-center"><p className="text-sm text-destructive">{threadError}</p><Button variant="outline" size="sm" onClick={() => void loadThread(selected)}>Tentar novamente</Button></div>}
            {messages && !shown.length && !outgoing.length && !threadError && <p className="glass-float m-auto rounded-full border px-4 py-1.5 text-center text-sm text-muted-foreground">{self ? "Envie uma mensagem para guardar algo aqui." : "Envie a primeira mensagem."}</p>}
            {shown.map((message, index) => <Fragment key={message.id}>
              {!sameDay(message.createdAt, shown[index - 1]?.createdAt) && <DaySeparator date={message.createdAt} />}
              <MessageBubble message={message} locked={lockedFor(message)} isLast={index === shown.length - 1} highlighted={highlighted === message.id} peerName={peer.name} showReceipts={!self}
                menu={messageActions(message, true)} canChatWith={id => id !== me && people.some(person => person.id === id)} onChat={selectPerson}
                onReply={() => reply(message)} onReact={emoji => void react(message, emoji)} onView={item => setViewing({ message, item })} onJumpReply={id => void jumpTo({ ...message, id })}
                gestures={{ onContextMenu: event => openContextMenu(event, message), onKeyDown: event => openContextMenuFromKeyboard(event, message), onTouchStart: event => startSwipe(event, message), onTouchMove: event => moveSwipe(event, message), onTouchEnd: event => endSwipe(event, message), onTouchCancel: cancelSwipe }} />
            </Fragment>)}
            {outgoing.map(item => <OutgoingBubble key={item.id} item={item} onRetry={() => retryOutgoing(item.id)} onDrop={() => dropOutgoing(item.id)} />)}
          </div>
          {!!thread?.autoDeleteSeconds && <p className="glass-float mx-auto mt-2 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <RiTimerLine className="size-3.5" />Mensagens novas somem após {autoDeleteLabel(thread.autoDeleteSeconds)}.
          </p>}
          {chatBlocked && <div className="glass-bar sticky bottom-0 z-10 flex flex-wrap items-center justify-center gap-2 border-t px-3 py-3 text-center text-sm text-muted-foreground">
            {thread?.blocked
              ? <>Você bloqueou {peer.name}.<Button type="button" size="sm" variant="ghost" className="text-primary normal-case tracking-normal" onClick={() => void updateSettings({ blocked: false })}>Desbloquear</Button></>
              : "Não é possível enviar mensagens para esta pessoa."}
          </div>}
          <form onSubmit={event => void send(event)} className={`sticky bottom-0 z-10 px-2 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3 ${chatBlocked ? "hidden" : ""}`}>
            {(replyTo || editing) && <div className="chat-banner-enter glass-float mb-2 flex items-start justify-between gap-2 rounded-lg border-l-2 border-primary px-3 py-2 text-xs">
              <div className="min-w-0"><span className="font-semibold">{editing ? "Editando mensagem" : `Respondendo a ${replyTo?.mine ? "você" : peer.name}`}</span><p className="truncate text-muted-foreground">{editing ? editing.body : replyTo && previewOf(replyTo)}</p></div>
              <Button type="button" variant="ghost" size="icon-xs" aria-label="Cancelar" onClick={() => { setReplyTo(null); if (editing) { setEditing(null); setBody(""); } }}><RiCloseLine /></Button>
            </div>}
            <div className="flex items-end gap-1.5 sm:gap-2">
              <Popover open={attachOpen} onOpenChange={setAttachOpen}>
                <PopoverTrigger render={<Button type="button" size="icon" variant="ghost" className="glass-float chat-action size-10 shrink-0 rounded-full border sm:size-11 [&_svg]:size-6" aria-label="Anexar" title="Anexar" disabled={!!editing} />}><RiAddLine /></PopoverTrigger>
                <PopoverContent side="top" align="start" sideOffset={10} collisionPadding={12} className="w-48 p-1">
                  <PopoverTitle className="sr-only">Anexar</PopoverTitle>
                  <PopoverClose render={<Button type="button" variant="ghost" size="sm" className="w-full justify-start normal-case tracking-normal" />} onClick={() => setCameraOpen(true)}><RiCameraLine />Câmera</PopoverClose>
                  <PopoverClose render={<Button type="button" variant="ghost" size="sm" className="w-full justify-start normal-case tracking-normal" />} onClick={openPhotoSelector}><RiImageLine />Fotos</PopoverClose>
                  <PopoverClose render={<Button type="button" variant="ghost" size="sm" className="w-full justify-start normal-case tracking-normal" />} onClick={() => setFilePickerOpen(true)}><RiAttachment2 />Arquivo</PopoverClose>
                  <PopoverClose render={<Button type="button" variant="ghost" size="sm" className="w-full justify-start normal-case tracking-normal" />} onClick={() => setContactPickerOpen(true)}><RiContactsLine />Contato</PopoverClose>
                </PopoverContent>
              </Popover>
              <div className="glass-float flex min-w-0 flex-1 items-end gap-0.5 rounded-[1.375rem] border py-[3px] pr-1 pl-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
                <textarea ref={messageInput} value={body} maxLength={5000} rows={1} placeholder="Mensagem" aria-label="Escrever mensagem"
                  className="max-h-38 min-h-9 w-0 min-w-0 flex-1 resize-none overflow-hidden bg-transparent px-2 py-2 text-base leading-5 outline-none placeholder:text-muted-foreground sm:px-3 sm:text-sm"
                  onChange={event => setBody(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Escape") { setReplyTo(null); if (editing) { setEditing(null); setBody(""); } }
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && !touchKeyboard()) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
                  }} />
                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <PopoverTrigger render={<Button type="button" size="icon" variant="ghost" className="chat-action size-8 shrink-0 rounded-full text-muted-foreground sm:size-9" aria-label="Inserir emoji" title="Inserir emoji" />}><RiEmotionHappyLine /></PopoverTrigger>
                  <PopoverContent side="top" align="end" sideOffset={10} collisionPadding={12} className="w-[19rem] p-2">
                    <PopoverTitle className="sr-only">Emoji</PopoverTitle>
                    <EmojiPicker onPick={insertEmoji} />
                  </PopoverContent>
                </Popover>
                {!/\S/.test(body) && !editing && <Button type="button" size="icon" variant="ghost" className="chat-emoji-enter chat-action size-8 shrink-0 rounded-full text-muted-foreground max-[359px]:hidden sm:size-9" aria-label="Tirar ou enviar foto" title="Foto" onClick={() => setCameraOpen(true)}><RiCameraLine /></Button>}
              </div>
              {/* Tocar em enviar não tira o foco do campo: o teclado continua aberto para a próxima mensagem. */}
              <Button type="submit" size="icon" className="chat-action size-10 shrink-0 rounded-full shadow-md sm:size-11 [&_svg]:size-5" aria-label={editing ? "Salvar edição" : "Enviar mensagem"} disabled={!body.trim()}
                onMouseDown={event => event.preventDefault()}><RiSendPlane2Fill /></Button>
            </div>
          </form>
        </div> : <div className="glass-float m-auto flex flex-col items-center gap-3 rounded-2xl border p-6 text-center text-muted-foreground"><RiChat3Line className="size-10" /><p className="text-sm">Selecione uma conversa ou comece uma nova mensagem.</p></div>}
      </section>
    </div>

    {contextMenu && createPortal(<div ref={contextMenuRef} role="menu" tabIndex={-1} aria-label="Ações da mensagem" className="glass-surface fixed z-[100] w-48 rounded-xl border border-border p-1 text-popover-foreground shadow-lg outline-none" style={{ left: contextMenu.x, top: contextMenu.y }}>
      {messageActions(contextMenu.message, false)}
    </div>, document.body)}
    <DriveFilePicker open={filePickerOpen} onOpenChange={setFilePickerOpen} onPick={sendFile} />
    <CameraCaptureDialog open={cameraOpen} onOpenChange={setCameraOpen} fullscreen title={peer ? `Foto para ${peer.name}` : "Foto"} confirmLabel="Selecionar"
      onConfirm={file => stagePhotos([file])} onOpenGallery={openPhotoSelector} />
    {photoDraft && <PhotoSelectionDialog photos={photoDraft.photos} caption={photoDraft.caption} error={photoError} sending={photoSending}
      onCaptionChange={caption => setPhotoDraft(current => current && { ...current, caption })}
      onAdd={stagePhotos} onRemove={removePhoto} onCancel={closePhotoDraft} onSend={() => void sendSelectedPhotos()} />}
    {/* Foto em tela cheia ao tocar no balão. */}
    <Dialog open={!!viewing} onOpenChange={open => { if (!open) setViewing(null); }}>
      <DialogContent className="top-0 left-0 grid h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 place-items-center rounded-none bg-black/95 p-2 text-white ring-0 sm:max-w-none">
        <DialogTitle className="sr-only">Foto</DialogTitle>
        {viewing && <img src={fileUrl(viewing.message.id, viewing.item.fileId)} alt={viewing.message.body || "Foto"} draggable={!lockedFor(viewing.message)} onContextMenu={event => { if (lockedFor(viewing.message)) event.preventDefault(); }} className="max-h-[90dvh] max-w-full object-contain" />}
        {viewing?.message.body && <p className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pt-8 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-sm">{viewing.message.body}</p>}
        {viewing && !lockedFor(viewing.message) && <a href={fileUrl(viewing.message.id, viewing.item.fileId)} download={viewing.item.name} className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur-xl hover:bg-white/25">Baixar</a>}
      </DialogContent>
    </Dialog>
    <ConversationPreview userId={me} person={previewing} avatar={previewing && <Avatar person={previewing} />}
      onOpenChange={open => { if (!open) setPreviewing(null); }} onOpen={id => { setPreviewing(null); selectPerson(id); }} />
    {selected && peer && <PersonSheet personId={peer.id} self={self} open={sheetOpen} onOpenChange={setSheetOpen}
      muted={!!thread?.muted} onToggleMute={() => void updateSettings({ muted: !thread?.muted })}
      onSearch={() => { setSheetOpen(false); setSearchOpen(true); }} moreActions={conversationActions()} />}
    {/* Tema e fundo: aberto pelo menu "⋯" da conversa ou pelo "Mais" da ficha. */}
    <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
      <DialogContent className="max-h-[min(40rem,calc(100dvh-2rem))] overflow-y-auto sm:max-w-sm">
        <DialogTitle>Tema da conversa</DialogTitle>
        <ChatThemePicker theme={chatTheme} onChange={updateTheme} onChooseImage={file => void chooseWallpaper(file)} onRemoveImage={removeWallpaper} />
      </DialogContent>
    </Dialog>
    <NewMessageSheet open={newMessage} onOpenChange={setNewMessage} people={people} userId={me} avatar={person => <Avatar person={person} />} onPick={id => { setNewMessage(false); selectPerson(id); }} />
    {reportTarget && peer && <ReportDialog peerId={peer.id} name={peer.name} message={reportTarget.message} onClose={() => setReportTarget(null)} />}
    {reportsOpen && <ReportsDialog onClose={() => setReportsOpen(false)} />}
    {contactPickerOpen && <PeoplePicker title="Compartilhar contato" description="Escolha quem compartilhar." people={people.filter(person => person.id !== selected && !person.self)} onPick={shareContact} onClose={() => setContactPickerOpen(false)} />}
    {forwarding && <PeoplePicker title="Encaminhar mensagem" description="Escolha para quem encaminhar." preview={previewOf(forwarding)} userId={me} people={people.filter(person => !person.blocked)} onPick={forwardTo} onClose={() => setForwarding(null)} />}
    {confirmBlock && peer && <ConfirmDialog title={`Bloquear ${peer.name}?`} confirmLabel="Bloquear"
      description="Vocês dois deixam de poder enviar mensagens um para o outro nesta conversa até você desbloquear. O acesso ao app continua; a pessoa não é avisada."
      onConfirm={async () => { await updateSettings({ blocked: true }); }} onClose={() => setConfirmBlock(false)} />}
    {confirmClear && <ConfirmDialog title={picked.length === 1 ? "Apagar conversa?" : `Apagar ${picked.length} conversas?`} confirmLabel="Apagar"
      description="As mensagens somem só para você. A outra pessoa continua vendo a conversa, e o que chegar depois aparece normalmente."
      onConfirm={async () => { await changeConversations("clear"); }} onClose={() => setConfirmClear(false)} />}
    {deleting && <ConfirmDialog title="Excluir mensagem?" description="A mensagem e os anexos somem para as duas pessoas; fica o aviso “Mensagem apagada”." confirmLabel="Excluir"
      onConfirm={async () => { await removeMessage(); }} onClose={() => setDeleting(null)} />}
  </main>;

  // Ações de uma mensagem: no "⋯" do balão (popover) e no menu do toque longo ou botão direito.
  function messageActions(message: Message, inPopover: boolean) {
    const locked = lockedFor(message);
    const close = () => setContextMenu(null);
    const item = (key: string, icon: React.ReactNode, label: string, onClick: () => void, destructive = false) => inPopover
      ? <PopoverClose key={key} render={<Button type="button" variant="ghost" size="sm" className={`w-full justify-start normal-case tracking-normal ${destructive ? "text-destructive" : ""}`} />} onClick={onClick}>{icon}{label}</PopoverClose>
      : <Button key={key} type="button" role="menuitem" variant="ghost" size="sm" className={`w-full justify-start normal-case tracking-normal ${destructive ? "text-destructive" : ""}`} onClick={() => { onClick(); close(); }}>{icon}{label}</Button>;
    return <>
      {item("reply", <RiReplyLine />, "Responder", () => reply(message))}
      {!!message.body && !locked && item("copy", <RiFileCopyLine />, "Copiar", () => void copyMessage(message))}
      {message.mine && !!message.body && !message.forwarded && item("edit", <RiPencilLine />, "Editar", () => edit(message))}
      {!locked && item("forward", <RiShareForwardLine />, "Encaminhar", () => setForwarding(message))}
      {!message.mine && item("report", <RiAlarmWarningLine />, "Denunciar", () => setReportTarget({ message }))}
      {message.mine && item("delete", <RiDeleteBinLine />, "Excluir", () => setDeleting(message), true)}
      <div className="mt-1 grid grid-cols-6 gap-0.5 border-t pt-1">{quickReactions.map(emoji => inPopover
        ? <PopoverClose key={emoji} render={<button type="button" className="grid size-7 place-items-center rounded hover:bg-muted" aria-label={`Reagir com ${emoji}`} />} onClick={() => void react(message, emoji)}>{emoji}</PopoverClose>
        : <button key={emoji} type="button" role="menuitem" className="grid size-7 place-items-center rounded hover:bg-muted" aria-label={`Reagir com ${emoji}`} onClick={() => { void react(message, emoji); close(); }}>{emoji}</button>)}</div>
    </>;
  }
}
