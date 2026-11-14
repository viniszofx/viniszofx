"use client";
import { surfaceVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Field, selectClass } from "@/components/ui/field";
import { Badge, LoadingBlock } from "@/components/ui/feedback";
import { RiCameraLine as Camera, RiFlagLine as Flag, RiMapPinLine as Pin, RiPlayLine as Play, RiStopLine as Stop, RiDeleteBinLine as Trash2, RiLogoutBoxRLine as Leave, RiPencilLine as Pencil } from "@remixicon/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CatalogLayout } from "@/components/listing/catalog";
import { useObjectUrl } from "@/lib/browser/use-object-url";
import { useReferenceOptions, useLookup } from "@/lib/records/references";
import { fieldsOf, newId } from "@/lib/records/store";
import { journeyStore, type Journey, type JourneyEvent, type JourneyEventType } from "@/lib/nodus/stores";
import { notifyError } from "@/lib/ui/notifications";

const labels: Record<JourneyEventType, string> = { start: "Início do dia", arrival: "Chegada", departure: "Saída", photo: "Foto", end: "Fim do dia" };
const photoKinds = [{ value: "service", label: "Serviço" }, { value: "receipt", label: "Comprovante" }, { value: "incident", label: "Ocorrência" }, { value: "odometer", label: "Hodômetro" }] as const;
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const time = (value: string) => new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function position(): Promise<Partial<JourneyEvent>> {
  if (!("geolocation" in navigator)) return Promise.resolve({});
  return new Promise(resolve => navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: Math.round(coords.accuracy) }),
    () => resolve({}), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }));
}

/** Shrinks camera photos to at most 1600px so uploads stay small on mobile data. */
async function compress(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch { return file; }
}

function minutes(journey: Journey) {
  const start = journey.events.find(event => event.type === "start"); const end = [...journey.events].reverse().find(event => event.type === "end");
  return start ? Math.round(((end ? new Date(end.at) : new Date()).getTime() - new Date(start.at).getTime()) / 60000) : 0;
}
function kmOf(journey: Journey) {
  const values = journey.events.map(event => Number(event.km)).filter(value => value > 0);
  return values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;
}

