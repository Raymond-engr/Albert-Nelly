"use client";

import { useState } from "react";
import { birthdayLog } from "@/lib/control-room/birthday";
import { dayMonth, firstName, plural, shortDate } from "@/lib/control-room/format";
import { upcomingBirthdays } from "@/lib/control-room/metrics";
import { settingsApi, templatesApi } from "@/lib/control-room/admin-api";
import { can } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { CAMPAIGN_DEFAULTS, fill } from "@/lib/control-room/templates";
import { toast } from "@/lib/control-room/toast";
import type { Lead } from "@/lib/control-room/types";
import { EmailPreview } from "../email/EmailPreview";
import { TemplateEditor } from "../settings/TemplateEditor";
import { Field, inputCls } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Overlay } from "../ui/Overlay";
import { Avatar, Badge, btn, Card, EmptyState, PageHeader } from "../ui/kit";
import { Segmented } from "../ui/Segmented";

type Tab = "upcoming" | "template" | "log";

function BirthdayTemplate({ id, initialBody, initialDiscount, canEdit }: { id: string; initialBody: string; initialDiscount: number; canEdit: boolean }) {
  const [body, setBody] = useState(initialBody);
  const [discount, setDiscount] = useState(String(initialDiscount));
  const [width, setWidth] = useState(600);
  const [error, setError] = useState("");

  const n = Number(discount);
  const valid = discount.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= 100;
  const save = async () => {
    if (!valid) return setError("Enter a whole number between 0 and 100.");
    setError("");
    await templatesApi.update(id, body);
    await settingsApi.save({ birthdayDiscount: n });
    toast("Birthday email saved.");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card>
        <div className="flex flex-col gap-4">
          <TemplateEditor id="b-body" label="Birthday message" hint="Used in the birthday email and in the WhatsApp wish you can send by hand." value={body} onChange={setBody} kind="birthday" discount={valid ? n : 0} disabled={!canEdit} rows={5} />
          <Field id="b-discount" label="Birthday discount (percent)" hint="No code needed. The email says “Reply on WhatsApp to claim it.”" error={error}>
            <input id="b-discount" inputMode="numeric" className={`${inputCls} sm:max-w-40`} value={discount} disabled={!canEdit} onChange={(e) => setDiscount(e.target.value)} aria-invalid={!!error} />
          </Field>
          <div className="text-sm text-ink/70">The email also shows four partner ideas: photographers, birthday flyer designers, portrait artists and surprise event planners.</div>
          {canEdit ? <div><button type="button" className={btn("brand")} onClick={save}>Save birthday email</button></div> : <div className="rounded-xl bg-sun/20 p-3 text-sm">Your role can view the birthday email but not change it.</div>}
        </div>
      </Card>
      <div className="flex flex-col gap-3 xl:sticky xl:top-6 xl:self-start">
        <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-ink/70">Preview</span><Segmented<string> label="Preview width" value={String(width)} onChange={(v) => setWidth(Number(v))} options={[{ value: "600", label: "Desktop" }, { value: "375", label: "Phone" }]} /></div>
        <EmailPreview template="birthday" subject={CAMPAIGN_DEFAULTS.birthday.subject} body={body} discount={valid ? n : 0} width={width} />
      </div>
    </div>
  );
}

/**
 * Upcoming birthdays, the birthday email template and what has been sent.
 * TODO(integration): a daily job (cron) finds today's birthdays, sends the email through the email provider and writes a
 * `birthday_sends` row per email. See the handover, "Birthdays".
 */
export function BirthdaysScreen() {
  const db = useDb();
  const staff = useSession();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [days, setDays] = useState(30);
  const [preview, setPreview] = useState<Lead | null>(null);
  if (!staff) return null;

  const canEdit = can(staff.role, "birthdays", "edit");
  const tpl = db.templates.find((t) => t.type === "birthday");
  const discount = db.settings.birthdayDiscount;
  const upcoming = upcomingBirthdays(db.leads, days);
  const log = birthdayLog(db.leads);

  return (
    <>
      <PageHeader title="Birthdays" description="A birthday email goes out on the day to everyone who shared their birthday. You can also send a personal wish on WhatsApp." />
      <div className="mb-5 overflow-x-auto">
        <Segmented<Tab> label="Birthdays" value={tab} onChange={setTab} options={[{ value: "upcoming", label: "Upcoming", count: upcoming.length }, { value: "template", label: "Email template" }, { value: "log", label: "Send log", count: log.length }]} />
      </div>

      {tab === "upcoming" && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <label htmlFor="b-range" className="text-sm font-semibold">Show the next</label>
            <select id="b-range" className={`${inputCls} !w-auto`} value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option><option value={365}>12 months</option>
            </select>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon="cake" title="No birthdays in this time">Visitors share their birthday in the registration form. It is optional.</EmptyState>
          ) : (
            <Card pad={false}>
              <ul className="m-0 list-none divide-y divide-line p-0">
                {upcoming.map(({ lead, inDays }) => (
                  <li key={lead.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                    <span className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                      <Avatar name={lead.name} />
                      <span className="min-w-0"><span className="block truncate text-[15px] font-medium">{lead.name}</span><span className="block text-sm text-ink/70">{lead.birthDay && lead.birthMonth ? dayMonth(lead.birthDay, lead.birthMonth) : ""}</span></span>
                    </span>
                    <Badge tone={inDays === 0 ? "sun" : "neutral"}>{inDays === 0 ? "Today" : `In ${plural(inDays, "day")}`}</Badge>
                    <div className="flex gap-2">
                      <button type="button" className={btn("outline", "sm")} onClick={() => setPreview(lead)}>Preview email</button>
                      {lead.whatsapp && tpl && (
                        <a className={btn("outline", "sm")} href={`https://wa.me/${lead.whatsapp}?text=${encodeURIComponent(fill(tpl.body, { name: firstName(lead.name), discount: String(discount) }))}`} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={16} /> <span className="ml-1.5">WhatsApp wish</span></a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {tab === "template" && (tpl ? <BirthdayTemplate key={tpl.id} id={tpl.id} initialBody={tpl.body} initialDiscount={discount} canEdit={canEdit} /> : <EmptyState icon="cake" title="No birthday template found" />)}

      {tab === "log" && (
        log.length === 0 ? <EmptyState icon="mail" title="Nothing sent yet">Birthday emails appear here after they go out.</EmptyState> : (
          <Card pad={false}>
            <ul className="m-0 list-none divide-y divide-line p-0">
              {log.map(({ lead, date, opened }) => (
                <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <span className="flex items-center gap-3"><Avatar name={lead.name} /><span><span className="block text-[15px] font-medium">{lead.name}</span><span className="block text-sm text-ink/70">Sent on {shortDate(date)}</span></span></span>
                  <Badge tone={opened ? "green" : "neutral"}>{opened ? "Opened" : "Delivered"}</Badge>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-4 py-3 text-sm text-ink/70">Demo log built from the demo birthdays. The real log comes from the daily send job.</div>
          </Card>
        )
      )}

      <Overlay open={!!preview} onClose={() => setPreview(null)} title={preview ? `Email for ${firstName(preview.name)}` : "Preview"}>
        {preview && tpl && <EmailPreview template="birthday" subject={CAMPAIGN_DEFAULTS.birthday.subject} body={tpl.body} discount={discount} width={420} name={firstName(preview.name)} />}
      </Overlay>
    </>
  );
}
