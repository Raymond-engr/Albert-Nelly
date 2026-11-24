"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { naira, plural } from "@/lib/control-room/format";
import { STAGE_TONE } from "@/lib/control-room/labels";
import { referrersApi } from "@/lib/control-room/content-api";
import { dealBalance } from "@/lib/control-room/metrics";
import { can, canSeeMoney } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import { emailOk, waOk } from "@/lib/control-room/validate";
import { DEAL_STAGE_LABEL, type Referrer } from "@/lib/control-room/types";
import { Field, inputCls } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Overlay } from "../ui/Overlay";
import { Avatar, Badge, btn, Card, EmptyState, PageHeader, Stat } from "../ui/kit";

function ReferrerForm({ item, canEdit, onClose }: { item: Referrer | null; canEdit: boolean; onClose?: () => void }) {
  const db = useDb();
  const [name, setName] = useState(item?.name ?? "");
  const [email, setEmail] = useState(item?.email ?? "");
  const [whatsapp, setWhatsapp] = useState(item?.whatsapp ?? "");
  const [rate, setRate] = useState(item ? String(item.rate) : String(db.settings.commissionMin));
  const [status, setStatus] = useState<Referrer["status"]>(item?.status ?? "active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { commissionMin, commissionMax } = db.settings;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const pct = Number(rate);
    if (name.trim().length < 2) next.name = "Enter the referrer’s name.";
    if (!emailOk(email)) next.email = "That email looks incomplete. Check the @ and the dot.";
    if (!waOk(whatsapp)) next.whatsapp = "Enter the number with country code, digits only, for example 2348031234567.";
    if (rate.trim() === "" || Number.isNaN(pct) || pct < 0 || pct > 100) next.rate = "Enter a percentage between 0 and 100.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const data = { name: name.trim(), email: email.trim().toLowerCase(), whatsapp: whatsapp.replace(/\D/g, ""), rate: pct, status };
    if (item) await referrersApi.update(item.id, data);
    else await referrersApi.create(data);
    toast(item ? "Referrer saved." : "Referrer added.");
    onClose?.();
  };

  const pct = Number(rate);
  const outside = rate.trim() !== "" && !Number.isNaN(pct) && (pct < commissionMin || pct > commissionMax);
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="r-name" label="Name" error={errors.name}><input id="r-name" className={inputCls} value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} /></Field>
      <Field id="r-email" label="Email" error={errors.email}><input id="r-email" type="email" className={inputCls} value={email} disabled={!canEdit} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} /></Field>
      <Field id="r-wa" label="WhatsApp number" error={errors.whatsapp}><input id="r-wa" inputMode="tel" className={inputCls} value={whatsapp} disabled={!canEdit} onChange={(e) => setWhatsapp(e.target.value)} aria-invalid={!!errors.whatsapp} /></Field>
      <Field id="r-rate" label="Usual commission (percent)" error={errors.rate} hint={outside ? `Outside the usual ${commissionMin} to ${commissionMax} percent. You can still save it.` : `Usual range: ${commissionMin} to ${commissionMax} percent. Each deal can override it.`}>
        <input id="r-rate" inputMode="decimal" className={inputCls} value={rate} disabled={!canEdit} onChange={(e) => setRate(e.target.value)} aria-invalid={!!errors.rate} />
      </Field>
      <Field id="r-status" label="Status">
        <select id="r-status" className={inputCls} value={status} disabled={!canEdit} onChange={(e) => setStatus(e.target.value as Referrer["status"])}><option value="active">Active</option><option value="paused">Paused</option></select>
      </Field>
      {canEdit && <div className="flex justify-end gap-2">{onClose && <button type="button" className={btn("ghost")} onClick={onClose}>Cancel</button>}<button type="submit" className={btn("brand")}>{item ? "Save referrer" : "Add referrer"}</button></div>}
    </form>
  );
}

