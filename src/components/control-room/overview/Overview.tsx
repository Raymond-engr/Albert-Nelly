"use client";

import Link from "next/link";
import { compactNaira, dayMonth, firstName, greeting, LEAD_TYPE_LABEL, naira, plural, shortDate, timeAgo } from "@/lib/control-room/format";
import { dealBalance, dealsInStages, moneyByMonth, monthTotals, newLeadsSince, openDeals, upcomingBirthdays } from "@/lib/control-room/metrics";
import { can, canSeeMoney } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { DEAL_COLUMNS, type LeadType } from "@/lib/control-room/types";
import { MoneyBars } from "../charts/MoneyBars";
import { Avatar, Badge, btn, Card, CardHeader, ListRow, PageHeader, Stat, type StatProps, type Tone } from "../ui/kit";

const B = "/control-room";
const TYPE_TONE: Record<LeadType, Tone> = { hire: "green", refer: "sun", partner: "neutral", update: "neutral" };
const Empty = ({ children }: { children: string }) => <div className="py-4 text-sm text-ink/70">{children}</div>;
const More = ({ href, label }: { href: string; label: string }) => <Link href={href} className={btn("ghost", "sm")}>{label}</Link>;

/**
 * The first screen after sign-in. Tiles and cards depend on the role (see roles.ts).
 * TODO(integration): replace useDb() with data loaded on the server (one query per card, or a few SQL views).
 */
export function Overview() {
  const db = useDb();
  const staff = useSession();
  if (!staff) return null;
  const role = staff.role;
  const money = canSeeMoney(role);

  const month = monthTotals(db.payments);
  const fresh = newLeadsSince(db.leads, 7);
  const open = openDeals(db.deals);
  const pipeline = open.reduce((n, d) => n + d.agreed, 0);
  const owed = db.deals.reduce((n, d) => n + dealBalance(d, db.payments).commissionOwed, 0);
  const birthdays = upcomingBirthdays(db.leads, 30);
  const scheduled = db.campaigns.filter((c) => c.status === "scheduled").sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));
  const newest = db.leads.filter((l) => l.status !== "archived").slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const columns = DEAL_COLUMNS.map((c) => ({ ...c, n: dealsInStages(db.deals, c.stages).length }));
  const maxCount = Math.max(1, ...columns.map((c) => c.n));
  const nextSend = scheduled[0]?.scheduledFor;

  const tiles: StatProps[] = [];
  if (can(role, "leads")) tiles.push({ label: "New leads", value: String(fresh.length), hint: "In the last 7 days", icon: "users", href: `${B}/leads` });
  if (can(role, "deals")) tiles.push({ label: "Deals in progress", value: String(open.length), hint: `${compactNaira(pipeline)} agreed`, icon: "board", href: `${B}/deals` });
  if (money) {
    tiles.push(
      { label: "Money in", value: naira(month.in), hint: "This month", icon: "arrowDown" },
      { label: "Money out", value: naira(month.out), hint: "This month", icon: "arrowUp" },
      { label: "Commission owed", value: naira(owed), hint: "To referrers", icon: "share", href: `${B}/referrers` },
    );
  }
  if (can(role, "birthdays")) tiles.push({ label: "Birthdays soon", value: String(birthdays.length), hint: "In the next 30 days", icon: "cake", href: `${B}/birthdays` });
  if (can(role, "campaigns")) {
    tiles.push({ label: "Scheduled campaigns", value: String(scheduled.length), hint: nextSend ? `Next one goes out ${shortDate(nextSend)}` : "Nothing scheduled", icon: "mail", href: `${B}/campaigns` });
  }

  return (
    <>
      <PageHeader title="Overview" description={`${greeting()}, ${firstName(staff.name)}. Here is what needs you today.`} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((t) => <Stat key={t.label} {...t} />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          {can(role, "leads") && (
            <Card>
              <CardHeader title="Newest leads" hint="People who just filled in the form" action={<More href={`${B}/leads`} label="See all" />} />
              <div className="divide-y divide-line">
                {newest.length === 0 && <Empty>No leads yet.</Empty>}
                {newest.map((l) => (
                  <ListRow
                    key={l.id}
                    href={`${B}/leads`}
                    lead={<Avatar name={l.name} />}
                    title={l.name}
                    sub={[LEAD_TYPE_LABEL[l.type], l.context ?? l.service].filter(Boolean).join(", ")}
                    right={<span className="flex flex-col items-end gap-1"><Badge tone={TYPE_TONE[l.type]}>{LEAD_TYPE_LABEL[l.type]}</Badge><span className="text-xs text-ink/70">{timeAgo(l.createdAt)}</span></span>}
                  />
                ))}
              </div>
            </Card>
          )}
          {money && (
            <Card>
              <CardHeader title="Money, last 6 months" hint={`${naira(month.net)} net this month`} />
              <MoneyBars data={moneyByMonth(db.payments, 6)} />
            </Card>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          {can(role, "deals") && (
            <Card>
              <CardHeader title="Deals by stage" action={<More href={`${B}/deals`} label="Open board" />} />
              <ul className="m-0 list-none p-0">
                {columns.map((c) => (
                  <li key={c.id} className="py-1.5">
                    <div className="flex justify-between text-sm"><span>{c.label}</span><span className="font-semibold">{c.n}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-mint"><div className="h-2 rounded-full bg-brand" style={{ width: `${(c.n / maxCount) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {can(role, "birthdays") && (
            <Card>
              <CardHeader title="Upcoming birthdays" hint="Next 30 days" action={<More href={`${B}/birthdays`} label="See all" />} />
              <div className="divide-y divide-line">
                {birthdays.length === 0 && <Empty>No birthdays in the next 30 days.</Empty>}
                {birthdays.slice(0, 5).map(({ lead, inDays }) => (
                  <ListRow
                    key={lead.id}
                    lead={<Avatar name={lead.name} />}
                    title={lead.name}
                    sub={lead.birthDay && lead.birthMonth ? dayMonth(lead.birthDay, lead.birthMonth) : ""}
                    right={<Badge tone={inDays === 0 ? "sun" : "neutral"}>{inDays === 0 ? "Today" : `In ${plural(inDays, "day")}`}</Badge>}
                  />
                ))}
              </div>
            </Card>
          )}
          {can(role, "campaigns") && (
            <Card>
              <CardHeader title="Scheduled campaigns" action={<More href={`${B}/campaigns`} label="See all" />} />
              <div className="divide-y divide-line">
                {scheduled.length === 0 && <Empty>Nothing is scheduled.</Empty>}
                {scheduled.map((c) => (
                  <ListRow key={c.id} title={c.name} sub={`${c.scheduledFor ? shortDate(c.scheduledFor) : ""}, ${plural(c.audienceSize, "person", "people")}`} right={<Badge tone="green">Scheduled</Badge>} />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
