export type Toast = { id: number; text: string; tone: "ok" | "error" };

const EMPTY: Toast[] = [];
let items: Toast[] = EMPTY;
let n = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const toastStore = {
  get: () => items,
  getServer: () => EMPTY,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}
export function toast(text: string, tone: Toast["tone"] = "ok") {
  const t: Toast = { id: ++n, text, tone };
  items = [...items, t];
  emit();
  setTimeout(() => dismiss(t.id), 3500);
}
