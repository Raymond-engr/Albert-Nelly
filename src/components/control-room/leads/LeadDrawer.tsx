"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { dayMonth, LEAD_TYPE_LABEL, longDate } from "@/lib/control-room/format";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/control-room/labels";
import { leadsApi } from "@/lib/control-room/leads-api";
import { can } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import type { Lead, LeadStatus } from "@/lib/control-room/types";
import { NewDealModal } from "../deals/NewDealModal";
import { Field, inputCls } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Overlay } from "../ui/Overlay";
import { Avatar, Badge, btn } from "../ui/kit";

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex justify-between gap-4 py-2 text-[15px]"><dt className="text-ink/70">{label}</dt><dd className="m-0 text-right font-medium">{children}</dd></div>
);

function LeadForm({ lead, onConvert, onPromoteReferrer }: { lead: Lead; onConvert: () => void; onPromoteReferrer: () => void }) {
  const db = useDb();
  const staff = useSession();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [ownerId, setOwnerId] = useState(lead.ownerId ?? "");
  const [tags, setTags] = useState(lead.tags.join(", "));
  const [notes, setNotes] = useState(lead.notes);
  if (!staff) return null;

  const canEdit = can(staff.role, "leads", "edit");
  const canDeal = can(staff.role, "deals", "edit") && lead.type === "hire" && !lead.dealId;
  const canPromote = can(staff.role, "referrers", "edit") && lead.type === "refer";
  const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
  const dirty = status !== lead.status || ownerId !== (lead.ownerId ?? "") || notes !== lead.notes || parsedTags.join("|") !== lead.tags.join("|");
  const interest = [lead.context, lead.service].filter((x, i, a) => x && a.indexOf(x) === i).join(", ");

  const save = async () => {
    await leadsApi.update(lead.id, { status, ownerId: ownerId || null, notes, tags: parsedTags });
    toast("Lead saved.");
  };
  const toggleArchive = async () => {
    const next: LeadStatus = lead.status === "archived" ? "new" : "archived";
    await leadsApi.update(lead.id, { status: next });
    toast(next === "archived" ? "Lead archived." : "Lead restored.");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Avatar name={lead.name} size={48} />
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-bold">{lead.name}</div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink/70">
            <Badge tone="green">{LEAD_TYPE_LABEL[lead.type]}</Badge>
            <span>Joined {longDate(lead.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {lead.whatsapp && (
          <a className={btn("outline", "sm")} href={`https://wa.me/${lead.whatsapp}`} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={16} /> <span className="ml-1.5">WhatsApp</span></a>
        )}
        <a className={btn("outline", "sm")} href={`mailto:${lead.email}`}><Icon name="mail" size={16} /> <span className="ml-1.5">Email</span></a>
      </div>

      <dl className="m-0 divide-y divide-line rounded-xl border border-line px-4">
        <Row label="Email">{lead.email}</Row>
        {lead.whatsapp && <Row label="WhatsApp">+{lead.whatsapp}</Row>}
        {interest && <Row label="Interested in">{interest}</Row>}
        <Row label="Came from">{lead.source}</Row>
        {lead.business && <Row label="Business">{lead.business}{lead.category ? `, ${lead.category}` : ""}</Row>}
        {lead.birthDay && lead.birthMonth && <Row label="Birthday">{dayMonth(lead.birthDay, lead.birthMonth)}</Row>}
      </dl>

      <Field id="lead-status" label="Status">
        {lead.dealId ? (
          <div className="flex items-center gap-3"><Badge tone={LEAD_STATUS_TONE.deal}>{LEAD_STATUS_LABEL.deal}</Badge><Link className="text-sm font-semibold" href={`/control-room/deals/${lead.dealId}`}>Open the deal</Link></div>
        ) : (
          <select id="lead-status" className={inputCls} value={status} disabled={!canEdit} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
            {(["new", "contacted", "archived"] as const).map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
          </select>
        )}
      </Field>
      <Field id="lead-owner" label="Looked after by">
        <select id="lead-owner" className={inputCls} value={ownerId} disabled={!canEdit} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">Nobody yet</option>
          {db.staff.filter((s) => s.status === "active").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field id="lead-tags" label="Tags" hint="Separate tags with commas.">
        <input id="lead-tags" className={inputCls} value={tags} disabled={!canEdit} onChange={(e) => setTags(e.target.value)} placeholder="school, urgent" />
      </Field>
      <Field id="lead-notes" label="Notes">
        <textarea id="lead-notes" rows={4} className={`${inputCls} py-2.5`} value={notes} disabled={!canEdit} onChange={(e) => setNotes(e.target.value)} placeholder="What did they ask for? What happens next?" />
      </Field>

      {!canEdit && <div className="rounded-xl bg-sun/20 p-3 text-sm">Your role can view leads but not change them.</div>}
      {lead.type !== "hire" && <div className="text-sm text-ink/70">This is a {lead.type === "refer" ? "referrer" : lead.type === "partner" ? "partner" : "newsletter"} lead, not a client. {lead.type === "refer" && <Link href="/control-room/referrers">Open Referrers</Link>}{lead.type === "partner" && <Link href="/control-room/partners">Open Partners</Link>}</div>}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        {canEdit && <button type="button" className={btn("brand")} disabled={!dirty} onClick={save}>Save changes</button>}
        {canDeal && <button type="button" className={btn("dark")} onClick={onConvert}>Turn into a deal</button>}
        {canPromote && <button type="button" className={btn("brand")} onClick={onPromoteReferrer}>Turn into a referrer</button>}
        {canEdit && !lead.dealId && <button type="button" className={btn("ghost")} onClick={toggleArchive}>{lead.status === "archived" ? "Restore" : "Archive"}</button>}
      </div>
    </div>
  );
}

/** Modal to promote a referrer lead to an active referrer with commission rate */
function PromoteReferrerModal({ lead, open, onClose }: { lead: Lead | null; open: boolean; onClose: () => void }) {
  const db = useDb();
  const [rate, setRate] = useState(String(db.settings.commissionMin || 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lead) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = Number(rate);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setError("Enter a percentage between 0 and 100.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await leadsApi.convertToReferrer(lead.id, pct);
      toast("Promoted to referrer.");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to promote referrer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay open={open} onClose={onClose} variant="modal" title="Promote to referrer">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-ink/70">
          This will onboard <span className="font-semibold text-ink">{lead.name}</span> as an active referrer using their email ({lead.email}) and WhatsApp number ({lead.whatsapp || "none"}).
        </p>
        <Field id="prom-rate" label="Agreed commission percentage" error={error || undefined} hint={`Standard range: ${db.settings.commissionMin} to ${db.settings.commissionMax} percent.`}>
          <input
            id="prom-rate"
            inputMode="decimal"
            className={inputCls}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btn("ghost")} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className={btn("brand")} disabled={saving}>
            {saving ? "Promoting..." : "Confirm and onboard"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

/** Detail view of one lead, opened from the list. The "Turn into a deal" modal sits outside the drawer on purpose. */
export function LeadDrawer({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const db = useDb();
  const [converting, setConverting] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const lead = leadId ? db.leads.find((l) => l.id === leadId) ?? null : null;
  return (
    <>
      <Overlay open={!!lead && !converting && !promoting} onClose={onClose} title={lead?.name ?? "Lead"}>
        {lead && (
          <LeadForm
            key={lead.id}
            lead={lead}
            onConvert={() => setConverting(true)}
            onPromoteReferrer={() => setPromoting(true)}
          />
        )}
      </Overlay>
      <NewDealModal open={!!lead && converting} onClose={() => setConverting(false)} lead={lead} />
      <PromoteReferrerModal lead={lead} open={!!lead && promoting} onClose={() => setPromoting(false)} />
    </>
  );
}
