"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { campaignsApi } from "@/lib/control-room/campaigns-api";
import { plural, shortDate } from "@/lib/control-room/format";
import { can } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { audienceLabel } from "@/lib/control-room/templates";
import type { Campaign } from "@/lib/control-room/types";
import { Icon } from "../ui/Icon";
import { Badge, btn, Card, EmptyState, PageHeader, type Tone } from "../ui/kit";
import { Segmented } from "../ui/Segmented";

type Filter = "all" | Campaign["status"];
const TONE: Record<Campaign["status"], Tone> = { draft: "neutral", scheduled: "sun", sending: "sun", sent: "green", automated: "dark" };
const LABEL: Record<Campaign["status"], string> = { draft: "Draft", scheduled: "Scheduled", sending: "Sending…", sent: "Sent", automated: "Automatic" };
const RANK: Record<Campaign["status"], number> = { sending: 0, scheduled: 1, draft: 2, sent: 3, automated: 4 };
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "0%");

/**
 * Every email campaign: drafts, scheduled sends, sent ones and the automatic emails (welcome, birthday).
 * TODO(integration): `campaigns` table; results fill in from the email provider's webhooks.
 */
export function CampaignsScreen() {
  const db = useDb();
  const staff = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  if (!staff) return null;

  const canEdit = can(staff.role, "campaigns", "edit");
  const list = db.campaigns
    .filter((c) => filter === "all" || c.status === filter)
    .slice()
    .sort((a, b) => RANK[a.status] - RANK[b.status] || (b.scheduledFor ?? b.sentAt ?? "").localeCompare(a.scheduledFor ?? a.sentAt ?? ""));
  const count = (s: Filter) => db.campaigns.filter((c) => s === "all" || c.status === s).length;
  const create = async () => {
    const c = await campaignsApi.create();
    router.push(`/control-room/campaigns/${c.id}`);
  };

  return (
    <>
      <PageHeader title="Campaigns" description="Emails to the people who joined through the site. WhatsApp is for one-to-one chats, not bulk sending." actions={canEdit ? <button type="button" className={btn("brand")} onClick={create}><Icon name="plus" size={18} /> <span className="ml-1.5">New campaign</span></button> : undefined} />
      <div className="mb-4 overflow-x-auto">
        <Segmented<Filter> label="Status" value={filter} onChange={setFilter} options={[{ value: "all", label: "All", count: count("all") }, { value: "draft", label: "Drafts", count: count("draft") }, { value: "scheduled", label: "Scheduled", count: count("scheduled") }, { value: "sent", label: "Sent", count: count("sent") }, { value: "automated", label: "Automatic", count: count("automated") }]} />
      </div>
      {list.length === 0 ? (
        <EmptyState icon="mail" title="No campaigns here">Start a new campaign to email your leads.</EmptyState>
      ) : (
        <Card pad={false}>
          <ul className="m-0 list-none divide-y divide-line p-0">
            {list.map((c) => (
              <li key={c.id}>
                <Link href={`/control-room/campaigns/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-ink no-underline hover:bg-mint/50">
                  <span className="min-w-0 flex-1 basis-60">
                    <span className="block truncate text-[15px] font-semibold">{c.name}</span>
                    <span className="block truncate text-sm text-ink/70">{c.subject || "No subject yet"}</span>
                  </span>
                  <span className="text-sm text-ink/70">{audienceLabel(c.audience)}, {plural(c.audienceSize, "person", "people")}</span>
                  <span className="text-sm">{c.scheduledFor ? `Goes out ${shortDate(c.scheduledFor)}` : c.sentAt ? `Sent ${shortDate(c.sentAt)}` : ""}</span>
                  {c.stats && <span className="text-sm font-semibold">{pct(c.stats.opened, c.stats.delivered)} opened</span>}
                  <Badge tone={TONE[c.status]}>{LABEL[c.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
