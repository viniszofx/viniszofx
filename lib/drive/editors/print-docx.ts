"use client";

// DOCX printing without a server: the editor engine paints every page in a hidden iframe
// (see docx-frame.ts) and the browser's print dialog prints it.
import { openDocxFrame } from "./docx-frame";

export async function printDocx(file: Blob, title: string) {
  const frame = await openDocxFrame(file, title);
  try {
    await new Promise<void>(resolve => {
      frame.window.addEventListener("afterprint", () => resolve(), { once: true });
      // Some browsers block until the dialog closes and never fire afterprint.
      setTimeout(resolve, 60_000);
      frame.window.focus(); frame.window.print();
    });
  } finally {
    frame.dispose();
  }
}
