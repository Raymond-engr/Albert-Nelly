"use client";

import { useSyncExternalStore } from "react";
import { dismiss, toastStore } from "@/lib/control-room/toast";
import { Icon } from "./Icon";

/** Short confirmation messages at the bottom of the screen. Call toast("Saved.") from lib/control-room/toast. */
export function ToastHost() {
  const items = useSyncExternalStore(toastStore.subscribe, toastStore.get, toastStore.getServer);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-[70] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-4 text-sm text-paper shadow-lg">
          <Icon name={t.tone === "error" ? "x" : "check"} size={16} />
          <span>{t.text}</span>
          <button type="button" className="grid size-8 place-items-center rounded-full hover:bg-paper/15" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
