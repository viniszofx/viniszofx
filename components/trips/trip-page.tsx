"use client";
import Link from "next/link";
import { RiArrowLeftLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTrips, retryTrips } from "@/lib/trips/store";
import { TripForm } from "./trip-form";
export function TripPage({ tripId }: { tripId: string }) {
 const router = useRouter(); const { trips, loaded, pending, error } = useTrips();const trip = trips.find(trip => trip.id === tripId);
 return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6"><Link href="/dashboard/trip" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><RiArrowLeftLine className="size-4" />Trip</Link>{!loaded ? <p role="status">Carregando viagem…</p> : !trip ? <p>Viagem não encontrada.</p> : <><h1 className="font-heading text-3xl font-semibold">Trip {trip.code}</h1><TripForm key={trip.id} trip={trip} detailed onClose={() => router.push("/dashboard/trip")} /></>}<div aria-live="polite" className="text-xs text-muted-foreground">{error ? <div role="alert">{error}<Button variant="outline" size="sm" onClick={retryTrips}>Tentar novamente</Button></div> : pending ? "Salvando…" : loaded ? "Salvo no navegador" : "Carregando…"}</div></main>;
}
