"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { naira, shortDate } from "@/lib/control-room/format";
import { PAYMENT_CATEGORY_LABEL, parseNaira, STAGE_TONE } from "@/lib/control-room/labels";
import { dealBalance } from "@/lib/control-room/metrics";
import { can, canSeeMoney } from "@/lib/control-room/roles";
import { dealsApi, type DealPatch } from "@/lib/control-room/deals-api";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import { DEAL_STAGE_LABEL, type Deal, type DealStage } from "@/lib/control-room/types";
import { Field, inputCls } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Badge, btn, Card, CardHeader, EmptyState, PageHeader } from "../ui/kit";
import { RecordPaymentModal, type PaymentSuggestion } from "./RecordPaymentModal";

const STAGES = Object.keys(DEAL_STAGE_LABEL) as DealStage[];

function DealForm({ deal, canEdit, money }: { deal: Deal; canEdit: boolean; money: boolean }) {
  const db = useDb();
  const [title, setTitle] = useState(deal.title);
  const [client, setClient] = useState(deal.client);
  const [service, setService] = useState(deal.service);
  const [agreed, setAgreed] = useState(deal.agreed ? String(deal.agreed) : "");
  const [referrerId, setReferrerId] = useState(deal.referrerId ?? "");
  const [rate, setRate] = useState(deal.commissionRate !== null ? String(deal.commissionRate) : "");
  const [notes, setNotes] = useState(deal.notes);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { commissionMin, commissionMax } = db.settings;
  const pct = rate.trim() === "" ? null : Number(rate);
  const outside = money && !!referrerId && pct !== null && !Number.isNaN(pct) && (pct < commissionMin || pct > commissionMax);
  const serviceNames = db.services.some((s) => s.title === service) ? db.services.map((s) => s.title) : [service, ...db.services.map((s) => s.title)];

  const pickReferrer = (id: string) => {
    setReferrerId(id);
    const r = db.referrers.find((x) => x.id === id);
    if (r && rate.trim() === "") setRate(String(r.rate));
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const price = parseNaira(agreed);
    if (title.trim().length < 3) next.title = "Give the deal a short name.";
    if (client.trim().length < 2) next.client = "Who is the client?";
    if (price === null) next.agreed = "Use numbers only, for example 250000.";
    if (money && referrerId && (pct === null || Number.isNaN(pct) || pct < 0 || pct > 100)) next.rate = "Enter a percentage between 0 and 100.";
    setErrors(next);
    if (Object.keys(next).length || price === null) return;
    const patch: DealPatch = { title: title.trim(), client: client.trim(), service, agreed: price, referrerId: referrerId || null, notes };
    if (money) patch.commissionRate = referrerId ? pct : null;
    await dealsApi.update(deal.id, patch);
    toast("Deal saved.");
  };

  return (
    <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field id="d-title" label="Deal name" error={errors.title}>
        <input id="d-title" className={inputCls} value={title} disabled={!canEdit} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} />
      </Field>
      <Field id="d-client" label="Client" error={errors.client}>
        <input id="d-client" className={inputCls} value={client} disabled={!canEdit} onChange={(e) => setClient(e.target.value)} aria-invalid={!!errors.client} />
      </Field>
      <Field id="d-service" label="Service">
        <select id="d-service" className={inputCls} value={service} disabled={!canEdit} onChange={(e) => setService(e.target.value)}>
          {serviceNames.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field id="d-agreed" label="Agreed price in naira" hint="Leave empty until the price is agreed." error={errors.agreed}>
        <input id="d-agreed" inputMode="numeric" className={inputCls} value={agreed} disabled={!canEdit} onChange={(e) => setAgreed(e.target.value)} aria-invalid={!!errors.agreed} />
      </Field>
      <Field id="d-ref" label="Introduced by">
        <select id="d-ref" className={inputCls} value={referrerId} disabled={!canEdit} onChange={(e) => pickReferrer(e.target.value)}>
          <option value="">Nobody (direct client)</option>
          {db.referrers.filter((r) => r.status === "active" || r.id === referrerId).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </Field>
      {money && (
        <Field id="d-rate" label="Commission rate (percent)" error={errors.rate} hint={outside ? `Outside the usual ${commissionMin} to ${commissionMax} percent. You can still save it.` : `Usual range: ${commissionMin} to ${commissionMax} percent.`}>
          <input id="d-rate" inputMode="decimal" className={inputCls} value={rate} disabled={!canEdit || !referrerId} onChange={(e) => setRate(e.target.value)} aria-invalid={!!errors.rate} />
        </Field>
      )}
      <div className="sm:col-span-2">
        <Field id="d-notes" label="Notes">
          <textarea id="d-notes" rows={4} className={`${inputCls} py-2.5`} value={notes} disabled={!canEdit} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      {canEdit && <div className="sm:col-span-2"><button type="submit" className={btn("brand")}>Save changes</button></div>}
    </form>
  );
}

/**
 * One deal: price, what has been paid, who introduced it and what is owed to them, plus the payments list.
 * Sales sees the agreed price only. Received, remaining, commission and payments are for Owner and Finance.
 * TODO(integration): the server must hide payment rows from roles without access (row level security), not just this screen.
 */
export function DealDetail({ id }: { id: string }) {
  const db = useDb();
  const staff = useSession();
  const [paying, setPaying] = useState(false);
  const [suggestion, setSuggestion] = useState<PaymentSuggestion | undefined>(undefined);
  if (!staff) return null;

  const deal = db.deals.find((d) => d.id === id);
  const back = <Link href="/control-room/deals" className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold"><span className="rotate-180"><Icon name="chevronRight" size={16} /></span> All deals</Link>;
  if (!deal) {
    return <>{back}<EmptyState icon="board" title="This deal doesn’t exist" action={<Link href="/control-room/deals" className={btn("outline")}>Back to the board</Link>}>It may have been removed.</EmptyState></>;
  }

  const canEdit = can(staff.role, "deals", "edit");
  const money = canSeeMoney(staff.role);
  const bal = dealBalance(deal, db.payments);
  const paidPct = deal.agreed > 0 ? Math.min(100, Math.round((bal.received / deal.agreed) * 100)) : 0;
  const referrer = db.referrers.find((r) => r.id === deal.referrerId);
  const lead = db.leads.find((l) => l.id === deal.leadId);
  const payments = db.payments.filter((p) => p.dealId === deal.id).slice().sort((a, b) => b.date.localeCompare(a.date));
  const who = (sid: string) => db.staff.find((s) => s.id === sid)?.name ?? "Unknown";

  const move = async (stage: DealStage) => {
    await dealsApi.move(deal.id, stage);
    toast(`Moved to ${DEAL_STAGE_LABEL[stage]}.`);
  };
  const openPayment = (s?: PaymentSuggestion) => {
    setSuggestion(s);
    setPaying(true);
  };

  return (
    <>
      {back}
      <PageHeader
        title={deal.title}
        description={<span className="inline-flex flex-wrap items-center gap-2">{deal.client}, {deal.service} <Badge tone={STAGE_TONE[deal.stage]}>{DEAL_STAGE_LABEL[deal.stage]}</Badge></span>}
        actions={
          <>
            <select aria-label="Stage" className={`${inputCls} !w-auto`} value={deal.stage} disabled={!canEdit} onChange={(e) => void move(e.target.value as DealStage)}>
              {STAGES.map((s) => <option key={s} value={s}>{DEAL_STAGE_LABEL[s]}</option>)}
            </select>
            {money && <button type="button" className={btn("brand")} onClick={() => openPayment()}><Icon name="plus" size={18} /> <span className="ml-1.5">Record payment</span></button>}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Deal details" />
            <DealForm key={deal.id} deal={deal} canEdit={canEdit} money={money} />
          </Card>
          {money && (
            <Card>
              <CardHeader title="Payments" hint="Payments can’t be edited. To fix a mistake, record a correcting payment." />
              {payments.length === 0 ? (
                <div className="py-4 text-sm text-ink/70">No payments recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[15px]">
                    <thead className="text-xs text-ink/60"><tr><th className="py-2 pr-3 font-semibold">Date</th><th className="py-2 pr-3 font-semibold">What</th><th className="py-2 pr-3 text-right font-semibold">Amount</th><th className="py-2 font-semibold">Recorded by</th></tr></thead>
                    <tbody className="divide-y divide-line">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2.5 pr-3 whitespace-nowrap">{shortDate(p.date)}</td>
                          <td className="py-2.5 pr-3">{PAYMENT_CATEGORY_LABEL[p.category]}{p.note && <span className="block text-sm text-ink/70">{p.note}</span>}</td>
                          <td className="py-2.5 pr-3 text-right font-semibold whitespace-nowrap">
                            <span className="inline-flex items-center gap-1"><Icon name={p.direction === "in" ? "arrowDown" : "arrowUp"} size={14} /><span className="sr-only">{p.direction === "in" ? "Money in" : "Money out"}</span>{p.direction === "in" ? "+" : "−"}{naira(p.amount)}</span>
                          </td>
                          <td className="py-2.5 text-sm text-ink/70">{who(p.recordedBy)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Price" />
            <div className="font-display text-3xl font-bold">{deal.agreed ? naira(deal.agreed) : "Not agreed yet"}</div>
            {money && deal.agreed > 0 && (
              <>
                <div className="mt-4" role="progressbar" aria-label="Paid so far" aria-valuemin={0} aria-valuemax={100} aria-valuenow={paidPct}>
                  <div className="h-2 rounded-full bg-mint"><div className="h-2 rounded-full bg-brand" style={{ width: `${paidPct}%` }} /></div>
                </div>
                <dl className="mt-3 mb-0 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-ink/70">Received</dt><dd className="m-0 text-base font-semibold">{naira(bal.received)}</dd></div>
                  <div><dt className="text-ink/70">Remaining</dt><dd className="m-0 text-base font-semibold">{naira(bal.remaining)}</dd></div>
                </dl>
              </>
            )}
          </Card>
          {money && (
            <Card>
              <CardHeader title="Referrer and commission" />
              {referrer && deal.commissionRate !== null ? (
                <>
                  <div className="text-[15px]"><span className="font-semibold">{referrer.name}</span>, {deal.commissionRate} percent of the agreed price</div>
                  <dl className="mt-3 mb-0 grid grid-cols-3 gap-3 text-sm">
                    <div><dt className="text-ink/70">Due</dt><dd className="m-0 text-base font-semibold">{naira(bal.commissionDue)}</dd></div>
                    <div><dt className="text-ink/70">Paid</dt><dd className="m-0 text-base font-semibold">{naira(bal.commissionPaid)}</dd></div>
                    <div><dt className="text-ink/70">Owed</dt><dd className="m-0 text-base font-semibold">{naira(bal.commissionOwed)}</dd></div>
                  </dl>
                  <div className="mt-3 text-sm text-ink/70">The commission becomes due when the deal is Delivered or Closed.</div>
                  {bal.commissionOwed > 0 && (
                    <button type="button" className={btn("outline", "sm", "mt-3")} onClick={() => openPayment({ direction: "out", category: "commission", amount: bal.commissionOwed })}>Record commission payment</button>
                  )}
                </>
              ) : (
                <div className="text-sm text-ink/70">No referrer on this deal. Choose one in the details to track a commission.</div>
              )}
            </Card>
          )}
          {lead && (
            <Card>
              <CardHeader title="Came from a lead" />
              <div className="text-[15px] font-semibold">{lead.name}</div>
              <div className="text-sm text-ink/70">{lead.email}</div>
              <Link href={`/control-room/leads?lead=${lead.id}`} className={btn("outline", "sm", "mt-3")}>Open the lead</Link>
            </Card>
          )}
        </div>
      </div>
      <RecordPaymentModal open={paying} onClose={() => setPaying(false)} deal={deal} remaining={bal.remaining} suggestion={suggestion} />
    </>
  );
}
