import type { Metadata } from "next";
import { FleetPage } from "@/components/fleet/fleet-page";
export const metadata: Metadata = { title: "Fleet | Viniccius" };
export default async function FleetRoute({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) { const { vehicle } = await searchParams; return <FleetPage key={vehicle} initialVehicleId={vehicle} />; }
