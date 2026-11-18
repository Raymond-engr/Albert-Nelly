"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { SceneId } from "@/types/scene";

type SceneCtx = { scene: SceneId; dim: boolean; setScene: (scene: SceneId, dim?: boolean) => void };
const Ctx = createContext<SceneCtx | null>(null);

export function SceneProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ scene: SceneId; dim: boolean }>({ scene: "cv", dim: false });
  const setScene = useCallback((scene: SceneId, dim = false) => setState({ scene, dim }), []);
  const value = useMemo(() => ({ ...state, setScene }), [state, setScene]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useScene(): SceneCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useScene must be used inside <SceneProvider> (the Showroom renders it).");
  return ctx;
}
