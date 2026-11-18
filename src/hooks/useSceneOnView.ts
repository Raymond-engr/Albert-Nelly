"use client";

import { useEffect, useRef } from "react";
import { useScene } from "@/providers/SceneProvider";
import type { SceneId } from "@/types/scene";

/**
 * Attach the returned ref to any element. When it crosses the middle of the
 * viewport, the Stage switches to `scene`. Pass dim to calm the Stage (Selected Work).
 */
export function useSceneOnView<T extends HTMLElement>(scene: SceneId, opts: { dim?: boolean; onEnter?: () => void } = {}) {
  const ref = useRef<T>(null);
  const { setScene } = useScene();
  const { dim = false, onEnter } = opts;
  const cb = useRef(onEnter);
  useEffect(() => {
    cb.current = onEnter;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setScene(scene, dim);
            cb.current?.();
          }
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scene, dim, setScene]);

  return ref;
}
