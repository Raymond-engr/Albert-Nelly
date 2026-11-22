import type { Lead } from "./types";

/**
 * Birthday emails that would already have gone out in the last `days` days.
 * TODO(integration): a real `birthday_sends` table filled by the daily job (see the handover, "Birthdays").
 */
export function birthdayLog(leads: Lead[], days = 45) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: { lead: Lead; date: Date; opened: boolean }[] = [];
  for (const l of leads) {
    if (!l.birthDay || !l.birthMonth || l.status === "archived") continue;
    const last = new Date(today.getFullYear(), l.birthMonth - 1, l.birthDay);
    if (last > today) last.setFullYear(today.getFullYear() - 1);
    const ago = Math.round((today.getTime() - last.getTime()) / 86_400_000);
    if (ago >= 0 && ago <= days) out.push({ lead: l, date: last, opened: l.id.charCodeAt(l.id.length - 1) % 2 === 0 });
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime());
}