function ReferrerDetail({ referrer, canEdit, money }: { referrer: Referrer; canEdit: boolean; money: boolean }) {
  const db = useDb();
  const deals = db.deals.filter((d) => d.referrerId === referrer.id);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <a className={btn("outline", "sm")} href={`https://wa.me/${referrer.whatsapp}`} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={16} /> <span className="ml-1.5">WhatsApp</span></a>
        <a className={btn("outline", "sm")} href={`mailto:${referrer.email}`}><Icon name="mail" size={16} /> <span className="ml-1.5">Email</span></a>
      </div>
      <ReferrerForm key={referrer.id} item={referrer} canEdit={canEdit} />
      <div className="border-t border-line pt-4">
        <h3 className="mb-2 font-display text-base font-semibold">Deals they introduced</h3>
        {deals.length === 0 ? <div className="text-sm text-ink/70">No deals yet.</div> : (
          <ul className="m-0 list-none divide-y divide-line p-0">
            {deals.map((d) => {
              const bal = dealBalance(d, db.payments);
              return (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/control-room/deals/${d.id}`} className="block truncate text-[15px] font-semibold">{d.title}</Link>
                    <div className="text-sm text-ink/70">{d.agreed ? naira(d.agreed) : "No price yet"}{money && bal.commissionOwed > 0 ? `, ${naira(bal.commissionOwed)} owed` : ""}</div>
                  </div>
                  <Badge tone={STAGE_TONE[d.stage]}>{DEAL_STAGE_LABEL[d.stage]}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * People who introduce clients and earn a share when the deal closes.
 * Commission amounts are for Owner and Finance only. TODO(integration): `referrers` table; each lead of type "refer"
 * can be turned into a referrer with one click, and the referral link (?ref=<id>) is recorded on new leads.
 */
export function ReferrersScreen() {
  const db = useDb();
  const staff = useSession();
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  if (!staff) return null;

  const canEdit = can(staff.role, "referrers", "edit");
  const money = canSeeMoney(staff.role);
  const owed = (id: string) => db.deals.filter((d) => d.referrerId === id).reduce((n, d) => n + dealBalance(d, db.payments).commissionOwed, 0);
  const viaReferrers = db.deals.filter((d) => d.referrerId);
  const open = db.referrers.find((r) => r.id === openId) ?? null;

  return (
    <>
      <PageHeader title="Referrers" description="People who introduce clients and earn a share when the deal closes." actions={canEdit ? <button type="button" className={btn("brand")} onClick={() => setAdding(true)}><Icon name="plus" size={18} /> <span className="ml-1.5">Add referrer</span></button> : undefined} />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Active referrers" value={String(db.referrers.filter((r) => r.status === "active").length)} hint={`Of ${db.referrers.length} in total`} icon="share" />
        <Stat label="Deals introduced" value={String(viaReferrers.length)} hint="All time" icon="board" />
        {money && <Stat label="Commission owed" value={naira(db.deals.reduce((n, d) => n + dealBalance(d, db.payments).commissionOwed, 0))} hint="Across all referrers" icon="arrowUp" />}
      </div>
      {db.referrers.length === 0 ? (
        <EmptyState icon="share" title="No referrers yet">Add one, or turn a referrer lead into a referrer.</EmptyState>
      ) : (
        <Card pad={false}>
          <ul className="m-0 list-none divide-y divide-line p-0">
            {db.referrers.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => setOpenId(r.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left hover:bg-mint/50">
                  <span className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                    <Avatar name={r.name} />
                    <span className="min-w-0"><span className="block truncate text-[15px] font-medium">{r.name}</span><span className="block truncate text-sm text-ink/70">{r.email}</span></span>
                  </span>
                  <span className="text-sm">{r.rate} percent</span>
                  <span className="text-sm text-ink/70">{plural(db.deals.filter((d) => d.referrerId === r.id).length, "deal")}</span>
                  {money && <span className="text-sm font-semibold">{owed(r.id) > 0 ? `${naira(owed(r.id))} owed` : "Nothing owed"}</span>}
                  <Badge tone={r.status === "active" ? "green" : "neutral"}>{r.status === "active" ? "Active" : "Paused"}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Overlay open={!!open} onClose={() => setOpenId(null)} title={open?.name ?? "Referrer"}>
        {open && <ReferrerDetail referrer={open} canEdit={canEdit} money={money} />}
      </Overlay>
      <Overlay open={adding} onClose={() => setAdding(false)} variant="modal" title="Add a referrer">
        <ReferrerForm item={null} canEdit onClose={() => setAdding(false)} />
      </Overlay>
    </>
  );
}
