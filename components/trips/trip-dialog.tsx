"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Trip } from "@/lib/trips/store";
import { TripForm } from "./trip-form";
export function TripDialog({ trip, onClose }: { trip?: Trip; onClose: () => void }) {
 return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="sm:max-w-5xl"><DialogTitle>{trip ? "Edit trip" : "New trip"}</DialogTitle><TripForm trip={trip} onClose={onClose} /></DialogContent></Dialog>;
}
