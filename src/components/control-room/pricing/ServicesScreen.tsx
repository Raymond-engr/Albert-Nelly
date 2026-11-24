"use client";

import { useState, type FormEvent } from "react";
import { servicesApi } from "@/lib/control-room/content-api";
import { formatPrice } from "@/lib/control-room/price";
import { can } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import type { PriceDisplay, ServiceItem } from "@/lib/control-room/types";
import { Field, inputCls } from "../ui/Field";
import { Badge, btn, Card, PageHeader } from "../ui/kit";
import { Switch } from "../ui/Switch";
import { PriceEditor } from "./PriceEditor";
import { PreviewFrame, ServicePreview } from "./Previews";

function ServiceEditor({ service, canEdit }: { service: ServiceItem; canEdit: boolean }) {
  const [title, setTitle] = useState(service.title);
  const [description, setDescription] = useState(service.description);
  const [audience, setAudience] = useState(service.audience);
  const [badge, setBadge] = useState(service.badge);
  const [published, setPublished] = useState(service.published);
  const [price, setPrice] = useState<PriceDisplay>(service.price);
  const [priceOk, setPriceOk] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Give the service a name.";
    if (description.trim().length < 5) next.description = "Write one short line about it.";
    if (audience.trim().length < 3) next.audience = "Say who it suits.";
    setErrors(next);
    if (Object.keys(next).length || !priceOk) return;
    setSaving(true);
    try {
      await servicesApi.update(service.id, { title: title.trim(), description: description.trim(), audience: audience.trim(), badge: badge.trim(), published, price });
      toast("Service saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card>
        <form onSubmit={save} noValidate className="flex flex-col gap-4">
          <Field id="s-title" label="Name" error={errors.title}><input id="s-title" className={inputCls} value={title} disabled={!canEdit} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} /></Field>
          <Field id="s-desc" label="One line about it" error={errors.description}><input id="s-desc" className={inputCls} value={description} disabled={!canEdit} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!errors.description} /></Field>
          <Field id="s-aud" label="Who it suits" error={errors.audience}><input id="s-aud" className={inputCls} value={audience} disabled={!canEdit} onChange={(e) => setAudience(e.target.value)} aria-invalid={!!errors.audience} /></Field>
          <Field id="s-badge" label="Badge (optional)" hint="A small label on the card, for example “with our partners”."><input id="s-badge" className={inputCls} value={badge} disabled={!canEdit} onChange={(e) => setBadge(e.target.value)} /></Field>
          <PriceEditor id="s-price" value={service.price} disabled={!canEdit} onChange={(p, ok) => { setPrice(p); setPriceOk(ok); }} />
          <div className="flex items-center gap-3">
            <Switch checked={published} onChange={setPublished} label="Show on the site" disabled={!canEdit} />
            <span className="text-[15px]">{published ? "Shown on the site" : "Hidden from the site"}</span>
          </div>
          {canEdit ? <div><button type="submit" className={btn("brand")} disabled={!priceOk || saving} aria-busy={saving}>{saving ? "Saving…" : "Save service"}</button></div> : <div className="rounded-xl bg-sun/20 p-3 text-sm">Your role can view prices but not change them.</div>}
        </form>
      </Card>
      <div className="xl:sticky xl:top-6 xl:self-start">
        <PreviewFrame hidden={!published}>
          <ServicePreview title={title} description={description} audience={audience} badge={badge} price={price} />
        </PreviewFrame>
      </div>
    </div>
  );
}

/**
 * Edit the five services and choose how each price is shown. The preview on the right is the real card style from the site.
 * TODO(integration): services come from the `services` table; saving refreshes the public page (revalidateTag("services")).
 */
export function ServicesScreen() {
  const db = useDb();
  const staff = useSession();
  const [selectedId, setSelectedId] = useState(db.services[0]?.id ?? "");
  if (!staff) return null;
  const canEdit = can(staff.role, "services", "edit");
  const selected = db.services.find((s) => s.id === selectedId) ?? db.services[0];

  return (
    <>
      <PageHeader title="Services and pricing" description="Choose what each card says and how its price is shown. The site updates when you save." />
      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <nav aria-label="Services">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {db.services.map((s) => {
              const on = s.id === selected?.id;
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => setSelectedId(s.id)} aria-current={on ? "true" : undefined} className={`flex w-full flex-col items-start gap-1 rounded-xl border p-3 text-left ${on ? "border-brand bg-mint" : "border-line bg-card hover:bg-mint/50"}`}>
                    <span className="text-[15px] font-semibold">{s.title}</span>
                    <span className="text-sm text-ink/70">{formatPrice(s.price) ?? "No price shown"}</span>
                    {!s.published && <Badge tone="coral">Hidden</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        {selected && <ServiceEditor key={selected.id} service={selected} canEdit={canEdit} />}
      </div>
    </>
  );
}
