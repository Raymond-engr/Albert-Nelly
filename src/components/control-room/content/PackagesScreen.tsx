"use client";

import { useState, type FormEvent } from "react";
import { copy } from "@/data/copy";
import { costsApi, packagesApi } from "@/lib/control-room/content-api";
import { uid } from "@/lib/control-room/api";
import { naira } from "@/lib/control-room/format";
import { parseNaira } from "@/lib/control-room/labels";
import { can } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import type { PackageTier, PriceDisplay } from "@/lib/control-room/types";
import { PriceEditor } from "../pricing/PriceEditor";
import { PackagePreview, PreviewFrame } from "../pricing/Previews";
import { Field, inputCls } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { btn, Card, CardHeader, PageHeader } from "../ui/kit";
import { Segmented } from "../ui/Segmented";
import { Switch } from "../ui/Switch";
import { FeatureList } from "./FeatureList";

function PackageEditor({ tier, canEdit }: { tier: PackageTier; canEdit: boolean }) {
  const [name, setName] = useState(tier.name);
  const [description, setDescription] = useState(tier.description);
  const [audience, setAudience] = useState(tier.audience);
  const [price, setPrice] = useState<PriceDisplay>(tier.price);
  const [priceOk, setPriceOk] = useState(true);
  const [featured, setFeatured] = useState(tier.featured);
  const [features, setFeatures] = useState(tier.features);
  const [more, setMore] = useState(tier.more);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "Give the package a name.";
    if (description.trim().length < 5) next.description = "Write one short line about it.";
    if (audience.trim().length < 3) next.audience = "Say who it suits.";
    setErrors(next);
    if (Object.keys(next).length || !priceOk) return;
    const clean = (l: string[]) => l.map((x) => x.trim()).filter(Boolean);
    await packagesApi.update(tier.id, { name: name.trim(), description: description.trim(), audience: audience.trim(), price, featured, features: clean(features), more: clean(more) });
    toast("Package saved.");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <Card>
        <form onSubmit={save} noValidate className="flex flex-col gap-4">
          <Field id="p-name" label="Package name" error={errors.name}><input id="p-name" className={inputCls} value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} /></Field>
          <Field id="p-desc" label="One line about it" error={errors.description}><input id="p-desc" className={inputCls} value={description} disabled={!canEdit} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!errors.description} /></Field>
          <Field id="p-aud" label="Who it suits" error={errors.audience}><input id="p-aud" className={inputCls} value={audience} disabled={!canEdit} onChange={(e) => setAudience(e.target.value)} aria-invalid={!!errors.audience} /></Field>
          <PriceEditor id="p-price" value={tier.price} disabled={!canEdit} onChange={(p, ok) => { setPrice(p); setPriceOk(ok); }} />
          <div className="flex items-center gap-3">
            <Switch checked={featured} onChange={setFeatured} label="Highlight this package" disabled={!canEdit} />
            <span className="text-[15px]">{featured ? "Highlighted (only one package can be)" : "Not highlighted"}</span>
          </div>
          <FeatureList label="Shown on the card" hint="Aim for 4 to 6 checks." items={features} onChange={setFeatures} otherLabel="See all features" onSend={(i) => { setMore([...more, features[i]]); setFeatures(features.filter((_, k) => k !== i)); }} disabled={!canEdit} />
          <FeatureList label="Under “See all features”" items={more} onChange={setMore} otherLabel="the card" onSend={(i) => { setFeatures([...features, more[i]]); setMore(more.filter((_, k) => k !== i)); }} disabled={!canEdit} />
          {canEdit ? <div><button type="submit" className={btn("brand")} disabled={!priceOk}>Save package</button></div> : <div className="rounded-xl bg-sun/20 p-3 text-sm">Your role can view packages but not change them.</div>}
        </form>
      </Card>
      <div className="xl:sticky xl:top-6 xl:self-start">
        <PreviewFrame>
          <PackagePreview name={name} description={description} audience={audience} price={price} featured={featured} features={features} more={more} />
        </PreviewFrame>
      </div>
    </div>
  );
}

type CostRow = { id: string; item: string; amount: string };
function CostsEditor({ canEdit }: { canEdit: boolean }) {
  const db = useDb();
  const [rows, setRows] = useState<CostRow[]>(db.runningCosts.map((c) => ({ id: c.id, item: c.item, amount: String(c.amount) })));
  const [error, setError] = useState("");

  const total = rows.reduce((n, r) => n + (parseNaira(r.amount) ?? 0), 0);
  const edit = (id: string, patch: Partial<CostRow>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (rows.some((r) => r.item.trim().length < 2)) return setError("Every row needs a name, for example Hosting.");
    if (rows.some((r) => parseNaira(r.amount) === null)) return setError("Amounts must be numbers, for example 60000.");
    setError("");
    await costsApi.save(rows.map((r) => ({ id: r.id, item: r.item.trim(), amount: parseNaira(r.amount) ?? 0 })));
    toast("Running costs saved.");
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader title="Yearly running costs" hint="Shown under the packages so nothing surprises a school later." />
      <form onSubmit={save} noValidate className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[1fr_140px_auto] items-center gap-2">
            <input aria-label={`Cost ${i + 1} name`} className={inputCls} value={r.item} disabled={!canEdit} onChange={(e) => edit(r.id, { item: e.target.value })} />
            <input aria-label={`Cost ${i + 1} amount in naira`} inputMode="numeric" className={inputCls} value={r.amount} disabled={!canEdit} onChange={(e) => edit(r.id, { amount: e.target.value })} />
            {canEdit && <button type="button" className={btn("ghost", "sm", "!px-2")} aria-label={`Remove ${r.item || `cost ${i + 1}`}`} onClick={() => setRows(rows.filter((x) => x.id !== r.id))}><Icon name="trash" size={18} /></button>}
          </div>
        ))}
        {error && <div role="alert" className="text-sm text-danger">{error}</div>}
        <div className="flex items-center justify-between border-t border-line pt-3 text-[15px]"><span className="font-semibold">Total per year</span><span className="font-semibold">{naira(total)}</span></div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn("outline")} onClick={() => setRows([...rows, { id: uid("cost"), item: "", amount: "" }])}><Icon name="plus" size={18} /> <span className="ml-1.5">Add a cost</span></button>
            <button type="submit" className={btn("brand")}>Save costs</button>
          </div>
        ) : <div className="rounded-xl bg-sun/20 p-3 text-sm">Your role can view the costs but not change them.</div>}
      </form>
    </Card>
  );
}

/**
 * School packages: one tab per package, plus the running-costs table. The preview uses the site's own card style and copy.
 * TODO(integration): `packages` and `running_costs` tables; saving refreshes the public Schools section.
 */
export function PackagesScreen() {
  const db = useDb();
  const staff = useSession();
  const [tab, setTab] = useState(db.packages[0]?.id ?? "costs");
  if (!staff) return null;
  const canEdit = can(staff.role, "packages", "edit");
  const tier = db.packages.find((p) => p.id === tab);

  return (
    <>
      <PageHeader title="School packages" description={`${copy.schools.title} Edit the three packages and the yearly running costs.`} />
      <div className="mb-5 overflow-x-auto">
        <Segmented<string> label="Package" value={tab} onChange={setTab} options={[...db.packages.map((p) => ({ value: p.id, label: p.name })), { value: "costs", label: "Running costs" }]} />
      </div>
      {tab === "costs" || !tier ? <CostsEditor key="costs" canEdit={canEdit} /> : <PackageEditor key={tier.id} tier={tier} canEdit={canEdit} />}
    </>
  );
}
