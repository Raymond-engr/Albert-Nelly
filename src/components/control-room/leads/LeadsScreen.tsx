"use client";

import { useState } from "react";
import { LEAD_TYPE_LABEL, timeAgo } from "@/lib/control-room/format";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/control-room/labels";
import { useDb, useSession } from "@/lib/control-room/store";
import type { Lead, LeadStatus, LeadType } from "@/lib/control-room/types";
import { inputCls } from "../ui/Field";
import { Avatar, Badge, Card, EmptyState, PageHeader, type Tone } from "../ui/kit";
import { SearchBox } from "../ui/SearchBox";
import { Segmented } from "../ui/Segmented";
import { LeadDrawer } from "./LeadDrawer";

type StatusFilter = "active" | "all" | LeadStatus;
const TYPE_TONE: Record<LeadType, Tone> = { hire: "green", refer: "sun", partner: "neutral", update: "neutral" };
const COLS = "md:grid md:grid-cols-[minmax(0,2fr)_88px_minmax(0,1.4fr)_minmax(0,1fr)_104px_92px]";

const matches = (l: Lead, needle: string) =>
  !needle || [l.name, l.email, l.business, l.context, l.service, l.whatsapp, l.source].some((x) => x?.toLowerCase().includes(needle));

/**
 * Everyone who filled in the registration form. A row opens the detail drawer.
 * TODO(integration): load leads from the `leads` table (server component), filter and page on the server
 * (query string: ?type=&status=&q=&page=), and subscribe to realtime inserts to show new rows.
 */
export function LeadsScreen({ initialLeadId }: { initialLeadId?: string }) {
  const db = useDb();
  const staff = useSession();
  const [q, setQ] = useState("");
  const [type, setType] = useState<LeadType | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [openId, setOpenId] = useState<string | null>(initialLeadId ?? null);
  if (!staff) return null;

  const needle = q.trim().toLowerCase();
  const base = db.leads.filter((l) => (status === "all" ? true : status === "active" ? l.status !== "archived" : l.status === status) && matches(l, needle));
  const list = base.filter((l) => type === "all" || l.type === type).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = (t: LeadType | "all") => base.filter((l) => t === "all" || l.type === t).length;

  return (
    <>
      <PageHeader title="Leads" description="Everyone who filled in the form on the site. Open a row to read the details and take action." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72"><SearchBox label="Search leads" placeholder="Search by name, email or service" value={q} onChange={setQ} /></div>
        <select aria-label="Status" className={`${inputCls} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="active">Active leads</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="deal">In a deal</option>
          <option value="archived">Archived</option>
          <option value="all">All leads</option>
        </select>
      </div>
      <div className="mb-4 overflow-x-auto">
        <Segmented<LeadType | "all">
          label="Lead type"
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "All", count: count("all") },
            { value: "hire", label: "Hire", count: count("hire") },
            { value: "refer", label: "Referrers", count: count("refer") },
            { value: "partner", label: "Partners", count: count("partner") },
            { value: "update", label: "Updates", count: count("update") },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <EmptyState icon="users" title="No leads match">Try a different search or filter.</EmptyState>
      ) : (
        <Card pad={false}>
          <div className={`hidden border-b border-line px-4 py-2.5 text-xs font-semibold text-ink/60 ${COLS}`}>
            <span>Name</span><span>Type</span><span>Interested in</span><span>Came from</span><span>Status</span><span>Joined</span>
          </div>
          <ul className="m-0 list-none divide-y divide-line p-0">
            {list.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => setOpenId(l.id)} className={`flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left hover:bg-mint/50 ${COLS} md:items-center`}>
                  <span className="flex min-w-0 basis-full items-center gap-3 md:basis-auto">
                    <Avatar name={l.name} />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium">{l.name}</span>
                      <span className="block truncate text-sm text-ink/70">{l.email}</span>
                    </span>
                  </span>
                  <span><Badge tone={TYPE_TONE[l.type]}>{LEAD_TYPE_LABEL[l.type]}</Badge></span>
                  <span className="hidden min-w-0 truncate text-[15px] md:block">{l.context ?? l.service ?? "—"}</span>
                  <span className="hidden min-w-0 truncate text-[15px] md:block">{l.source}</span>
                  <span><Badge tone={LEAD_STATUS_TONE[l.status]}>{LEAD_STATUS_LABEL[l.status]}</Badge></span>
                  <span className="text-xs text-ink/70">{timeAgo(l.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <LeadDrawer leadId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
