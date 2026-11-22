/** Date helpers for the activity log and the campaign scheduler. Kept out of components so they do not call Date during render. */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const t = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(t) - start(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}
export const timeOfDay = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** "2026-12-01" + "09:00" (the visitor's local time) -> an ISO timestamp. */
export const inputsToIso = (date: string, time: string) => new Date(`${date}T${time}`).toISOString();
export function isoToInputs(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
}
export const isFuture = (iso: string) => new Date(iso).getTime() > Date.now();
