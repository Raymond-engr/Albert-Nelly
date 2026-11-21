import Image from "next/image";
import type { CSSProperties } from "react";
import type { WorkPhoto } from "@/types/content";

/** Width over height. Used for the aspect-ratio of an image frame. */
export const ratio = (p: WorkPhoto) => p.w / p.h;
export const arStyle = (r: number) => ({ "--ar": r }) as CSSProperties;

const isSvg = (p: WorkPhoto) => p.src.endsWith(".svg");

/** Fills its parent, which must be positioned. SVG placeholders skip the image optimiser; real files do not. */
export function Pic({ photo, sizes, top, priority }: { photo: WorkPhoto; sizes: string; top?: boolean; priority?: boolean }) {
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={isSvg(photo)}
      style={{ objectFit: "cover", objectPosition: top ? "top" : "center" }}
    />
  );
}

/** Full width at its own height. Used for the long screenshot inside the browser frame. */
export function Natural({ photo, sizes }: { photo: WorkPhoto; sizes: string }) {
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      width={photo.w}
      height={photo.h}
      sizes={sizes}
      unoptimized={isSvg(photo)}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}
