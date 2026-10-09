"use client";

import type { ComponentProps } from "react";
import { useAttachment } from "./use-attachment";

export function LocalImage({ src, alt, ...props }: Omit<ComponentProps<"img">, "src"> & { src?: string }) {
  const image = useAttachment(src);
  if (image.error) return <span className="text-xs text-muted-foreground">{image.error}</span>;
  // Local blobs and external note images have dynamic dimensions and cannot use Next's optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} src={image.url} alt={alt ?? ""} />;
}
