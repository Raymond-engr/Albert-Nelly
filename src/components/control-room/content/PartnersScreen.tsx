"use client";

import { useState, type FormEvent } from "react";
import { partnerCategories } from "@/data/registration";
import { partnersApi } from "@/lib/control-room/content-api";
import { can } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import { urlOk } from "@/lib/control-room/validate";
import type { Partner } from "@/lib/control-room/types";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Field, inputCls } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Overlay } from "../ui/Overlay";
import { Badge, btn, Card, EmptyState, PageHeader } from "../ui/kit";
import { Switch } from "../ui/Switch";

function PartnerForm({ item, onClose }: { item: Partner | null; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? partnerCategories[0]);
  const [note, setNote] = useState(item?.note ?? "");
  const [link, setLink] = useState(item?.link ?? "");
  const [status, setStatus] = useState<Partner["status"]>(item?.status ?? "active");
  const [published, setPublished] = useState(item?.published ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const active = status === "active";
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter the partner’s name.";
    if (!urlOk(link)) next.link = "Use a full web address, for example https://example.com.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const data = { name: name.trim(), category, note: note.trim(), link: link.trim(), status, published: active && published };
    if (item) await partnersApi.update(item.id, data);
    else await partnersApi.create(data);
    toast(item ? "Partner saved." : "Partner added.");
    onClose();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="pt-name" label="Name" error={errors.name}><input id="pt-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} /></Field>
      <Field id="pt-cat" label="Category">
        <select id="pt-cat" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          {[...new Set([...partnerCategories, category])].map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field id="pt-note" label="What they do with Albert Nelly" hint="Shown in the small card when a visitor taps the logo."><input id="pt-note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <Field id="pt-link" label="Website (optional)" error={errors.link}><input id="pt-link" type="url" className={inputCls} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" aria-invalid={!!errors.link} /></Field>
      <Field id="pt-status" label="Status" hint="A pending partner has registered but is not approved yet.">
        <select id="pt-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Partner["status"])}><option value="active">Active</option><option value="pending">Pending</option></select>
      </Field>
      <div className="flex items-center gap-3">
        <Switch checked={active && published} onChange={setPublished} label="Show on the site" disabled={!active} />
        <span className="text-[15px]">{!active ? "Only active partners can be shown" : published ? "Shown on the site" : "Hidden from the site"}</span>
      </div>
      <div className="flex justify-end gap-2"><button type="button" className={btn("ghost")} onClick={onClose}>Cancel</button><button type="submit" className={btn("brand")}>{item ? "Save partner" : "Add partner"}</button></div>
    </form>
  );
}

/**
 * Partners: the logo strip and "How to partner" on the site. Partner leads from the registration form arrive as Pending here.
 * TODO(integration): `partners` table, logo upload (Supabase Storage, single-colour variant), and a "Create partner from lead" action.
 */
export function PartnersScreen() {
  const db = useDb();
  const staff = useSession();
  const [editing, setEditing] = useState<Partner | "new" | null>(null);
  const [deleting, setDeleting] = useState<Partner | null>(null);
  if (!staff) return null;

  const canEdit = can(staff.role, "partners", "edit");
  const shown = db.partners.filter((p) => p.published).length;

  return (
    <>
      <PageHeader
        title="Partners"
        description={<span className="inline-flex flex-wrap items-center gap-2">{shown} shown on the site. <Badge tone={shown >= 5 && shown <= 10 ? "green" : "sun"}>{shown >= 5 && shown <= 10 ? "Good for the strip" : "The strip looks best with 5 to 10"}</Badge></span>}
        actions={canEdit ? <button type="button" className={btn("brand")} onClick={() => setEditing("new")}><Icon name="plus" size={18} /> <span className="ml-1.5">Add partner</span></button> : undefined}
      />
      {db.partners.length === 0 ? (
        <EmptyState icon="link" title="No partners yet">Add a partner to show their logo on the site.</EmptyState>
      ) : (
        <Card pad={false}>
          <ul className="m-0 list-none divide-y divide-line p-0">
            {db.partners.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-semibold">{p.name}</span><Badge tone={p.status === "active" ? "green" : "sun"}>{p.status === "active" ? "Active" : "Pending"}</Badge></div>
                  <div className="text-sm text-ink/70">{p.category}{p.note ? `, ${p.note}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.published} onChange={(v) => void partnersApi.update(p.id, { published: v })} label={`Show ${p.name} on the site`} disabled={!canEdit || p.status !== "active"} />
                  <span className="w-16 text-sm">{p.published ? "Shown" : "Hidden"}</span>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button type="button" className={btn("outline", "sm")} onClick={() => setEditing(p)}>Edit</button>
                    <button type="button" className={btn("ghost", "sm", "!px-2")} aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)}><Icon name="trash" size={18} /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Overlay open={editing !== null} onClose={() => setEditing(null)} variant="modal" title={editing === "new" ? "Add a partner" : "Edit partner"}>
        <PartnerForm item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      </Overlay>
      <ConfirmModal open={!!deleting} title="Delete this partner?" confirmLabel="Delete partner" onClose={() => setDeleting(null)} onConfirm={async () => { if (deleting) { await partnersApi.remove(deleting.id); toast("Partner deleted."); } setDeleting(null); }}>
        “{deleting?.name}” will be removed. To keep them but hide the logo, turn off “Show on the site” instead.
      </ConfirmModal>
    </>
  );
}
