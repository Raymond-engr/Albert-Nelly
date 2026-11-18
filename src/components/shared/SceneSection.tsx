"use client";

import type { ReactNode } from "react";
import { useSceneOnView } from "@/hooks/useSceneOnView";
import type { SceneId } from "@/types/scene";

type Props = { scene: SceneId; dim?: boolean; id?: string; className?: string; children: ReactNode };

/** A <section> that tells the Stage which scene to show while it is mid-screen. */
export function SceneSection({ scene, dim, id, className, children }: Props) {
  const ref = useSceneOnView<HTMLElement>(scene, { dim });
  return (
    <section ref={ref} id={id} className={className} data-scene={scene}>
      {children}
    </section>
  );
}
