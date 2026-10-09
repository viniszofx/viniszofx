import type { Metadata } from "next";
import { TripsPage } from "@/components/trips/trips-page";
export const metadata: Metadata = { title: "Trip | Viniccius" };
export default async function TripRoute({ searchParams }: { searchParams: Promise<{ trip?: string }> }) { const { trip } = await searchParams; return <TripsPage key={trip} initialTripId={trip} />; }
