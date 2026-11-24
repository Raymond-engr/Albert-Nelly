"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { compactNaira, naira } from "@/lib/control-room/format";
import { STAGE_TONE } from "@/lib/control-room/labels";
import { dealBalance, openDeals } from "@/lib/control-room/metrics";
import { can, canSeeMoney } from "@/lib/control-room/roles";
import { dealsApi } from "@/lib/control-room/deals-api";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import { DEAL_COLUMNS, DEAL_STAGE_LABEL, type Deal, type DealStage } from "@/lib/control-room/types";
import { Icon } from "../ui/Icon";
import { Avatar, Badge, btn, EmptyState, PageHeader, Stat } from "../ui/kit";
import { SearchBox } from "../ui/SearchBox";
import { NewDealModal } from "./NewDealModal";

const STAGES = Object.keys(DEAL_STAGE_LABEL) as DealStage[];

function DealCard({ deal, owner, referrer, paid, canEdit, dragging, moving, onDragStart, onDragEnd, onMove }: {
  deal: Deal; owner: string; referrer: string | null; paid: number | null; canEdit: boolean; dragging: boolean; moving: boolean;
  onDragStart: () => void; onDragEnd: () => void; onMove: (s: DealStage) => void;
}) {
  const pct = paid !== null && deal.agreed > 0 ? Math.min(100, Math.round((paid / deal.agreed) * 100)) : null;
  return (
    <li
      draggable={canEdit && !moving}
      aria-busy={moving}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", deal.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`rounded-xl border border-line bg-card p-3 ${canEdit ? "cursor-grab" : ""} ${dragging ? "opacity-50" : ""}`}
    >
      <Link href={`/control-room/deals/${deal.id}`} draggable={false} className="block text-ink no-underline">
        <div className="text-[15px] leading-snug font-semibold">{deal.title}</div>
        <div className="text-sm text-ink/70">{deal.client}</div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{deal.agreed ? naira(deal.agreed) : "No price yet"}</span>
          {(deal.stage === "closed" || deal.stage === "lost") && <Badge tone={STAGE_TONE[deal.stage]}>{DEAL_STAGE_LABEL[deal.stage]}</Badge>}
        </div>
        {pct !== null && (
          <div className="mt-2" role="progressbar" aria-label="Paid so far" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="h-1.5 rounded-full bg-mint"><div className="h-1.5 rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
            <div className="mt-1 text-xs text-ink/70">{pct}% paid</div>
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink/70">
          <Avatar name={owner} size={22} />
          <span className="truncate">{owner}</span>
          {referrer && <Badge tone="sun">via {referrer}</Badge>}
        </div>
      </Link>
      {moving && <div role="status" className="mt-2 text-xs text-ink/70">Updating stage…</div>}
      {canEdit && (
        <select
          aria-label={`Move ${deal.title} to another stage`}
          value={deal.stage}
          disabled={moving}
          onChange={(e) => onMove(e.target.value as DealStage)}
          className="sr-only mt-2 w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-sm text-ink focus:not-sr-only pointer-coarse:not-sr-only"
        >
          {STAGES.map((s) => <option key={s} value={s}>{DEAL_STAGE_LABEL[s]}</option>)}
        </select>
      )}
    </li>
  );
}

/**
 * The pipeline. Drag a card to another column with a mouse; use the stage select (it appears on keyboard focus and
 * on touch screens) or the deal page otherwise.
 * TODO(integration): load deals + referrers + owners with one query, and call POST /api/control-room/deals/:id/stage on drop.
 */
export function DealsBoard() {
  const db = useDb();
  const staff = useSession();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [movingIds, setMovingIds] = useState<string[]>([]);
  if (!staff) return null;

  const canEdit = can(staff.role, "deals", "edit");
  const money = canSeeMoney(staff.role);
  const needle = q.trim().toLowerCase();
  const visible = db.deals.filter((d) => !needle || [d.title, d.client, d.service].some((x) => x.toLowerCase().includes(needle)));
  const open = openDeals(db.deals);
  const collect = db.deals
    .filter((d) => d.stage !== "closed" && d.stage !== "lost")
    .reduce((n, d) => n + dealBalance(d, db.payments).remaining, 0);
  const owed = db.deals.reduce((n, d) => n + dealBalance(d, db.payments).commissionOwed, 0);

  const move = async (id: string, stage: DealStage) => {
    const d = db.deals.find((x) => x.id === id);
    if (!d || d.stage === stage || movingIds.includes(id)) return;
    setMovingIds((ids) => [...ids, id]);
    try {
      await dealsApi.move(id, stage);
      toast(`Moved to ${DEAL_STAGE_LABEL[stage]}.`);
    } finally {
      setMovingIds((ids) => ids.filter((movingId) => movingId !== id));
    }
  };
  const drop = (stages: DealStage[]) => {
    const d = db.deals.find((x) => x.id === dragId);
    setOver(null);
    setDragId(null);
    if (d && !stages.includes(d.stage)) void move(d.id, stages[0]);
  };

  return (
    <>
      <PageHeader
        title="Deals"
        description="Move a deal across the board as the conversation moves forward."
        actions={canEdit ? <button type="button" className={btn("brand")} onClick={() => setCreating(true)}><Icon name="plus" size={18} /> <span className="ml-1.5">New deal</span></button> : undefined}
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open deals" value={String(open.length)} hint="Not yet delivered" icon="board" />
        <Stat label="Pipeline value" value={compactNaira(open.reduce((n, d) => n + d.agreed, 0))} hint="Agreed price of open deals" icon="tag" />
        {money && <Stat label="Still to collect" value={compactNaira(collect)} hint="Agreed minus received" icon="arrowDown" />}
        {money && <Stat label="Commission owed" value={compactNaira(owed)} hint="To referrers" icon="share" href="/control-room/referrers" />}
      </div>
      <div className="mb-4 w-full sm:w-80"><SearchBox label="Search deals" placeholder="Search by deal, client or service" value={q} onChange={setQ} /></div>

      {db.deals.length === 0 ? (
        <EmptyState icon="board" title="No deals yet">Turn a lead into a deal, or start one from here.</EmptyState>
      ) : (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
          {DEAL_COLUMNS.map((col) => {
            const list = visible.filter((d) => col.stages.includes(d.stage));
            const total = list.reduce((n, d) => n + d.agreed, 0);
            return (
              <section
                key={col.id}
                aria-label={col.label}
                onDragOver={(e) => { if (canEdit && dragId) { e.preventDefault(); setOver(col.id); } }}
                onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
                onDrop={(e) => { e.preventDefault(); drop(col.stages); }}
                className={`w-[280px] shrink-0 snap-start rounded-2xl border bg-mint/40 p-3 ${over === col.id ? "border-brand ring-2 ring-brand" : "border-line"}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <h2 className="mb-0 font-display text-sm font-semibold tracking-normal">{col.label} <span className="ml-1 font-sans text-ink/70">{list.length}</span></h2>
                  {total > 0 && <span className="text-xs text-ink/70">{compactNaira(total)}</span>}
                </div>
                <ul className="m-0 flex min-h-16 list-none flex-col gap-2 p-0">
                  {list.length === 0 && <li className="px-1 py-3 text-sm text-ink/60">{dragId ? "Drop a deal here" : "No deals"}</li>}
                  {list.map((d) => {
                    const bal = money ? dealBalance(d, db.payments) : null;
                    return (
                      <DealCard
                        key={d.id}
                        deal={d}
                        owner={db.staff.find((s) => s.id === d.ownerId)?.name ?? "Unassigned"}
                        referrer={db.referrers.find((r) => r.id === d.referrerId)?.name ?? null}
                        paid={bal ? bal.received : null}
                        canEdit={canEdit}
                        dragging={dragId === d.id}
                        moving={movingIds.includes(d.id)}
                        onDragStart={() => setDragId(d.id)}
                        onDragEnd={() => { setDragId(null); setOver(null); }}
                        onMove={(s) => void move(d.id, s)}
                      />
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      <NewDealModal open={creating} onClose={() => setCreating(false)} onCreated={(d) => router.push(`/control-room/deals/${d.id}`)} />
    </>
  );
}
