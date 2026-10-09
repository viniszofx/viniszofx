"use client";
import { createContext, useContext, type ReactNode } from "react";
import { getAttachment } from "@/lib/notes/storage";
import type { StoredAttachment } from "@/lib/notes/types";
export type AttachmentResolver = (id: string) => Promise<StoredAttachment | undefined>;
const AttachmentContext = createContext<AttachmentResolver>(getAttachment);
export function AttachmentProvider({ resolve, children }: { resolve: AttachmentResolver; children: ReactNode }) {
  return <AttachmentContext.Provider value={resolve}>{children}</AttachmentContext.Provider>;
}
export function useAttachmentResolver() { return useContext(AttachmentContext); }