const duration = (total: number) => `${Math.floor(total / 60)}h${String(total % 60).padStart(2, "0")}`;
const clock = (value: string) => { const date = new Date(value); return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`; };
const localDay = (value: string) => { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };

/** Situação de quem está em campo a partir do último registro. */
export function journeyStatus(journey: Journey) {
  const last = [...journey.events].reverse().find(event => event.type !== "photo");
  if (!last || last.type === "end") return { label: "Encerrada", place: "" };
  if (last.type === "arrival") return { label: "No local", place: last.place };
  if (last.type === "departure") return { label: "Em deslocamento", place: last.place ? `saiu de ${last.place}` : "" };
  return { label: "Em campo", place: journey.destination };
}
export const journeyMinutes = (journey: Journey) => minutes(journey);
export const journeyKm = (journey: Journey) => kmOf(journey);

/** Quem está com jornada aberta agora: situação, tempo e KM. */
function TeamNow({ journeys }: { journeys: Journey[] }) {
  const lookup = useLookup();
  const open = journeys.filter(journey => !journey.events.some(event => event.type === "end")).sort((a, b) => (lookup("employees", a.employeeId) || "").localeCompare(lookup("employees", b.employeeId) || "", "pt-BR"));
  if (!open.length) return null;
  return <section aria-labelledby="team-now" className="space-y-2">
    <h2 id="team-now" className="text-sm font-semibold">Equipe agora <span className="font-normal text-muted-foreground">· {open.length} em campo</span></h2>
    <ul className="grid gap-px overflow-hidden border bg-border sm:grid-cols-2 xl:grid-cols-3">{open.map(journey => { const status = journeyStatus(journey); const last = journey.events.at(-1);
      return <li key={journey.id} className="bg-card p-3">
        <div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-semibold">{lookup("employees", journey.employeeId) || "Pessoa removida"}</p><Badge color={status.label === "No local" ? "#16a34a" : "#f97316"}>{status.label}</Badge></div>
        <p className="truncate text-xs text-muted-foreground">{status.place || "Sem local informado"}</p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">desde {time(journey.events[0].at)} · {duration(minutes(journey))} · {kmOf(journey).toLocaleString("pt-BR")} km{last && ` · último registro ${time(last.at)}`}</p>
      </li>; })}</ul>
  </section>;
}

type EventDraft = { id: string; type: JourneyEventType; day: string; clock: string; place: string; km: string; notes: string };

/** Corrige a jornada: dados do dia e cada registro (horário, local, KM, observação) ou remove registros. */
function EditJourney({ journey, onClose }: { journey: Journey; onClose: () => void }) {
  const vehicles = useReferenceOptions("vehicles");
  const [head, setHead] = useState({ date: journey.date, vehicleId: journey.vehicleId, vehicleText: journey.vehicleText, destination: journey.destination });
  const [events, setEvents] = useState<EventDraft[]>(() => journey.events.map(event => ({ id: event.id, type: event.type, day: localDay(event.at), clock: clock(event.at), place: event.place, km: event.km, notes: event.notes })));
  const [error, setError] = useState("");
  const update = (id: string, patch: Partial<EventDraft>) => setEvents(previous => previous.map(event => event.id === id ? { ...event, ...patch } : event));
  function save() {
    const next = events.map(draft => { const original = journey.events.find(event => event.id === draft.id)!; const at = new Date(`${draft.day}T${draft.clock}:00`);
      return { ...original, at: Number.isNaN(at.getTime()) ? original.at : at.toISOString(), place: draft.place.trim(), km: draft.km, notes: draft.notes.trim() }; })
      .sort((a, b) => a.at.localeCompare(b.at));
    if (!next.length || next[0].type !== "start") { setError("A jornada precisa começar pelo início do dia."); return; }
    const endIndex = next.findIndex(event => event.type === "end");
    if (endIndex >= 0 && endIndex !== next.length - 1) { setError("Há registros depois do fim do dia; ajuste os horários."); return; }
    journeyStore.save({ ...fieldsOf(journey), ...head, events: next }, journey.id);
    onClose();
  }
  return <Dialog open onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
    <DialogTitle>Editar jornada</DialogTitle><DialogDescription>Corrija horários, locais e KM. As coordenadas e fotos originais são mantidas.</DialogDescription>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Data"><Input type="date" value={head.date} onChange={event => setHead({ ...head, date: event.target.value })} /></Field>
      <Field label="Veículo"><select className={selectClass} value={head.vehicleId} onChange={event => setHead({ ...head, vehicleId: event.target.value })}><option value="">Sem cadastro</option>{vehicles.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
      {!head.vehicleId && <Field label="Veículo (sem cadastro)"><Input value={head.vehicleText} onChange={event => setHead({ ...head, vehicleText: event.target.value })} /></Field>}
      <Field label="Destino do dia"><Input value={head.destination} onChange={event => setHead({ ...head, destination: event.target.value })} /></Field>
    </div>
    <ol className="divide-y border">{events.map(event => <li key={event.id} className="grid gap-2 p-3 sm:grid-cols-[8rem_6rem_1fr_6rem_auto] sm:items-end">
      <p className="text-xs font-semibold sm:col-span-5">{event.type === "photo" ? "Foto" : labels[event.type]}</p>
      <Input aria-label="Dia" type="date" value={event.day} onChange={change => update(event.id, { day: change.target.value })} />
      <Input aria-label="Horário" type="time" value={event.clock} onChange={change => update(event.id, { clock: change.target.value })} />
      <Input aria-label="Local" placeholder="Local" value={event.place} onChange={change => update(event.id, { place: change.target.value })} />
      <Input aria-label="KM" type="number" min={0} placeholder="KM" value={event.km} onChange={change => update(event.id, { km: change.target.value })} />
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Remover registro" disabled={event.type === "start"} onClick={() => setEvents(previous => previous.filter(item => item.id !== event.id))}><Trash2 /></Button>
      <Input aria-label="Observação" placeholder="Observação" className="sm:col-span-5" value={event.notes} onChange={change => update(event.id, { notes: change.target.value })} />
    </li>)}</ol>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="button" onClick={save}>Salvar jornada</Button></div>
  </DialogContent></Dialog>;
}

function Photo({ photo, kind }: { photo: Blob; kind?: JourneyEvent["photoKind"] }) {
  const url = useObjectUrl(photo);
  return url ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Foto: ${photoKinds.find(option => option.value === kind)?.label ?? "registro"}`} className="mt-1 h-24 w-32 border object-cover" /></a> : null;
}

