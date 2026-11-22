"use client";

import { useState } from "react";
import { dayLabel, timeOfDay } from "@/lib/control-room/dates";
import { roleLabel } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import type { Activity } from "@/lib/control-room/types";
import { inputCls } from "../ui/Field";
import { Avatar, btn, Card, EmptyState, PageHeader } from "../ui/kit";
import { SearchBox } from "../ui/SearchBox";

const PAGE = 50;

/**
 * Who did what, newest first. Entries can't be edited or deleted.
 * TODO(integration): `activity_log` is insert-only and written by the server inside the same transaction as each change.
 * Never trust the browser to log its own actions.
 */
export function ActivityScreen() {
  const db = useDb();
  const staff = useSession();
  const [q, setQ] = useState("");
  const [actor, setActor] = useState("all");
  const [shown, setShown] = useState(PAGE);
  if (!staff) return null;

  const needle = q.trim().toLowerCase();
  const all = db.activity.filter((a) => (actor === "all" || a.actorId === actor) && (!needle || `${a.action} ${a.target}`.toLowerCase().includes(needle))).slice().sort((a, b) => b.at.localeCompare(a.at));
  const page = all.slice(0, shown);
  const groups: { label: string; items: Activity[] }[] = [];
  for (const a of page) {
    const label = dayLabel(a.at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(a);
    else groups.push({ label, items: [a] });
  }
  const who = (id: string) => db.staff.find((s) => s.id === id);

  return (
    <>
      <PageHeader title="Activity log" description="Every change, who made it and when. Entries can’t be edited or deleted." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72"><SearchBox label="Search the activity log" placeholder="Search actions and names" value={q} onChange={setQ} /></div>
        <select aria-label="Person" className={`${inputCls} !w-auto`} value={actor} onChange={(e) => setActor(e.target.value)}>
          <option value="all">Everyone</option>
          {db.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {groups.length === 0 ? (
        <EmptyState icon="clock" title="Nothing matches">Try a different search or person.</EmptyState>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <section key={g.label} aria-label={g.label}>
              <h2 className="mb-2 font-display text-sm font-semibold tracking-normal text-ink/70">{g.label}</h2>
              <Card pad={false}>
                <ul className="m-0 list-none divide-y divide-line p-0">
                  {g.items.map((a) => {
                    const p = who(a.actorId);
                    return (
                      <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                        <Avatar name={p?.name ?? "?"} size={32} />
                        <span className="min-w-0 flex-1 text-[15px]"><span className="font-semibold">{p?.name ?? "Unknown"}</span>{p && <span className="text-ink/70"> ({roleLabel(p.role)})</span>}<span> {a.action[0]?.toLowerCase()}{a.action.slice(1)}</span>{a.target && <span className="font-medium">: {a.target}</span>}</span>
                        <span className="text-sm text-ink/70">{timeOfDay(a.at)}</span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          ))}
          {all.length > shown && <div><button type="button" className={btn("outline")} onClick={() => setShown(shown + PAGE)}>Show more</button></div>}
        </div>
      )}
    </>
  );
}
