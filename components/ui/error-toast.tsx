"use client";
import { useEffect } from "react";
import { notifyError } from "@/lib/ui/notifications";

type ErrorValue = string | { message?: string } | null | undefined | false;

/** Shows `message` as an error toast whenever it changes; renders nothing. */
export function ErrorToast({ message }: { message?: ErrorValue }) {
  const text = typeof message === "string" ? message : message ? message.message ?? "" : "";
  useEffect(() => { if (text) notifyError(text); }, [text]);
  return null;
}
