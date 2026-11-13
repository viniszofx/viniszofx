"use client";
import { useState } from "react";
import { Field, selectClass } from "@/components/ui/field";
import { Badge, LoadingBlock } from "@/components/ui/feedback";
import { RiCameraLine as Camera, RiFlagLine as Flag, RiMapPinLine as Pin, RiPlayLine as Play, RiStopLine as Stop, RiDeleteBinLine as Trash2, RiLogoutBoxRLine as Leave } from "@remixicon/react";
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

    <section className="space-y-4" aria-label="Jornadas da equipe">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="De" className="text-xs text-muted-foreground"><Input type="date" value={filter.from} onChange={event => setFilter(previous => ({ ...previous, from: event.target.value }))} /></Field>
        <Field label="Até" className="text-xs text-muted-foreground"><Input type="date" value={filter.to} onChange={event => setFilter(previous => ({ ...previous, to: event.target.value }))} /></Field>
        <Field label="Pessoa" className="text-xs text-muted-foreground"><select className={`${selectClass} min-w-44`} value={filter.employeeId} onChange={event => setFilter(previous => ({ ...previous, employeeId: event.target.value }))}><option value="">Todas</option>{employees.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <p className="ml-auto text-sm text-muted-foreground">{list.length} jornada(s) · {Math.floor(totalMinutes / 60)}h{String(totalMinutes % 60).padStart(2, "0")} · {totalKm.toLocaleString("pt-BR")} km</p>
      </div>
      {!loaded ? <LoadingBlock label="Carregando jornadas" className="h-32" /> : <div className="grid gap-4 lg:grid-cols-2">{list.map(journey => { const open = !journey.events.some(event => event.type === "end"); const total = minutes(journey);
        return <article key={journey.id} className="space-y-3 border bg-card p-4">
          <header className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{lookup("employees", journey.employeeId) || "Pessoa removida"}</h3><p className="text-xs text-muted-foreground">{new Date(`${journey.date}T12:00:00`).toLocaleDateString("pt-BR")} · {lookup("vehicles", journey.vehicleId) || journey.vehicleText || "sem veículo"}{journey.tripId && ` · viagem ${lookup("trips", journey.tripId)}`}</p></div>
            <div className="flex items-center gap-1"><Badge color={open ? "#f97316" : undefined}>{open ? "Em andamento" : `${Math.floor(total / 60)}h${String(total % 60).padStart(2, "0")}`}</Badge><Button variant="ghost" size="icon-sm" aria-label="Excluir jornada" onClick={() => setDeleting(journey)}><Trash2 /></Button></div></header>
          {journey.events.filter(event => event.type === "arrival").length > 0 && <p className="text-xs"><Flag className="mr-1 inline size-3" />{journey.events.filter(event => event.type === "arrival").map(event => event.place || "local").join(" → ")}</p>}
          <ol className="space-y-2 border-l pl-3">{journey.events.map(event => <li key={event.id} className="text-sm"><span className="mr-2 tabular-nums text-muted-foreground">{time(event.at)}</span><strong className="font-medium">{event.type === "photo" ? `Foto · ${photoKinds.find(kind => kind.value === event.photoKind)?.label ?? ""}` : labels[event.type]}</strong>{event.place && ` · ${event.place}`}{event.km && ` · ${event.km} km`}
            {event.latitude !== undefined && <a className="ml-2 text-xs text-primary underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=17/${event.latitude}/${event.longitude}`}>mapa{event.accuracy ? ` (±${event.accuracy} m)` : ""}</a>}
            {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}{event.photo && <Photo photo={event.photo.blob} kind={event.photoKind} />}</li>)}</ol>
        </article>; })}{!list.length && <p className="text-sm text-muted-foreground">Nenhuma jornada no período.</p>}</div>}
    </section>
    {deleting && <ConfirmDialog title="Excluir jornada?" description="A jornada, seus registros e fotos serão removidos." onConfirm={() => journeyStore.remove(deleting.id)} onClose={() => setDeleting(null)} />}
  </CatalogLayout>;
}
