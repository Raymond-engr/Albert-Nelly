import { OPEN_STAGES, type Deal, type DealStage, type Lead, type Payment } from "./types";

/** Read-only calculations for the screens. TODO(integration): move heavy ones to SQL views or server code. */

const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function monthTotals(payments: Payment[]) {
  const now = new Date();
  let inn = 0;
  let out = 0;
  for (const p of payments) {
    if (!sameMonth(new Date(p.date), now)) continue;
    if (p.direction === "in") inn += p.amount;
    else out += p.amount;
  }
  return { in: inn, out, net: inn - out };
}

/** The last `months` calendar months, oldest first. */
export function moneyByMonth(payments: Payment[], months = 6) {
  const now = new Date();
  return Array.from({ length: months }, (_, k) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - k), 1);
    let inn = 0;
    let out = 0;
    for (const p of payments) {
      if (!sameMonth(new Date(p.date), start)) continue;
      if (p.direction === "in") inn += p.amount;
      else out += p.amount;
    }
    return { label: start.toLocaleDateString("en-GB", { month: "short" }), in: inn, out };
  });
}

export const newLeadsSince = (leads: Lead[], days: number) => {
  const cutoff = Date.now() - days * 86_400_000;
  return leads.filter((l) => new Date(l.createdAt).getTime() >= cutoff && l.status !== "archived");
};

/** Leads with a birthday in the next `days` days (today included), soonest first. */
export function upcomingBirthdays(leads: Lead[], days = 30) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const out: { lead: Lead; inDays: number }[] = [];
  for (const l of leads) {
    if (!l.birthDay || !l.birthMonth || l.status === "archived") continue;
    const next = new Date(today.getFullYear(), l.birthMonth - 1, l.birthDay);
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    const inDays = Math.round((next.getTime() - today.getTime()) / 86_400_000);
    if (inDays <= days) out.push({ lead: l, inDays });
  }
  return out.sort((a, b) => a.inDays - b.inDays);
}

export const openDeals = (deals: Deal[]) => deals.filter((d) => OPEN_STAGES.includes(d.stage));
export const dealsInStages = (deals: Deal[], stages: DealStage[]) => deals.filter((d) => stages.includes(d.stage));

/** What has been paid, what is left, and what is owed to the referrer. */
export function dealBalance(deal: Deal, payments: Payment[]) {
  const own = payments.filter((p) => p.dealId === deal.id);
  const received = own.filter((p) => p.direction === "in").reduce((n, p) => n + p.amount, 0);
  const commissionPaid = own.filter((p) => p.direction === "out" && p.category === "commission").reduce((n, p) => n + p.amount, 0);
  const finished = deal.stage === "delivered" || deal.stage === "closed";
  const commissionDue = deal.referrerId && deal.commissionRate && finished ? Math.round((deal.agreed * deal.commissionRate) / 100) : 0;
  return {
    received,
    remaining: Math.max(0, deal.agreed - received),
    commissionDue,
    commissionPaid,
    commissionOwed: Math.max(0, commissionDue - commissionPaid),
  };
}
