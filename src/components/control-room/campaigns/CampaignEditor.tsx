"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { campaignsApi, type CampaignDraft } from "@/lib/control-room/campaigns-api";
import { inputsToIso, isFuture, isoToInputs } from "@/lib/control-room/dates";
import { longDate, plural } from "@/lib/control-room/format";
import { todayInput } from "@/lib/control-room/labels";
import { can } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { AUDIENCE_TYPES, audienceCount, audienceLabel, audienceTypes, CAMPAIGN_DEFAULTS } from "@/lib/control-room/templates";
import { toast } from "@/lib/control-room/toast";
import type { Campaign, LeadType } from "@/lib/control-room/types";
import { EmailPreview } from "../email/EmailPreview";
import { TemplateEditor } from "../settings/TemplateEditor";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Field, inputCls } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Badge, btn, Card, CardHeader, EmptyState, PageHeader, Stat } from "../ui/kit";
import { Segmented } from "../ui/Segmented";

const TEMPLATES: { id: Campaign["template"]; label: string }[] = [{ id: "promo", label: "Promotion" }, { id: "welcome", label: "Welcome" }, { id: "birthday", label: "Birthday" }];
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "0%");

function CampaignForm({ campaign, canEdit }: { campaign: Campaign; canEdit: boolean }) {
  const db = useDb();
  const router = useRouter();
  const editable = canEdit && (campaign.status === "draft" || campaign.status === "scheduled");
  const when = campaign.scheduledFor ? isoToInputs(campaign.scheduledFor) : { date: "", time: "09:00" };
  const [name, setName] = useState(campaign.name);
  const [subject, setSubject] = useState(campaign.subject);
  const [template, setTemplate] = useState(campaign.template);
  const [types, setTypes] = useState<LeadType[]>(audienceTypes(campaign.audience));
  const [body, setBody] = useState(campaign.body);
  const [mode, setMode] = useState<"now" | "later">(campaign.status === "scheduled" ? "later" : "now");
  const [date, setDate] = useState(when.date);
  const [time, setTime] = useState(when.time);
  const [width, setWidth] = useState(600);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [action, setAction] = useState<"save" | "schedule" | "send" | "delete" | "unschedule" | null>(null);

  const size = audienceCount(db.leads, types);
  const draft: CampaignDraft = { name: name.trim(), subject: subject.trim(), template, audience: types.join(","), audienceSize: size, body };
  const discount = db.settings.birthdayDiscount;

  const changeTemplate = (t: Campaign["template"]) => {
    const old = CAMPAIGN_DEFAULTS[template];
    if (!body.trim() || body === old.body) setBody(CAMPAIGN_DEFAULTS[t].body);
    if (!subject.trim() || subject === old.subject) setSubject(CAMPAIGN_DEFAULTS[t].subject);
    setTemplate(t);
  };
  const toggleType = (t: LeadType) => setTypes(types.includes(t) ? types.filter((x) => x !== t) : [...types, t]);

  /** Checks everything needed to send. Returns the schedule time (ISO) when mode is "later". */
  const validate = (): { ok: boolean; iso: string | null } => {
    const next: Record<string, string> = {};
    let iso: string | null = null;
    if (name.trim().length < 3) next.name = "Give the campaign a name.";
    if (subject.trim().length < 3) next.subject = "Write a subject line.";
    if (body.trim().length < 10) next.body = "Write the message (at least a sentence).";
    if (types.length === 0) next.audience = "Pick at least one group.";
    else if (size === 0) next.audience = "Nobody is in these groups yet.";
    if (mode === "later") {
      if (!date || !time) next.when = "Pick a date and time.";
      else {
        iso = inputsToIso(date, time);
        if (!isFuture(iso)) next.when = "Pick a time in the future.";
      }
    }
    setErrors(next);
    return { ok: Object.keys(next).length === 0, iso };
  };

  const saveDraft = async () => {
    if (action) return;
    if (name.trim().length < 3) return setErrors({ name: "Give the campaign a name." });
    setErrors({});
    setAction("save");
    try {
      await campaignsApi.save(campaign.id, draft);
      toast("Draft saved.");
    } finally {
      setAction(null);
    }
  };
  const schedule = async () => {
    if (action) return;
    const v = validate();
    if (!v.ok || !v.iso) return;
    setAction("schedule");
    try {
      await campaignsApi.schedule(campaign.id, draft, v.iso);
      toast("Campaign scheduled.");
    } finally {
      setAction(null);
    }
  };
  const askSend = () => {
    if (action) return;
    if (validate().ok) setConfirmSend(true);
  };
  const send = async () => {
    if (action) return;
    setAction("send");
    try {
      await campaignsApi.sendNow(campaign.id, draft);
      setConfirmSend(false);
      toast(`Sent to ${plural(size, "person", "people")}.`);
    } finally {
      setAction(null);
    }
  };
  const remove = async () => {
    if (action) return;
    setAction("delete");
    try {
      await campaignsApi.remove(campaign.id);
      setConfirmDelete(false);
      toast("Campaign deleted.");
      router.push("/control-room/campaigns");
    } finally {
      setAction(null);
    }
  };
  const unschedule = async () => {
    if (action) return;
    setAction("unschedule");
    try {
      await campaignsApi.unschedule(campaign.id);
    } finally {
      setAction(null);
    }
  };

  const preview = (
    <div className="flex flex-col gap-3 xl:sticky xl:top-6 xl:self-start">
      <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-ink/70">Preview</span><Segmented<string> label="Preview width" value={String(width)} onChange={(v) => setWidth(Number(v))} options={[{ value: "600", label: "Desktop" }, { value: "375", label: "Phone" }]} /></div>
      <EmailPreview template={template} subject={subject} body={body} discount={discount} width={width} />
    </div>
  );

  if (!editable) {
    const s = campaign.stats;
    return (
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-6">
          {s ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Delivered" value={String(s.delivered)} hint={`Of ${plural(campaign.audienceSize, "person", "people")}`} icon="mail" />
              <Stat label="Opened" value={pct(s.opened, s.delivered)} hint={`${s.opened} people`} icon="check" />
              <Stat label="Clicked" value={pct(s.clicked, s.delivered)} hint={`${s.clicked} people`} icon="arrowUp" />
            </div>
          ) : <EmptyState icon="mail" title="No results yet">Results appear here once the campaign has gone out.</EmptyState>}
          <Card>
            <CardHeader title="Details" />
            <dl className="m-0 grid gap-3 text-[15px] sm:grid-cols-2">
              <div><dt className="text-ink/70">Sent to</dt><dd className="m-0 font-semibold">{audienceLabel(campaign.audience)}</dd></div>
              <div><dt className="text-ink/70">When</dt><dd className="m-0 font-semibold">{campaign.sentAt ? longDate(campaign.sentAt) : "Not sent yet"}</dd></div>
            </dl>
            {campaign.status === "automated" && <div className="mt-4 rounded-xl bg-sun/20 p-3 text-sm">This email goes out automatically. {campaign.template === "birthday" && <>Edit it in <Link href="/control-room/birthdays">Birthdays</Link>.</>}</div>}
            {!canEdit && <div className="mt-4 rounded-xl bg-sun/20 p-3 text-sm">Your role can view campaigns but not change them.</div>}
          </Card>
        </div>
        {preview}
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card>
        <form onSubmit={(e) => e.preventDefault()} noValidate className="flex flex-col gap-4">
          <Field id="c-name" label="Campaign name" hint="Only you see this." error={errors.name}><input id="c-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} /></Field>
          <Field id="c-template" label="Template">
            <select id="c-template" className={inputCls} value={template} onChange={(e) => changeTemplate(e.target.value as Campaign["template"])}>{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
          </Field>
          <fieldset className="m-0 min-w-0 rounded-xl border border-line p-3">
            <legend className="px-1 text-sm font-semibold">Who gets it</legend>
            <div className="flex flex-col gap-2">
              {AUDIENCE_TYPES.map((a) => (
                <label key={a.id} className="flex min-h-9 items-center gap-3 text-[15px]"><input type="checkbox" className="size-5 accent-deep" checked={types.includes(a.id)} onChange={() => toggleType(a.id)} /> {a.label}</label>
              ))}
            </div>
            <div className="mt-2 text-sm font-semibold" role="status">{plural(size, "person", "people")} will get this</div>
            {errors.audience && <div role="alert" className="text-sm text-danger">{errors.audience}</div>}
          </fieldset>
          <Field id="c-subject" label="Subject line" error={errors.subject}><input id="c-subject" className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} aria-invalid={!!errors.subject} /></Field>
          <TemplateEditor id="c-body" label="Message" hint="Leave a blank line between paragraphs." value={body} onChange={setBody} kind="birthday" discount={discount} rows={6} />
          {errors.body && <div role="alert" className="-mt-2 text-sm text-danger">{errors.body}</div>}
          <fieldset className="m-0 min-w-0 rounded-xl border border-line p-3">
            <legend className="px-1 text-sm font-semibold">When</legend>
            <Segmented<"now" | "later"> label="When to send" value={mode} onChange={setMode} options={[{ value: "now", label: "Send now" }, { value: "later", label: "Schedule" }]} />
            {mode === "later" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field id="c-date" label="Date" error={errors.when}><input id="c-date" type="date" className={inputCls} value={date} min={todayInput()} onChange={(e) => setDate(e.target.value)} /></Field>
                <Field id="c-time" label="Time"><input id="c-time" type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} /></Field>
              </div>
            )}
          </fieldset>
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            {mode === "later" ? <button type="button" className={btn("brand")} onClick={schedule} disabled={action !== null} aria-busy={action === "schedule"}>{action === "schedule" ? "Scheduling…" : campaign.status === "scheduled" ? "Update schedule" : "Schedule campaign"}</button> : <button type="button" className={btn("brand")} onClick={askSend} disabled={action !== null} aria-busy={action === "send"}>{action === "send" ? "Sending…" : "Send now"}</button>}
            <button type="button" className={btn("outline")} onClick={saveDraft} disabled={action !== null} aria-busy={action === "save"}>{action === "save" ? "Saving…" : "Save draft"}</button>
            {campaign.status === "scheduled" && <button type="button" className={btn("ghost")} onClick={unschedule} disabled={action !== null} aria-busy={action === "unschedule"}>{action === "unschedule" ? "Moving to draft…" : "Move back to draft"}</button>}
            <button type="button" className={btn("ghost", "md", "ml-auto !text-danger")} onClick={() => setConfirmDelete(true)} disabled={action !== null} aria-busy={action === "delete"}><Icon name="trash" size={18} /> <span className="ml-1.5">{action === "delete" ? "Deleting…" : "Delete"}</span></button>
          </div>
        </form>
      </Card>
      {preview}
      <ConfirmModal open={confirmSend} title="Send this campaign now?" confirmLabel={`Send to ${plural(size, "person", "people")}`} onClose={() => setConfirmSend(false)} onConfirm={send}>It will go out straight away and can’t be taken back.</ConfirmModal>
      <ConfirmModal open={confirmDelete} title="Delete this campaign?" confirmLabel="Delete campaign" onClose={() => setConfirmDelete(false)} onConfirm={remove}>“{name}” will be removed for good.</ConfirmModal>
    </div>
  );
}

/** One campaign: the composer for drafts and scheduled ones, the results view for sent and automatic ones. */
export function CampaignEditor({ id }: { id: string }) {
  const db = useDb();
  const staff = useSession();
  if (!staff) return null;
  const c = db.campaigns.find((x) => x.id === id);
  const back = <Link href="/control-room/campaigns" className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold"><span className="rotate-180"><Icon name="chevronRight" size={16} /></span> All campaigns</Link>;
  if (!c) return <>{back}<EmptyState icon="mail" title="This campaign doesn’t exist" action={<Link href="/control-room/campaigns" className={btn("outline")}>Back to campaigns</Link>} /></>;
  return (
    <>
      {back}
      <PageHeader title={c.name} description={<Badge tone={c.status === "sent" ? "green" : c.status === "scheduled" ? "sun" : "neutral"}>{c.status === "automated" ? "Automatic" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge>} />
      <CampaignForm key={`${c.id}-${c.status}`} campaign={c} canEdit={can(staff.role, "campaigns", "edit")} />
    </>
  );
}
