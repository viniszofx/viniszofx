import { attachmentId } from "@/lib/notes/types";
export function noteFileResource(href: string) {
  const id = attachmentId(href);
  return id ? { id } : null;
}