export function JourneysPage() {
  const { records, loaded, pending } = journeyStore.useRecords();
  const employees = useReferenceOptions("employees");
  const trips = useReferenceOptions("trips");
  const vehicles = useReferenceOptions("vehicles");
  const lookup = useLookup();
  const [employeeId, setEmployeeId] = useState("");
  const [start, setStart] = useState({ tripId: "", vehicleId: "", vehicleText: "", destination: "", km: "" });
  const [step, setStep] = useState({ place: "", km: "", notes: "", photoKind: "service" as JourneyEvent["photoKind"] });
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState({ from: "", to: "", employeeId: "" });
  const [deleting, setDeleting] = useState<Journey | null>(null);
  const [editing, setEditing] = useState<Journey | null>(null);
  const active = records.find(journey => journey.employeeId === employeeId && !journey.events.some(event => event.type === "end"));
  const last = active?.events.at(-1);
  const inside = last?.type === "arrival";

  async function record(type: JourneyEventType, photo?: File, place = step.place.trim()) {
    if (!employeeId) return notifyError("Escolha a pessoa", "Selecione quem está registrando a jornada.");
    setBusy(true);
    try {
      const geo = await position();
      const file = photo ? await compress(photo) : undefined;
      const event: JourneyEvent = { id: newId(), type, at: new Date().toISOString(), ...geo, place: type === "start" ? start.destination.trim() : place, km: type === "start" ? start.km : step.km, notes: step.notes.trim(),
        ...(file ? { photoKind: step.photoKind, photo: { id: newId(), name: file.name, type: file.type, size: file.size, blob: file } } : {}) };
      if (type === "start") journeyStore.save({ date: today(), employeeId, tripId: start.tripId, vehicleId: start.vehicleId, vehicleText: start.vehicleText.trim(), destination: start.destination.trim(), events: [event] });
      else if (active) journeyStore.save({ ...fieldsOf(active), events: [...active.events, event] }, active.id, { silent: type === "photo" });
      setStep(previous => ({ ...previous, place: type === "departure" || type === "end" ? "" : previous.place, km: "", notes: "" }));
      if (!geo.latitude) notifyError("Sem localização", "O registro foi salvo sem coordenadas. Verifique a permissão de localização.");
    } finally { setBusy(false); }
  }

  const list = records.filter(journey => (!filter.employeeId || journey.employeeId === filter.employeeId) && (!filter.from || journey.date >= filter.from) && (!filter.to || journey.date <= filter.to)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const totalMinutes = list.reduce((sum, journey) => sum + minutes(journey), 0);
  const totalKm = list.reduce((sum, journey) => sum + kmOf(journey), 0);

  return <CatalogLayout section="Operação" title="Jornadas" description="Registro de campo com horário do aparelho, localização e fotos, separado da viagem planejada.">
    <section className="space-y-4 border p-4" aria-label="Registrar jornada">
      <label className="grid max-w-sm gap-1 text-sm">Quem está registrando<select className={selectClass} value={employeeId} onChange={event => setEmployeeId(event.target.value)}><option value="">{employees.loaded ? "Escolha o colaborador" : "Carregando…"}</option>{employees.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      {employeeId && !active && <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Viagem"><select className={selectClass} value={start.tripId} onChange={event => setStart(previous => ({ ...previous, tripId: event.target.value }))}><option value="">Sem viagem cadastrada</option>{trips.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <Field label="Veículo"><select className={selectClass} value={start.vehicleId} onChange={event => setStart(previous => ({ ...previous, vehicleId: event.target.value }))}><option value="">Digitar abaixo</option>{vehicles.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        {!start.vehicleId && <Field label="Veículo (sem cadastro)"><Input value={start.vehicleText} onChange={event => setStart(previous => ({ ...previous, vehicleText: event.target.value }))} /></Field>}
        <Field label="Destino do dia"><Input value={start.destination} onChange={event => setStart(previous => ({ ...previous, destination: event.target.value }))} /></Field>
        <Field label="KM na largada"><Input type="number" min={0} value={start.km} onChange={event => setStart(previous => ({ ...previous, km: event.target.value }))} /></Field>
        <div className="flex items-end"><Button disabled={busy || !loaded} onClick={() => void record("start")}><Play />Iniciar dia</Button></div>
      </div>}
      {active && <div className="space-y-4">
        <p className="text-sm">Jornada de hoje em andamento desde <strong>{time(active.events[0].at)}</strong>{active.destination && <> · destino {active.destination}</>}.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Local"><Input placeholder={inside ? last?.place : active.destination || "Cliente, obra…"} value={step.place} onChange={event => setStep(previous => ({ ...previous, place: event.target.value }))} /></Field>
          <Field label="KM atual"><Input type="number" min={0} value={step.km} onChange={event => setStep(previous => ({ ...previous, km: event.target.value }))} /></Field>
          <Field label="Observação"><Input value={step.notes} onChange={event => setStep(previous => ({ ...previous, notes: event.target.value }))} /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!inside ? <Button disabled={busy} onClick={() => void record("arrival", undefined, step.place.trim() || (active.events.some(event => event.type === "arrival") ? "" : active.destination))}><Pin />Cheguei</Button> : <Button disabled={busy} onClick={() => void record("departure")}><Leave />Saí</Button>}
          <select aria-label="Tipo de foto" className={`${selectClass} w-40`} value={step.photoKind} onChange={event => setStep(previous => ({ ...previous, photoKind: event.target.value as JourneyEvent["photoKind"] }))}>{photoKinds.map(kind => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select>
          <label className={`inline-flex h-9 cursor-pointer items-center gap-1 border px-4 text-xs font-semibold uppercase tracking-widest hover:bg-muted ${busy ? "pointer-events-none opacity-50" : ""}`}><Camera className="size-3.5" />Foto<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void record("photo", file); }} /></label>
          <Button variant="destructive" disabled={busy} onClick={() => void record("end")}><Stop />Encerrar dia</Button>
          {(busy || pending > 0) && <span className="text-xs text-muted-foreground">Salvando…</span>}
        </div>
      </div>}
    </section>

    {loaded && <TeamNow journeys={records} />}

    <section className="space-y-4" aria-label="Jornadas da equipe">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="De" className="text-xs text-muted-foreground"><Input type="date" value={filter.from} onChange={event => setFilter(previous => ({ ...previous, from: event.target.value }))} /></Field>
        <Field label="Até" className="text-xs text-muted-foreground"><Input type="date" value={filter.to} onChange={event => setFilter(previous => ({ ...previous, to: event.target.value }))} /></Field>
        <Field label="Pessoa" className="text-xs text-muted-foreground"><select className={`${selectClass} min-w-44`} value={filter.employeeId} onChange={event => setFilter(previous => ({ ...previous, employeeId: event.target.value }))}><option value="">Todas</option>{employees.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <p className="ml-auto text-sm text-muted-foreground">{list.length} jornada(s) · {Math.floor(totalMinutes / 60)}h{String(totalMinutes % 60).padStart(2, "0")} · {totalKm.toLocaleString("pt-BR")} km</p>
      </div>
      {!loaded ? <LoadingBlock label="Carregando jornadas" className="h-32" /> : <div className="grid gap-4 lg:grid-cols-2">{list.map(journey => { const open = !journey.events.some(event => event.type === "end"); const total = minutes(journey);
        return <article key={journey.id} className={cn(surfaceVariants(), "space-y-3 p-4")}>
          <header className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{lookup("employees", journey.employeeId) || "Pessoa removida"}</h3><p className="text-xs text-muted-foreground">{new Date(`${journey.date}T12:00:00`).toLocaleDateString("pt-BR")} · {lookup("vehicles", journey.vehicleId) || journey.vehicleText || "sem veículo"}{journey.tripId && ` · viagem ${lookup("trips", journey.tripId)}`}</p></div>
            <div className="flex items-center gap-1"><Badge color={open ? "#f97316" : undefined}>{open ? "Em andamento" : duration(total)}</Badge><Button variant="ghost" size="icon-sm" aria-label="Editar jornada" onClick={() => setEditing(journey)}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label="Excluir jornada" onClick={() => setDeleting(journey)}><Trash2 /></Button></div></header>
          {journey.events.filter(event => event.type === "arrival").length > 0 && <p className="text-xs"><Flag className="mr-1 inline size-3" />{journey.events.filter(event => event.type === "arrival").map(event => event.place || "local").join(" → ")}</p>}
          <ol className="space-y-2 border-l pl-3">{journey.events.map(event => <li key={event.id} className="text-sm"><span className="mr-2 tabular-nums text-muted-foreground">{time(event.at)}</span><strong className="font-medium">{event.type === "photo" ? `Foto · ${photoKinds.find(kind => kind.value === event.photoKind)?.label ?? ""}` : labels[event.type]}</strong>{event.place && ` · ${event.place}`}{event.km && ` · ${event.km} km`}
            {event.latitude !== undefined && <a className="ml-2 text-xs text-primary underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=17/${event.latitude}/${event.longitude}`}>mapa{event.accuracy ? ` (±${event.accuracy} m)` : ""}</a>}
            {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}{event.photo && <Photo photo={event.photo.blob} kind={event.photoKind} />}</li>)}</ol>
        </article>; })}{!list.length && <p className="text-sm text-muted-foreground">Nenhuma jornada no período.</p>}</div>}
    </section>
    {editing && <EditJourney journey={editing} onClose={() => setEditing(null)} />}
    {deleting && <ConfirmDialog title="Excluir jornada?" description="A jornada, seus registros e fotos serão removidos." onConfirm={() => journeyStore.remove(deleting.id)} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
