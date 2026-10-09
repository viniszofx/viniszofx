import type { Metadata } from "next";
import { ReservationsPage } from "@/components/reservations/reservations-page";
export const metadata: Metadata = { title: "Reservations | Viniccius" };
export default async function ReservationsRoute({ searchParams }: { searchParams: Promise<{ reservation?: string }> }) { const { reservation }=await searchParams;return <ReservationsPage key={reservation} initialReservationId={reservation} />; }
