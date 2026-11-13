"use client";

import { useEffect } from "react";
import "./globals.css";
import { ErrorScreen } from "@/components/ui/error-screen";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return <html lang="pt-BR"><body><ErrorScreen onRetry={reset} reference={error.digest} /></body></html>;
}
