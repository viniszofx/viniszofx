import type { Metadata } from "next";
import { TripPage } from "@/components/trips/trip-page";
export const metadata: Metadata = { title: "Trip | Viniccius" };
export default async function TripRoute({ params }: { params: Promise<{ tripId: string }> }) { const { tripId } = await params;return <TripPage tripId={tripId} />; }
