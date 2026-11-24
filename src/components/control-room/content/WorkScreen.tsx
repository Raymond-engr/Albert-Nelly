"use client";

import { useState, type FormEvent } from "react";
import { workApi } from "@/lib/control-room/content-api";
import { can } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import type { WorkItem } from "@/lib/control-room/types";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Field, inputCls } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Overlay } from "../ui/Overlay";
import { Badge, btn, Card, EmptyState, PageHeader } from "../ui/kit";
import { Segmented } from "../ui/Segmented";
import { Switch } from "../ui/Switch";

function WorkForm({ item, onClose }: { item: WorkItem | null; onClose: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [category, setCategory] = useState<WorkItem["category"]>(item?.category ?? "Design");
  const [challenge, setChallenge] = useState(item?.challenge ?? "");
  const [result, setResult] = useState(item?.result ?? "");
  const [published, setPublished] = useState(item?.published ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Give the project a name.";
    if (challenge.trim().length < 5) next.challenge = "Write one line on the problem.";
    if (result.trim().length < 2) next.result = "Add one result, ideally with a number.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const data = { title: title.trim(), category, challenge: challenge.trim(), result: result.trim(), published };
    if (item) await workApi.update(item.id, data);
    else await workApi.create(data);
    toast(item ? "Project saved." : "Project added.");
    onClose();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="w-title" label="Project name" error={errors.title}><input id="w-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} /></Field>
      <Field id="w-cat" label="Type">
        <select id="w-cat" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as WorkItem["category"])}><option>Design</option><option>Development</option></select>
      </Field>
      <Field id="w-chal" label="The challenge" hint="One line on the problem." error={errors.challenge}><input id="w-chal" className={inputCls} value={challenge} onChange={(e) => setChallenge(e.target.value)} aria-invalid={!!errors.challenge} /></Field>
      <Field id="w-res" label="The result" hint="One result, ideally with a number." error={errors.result}><input id="w-res" className={inputCls} value={result} onChange={(e) => setResult(e.target.value)} aria-invalid={!!errors.result} /></Field>
      <div className="flex items-center gap-3"><Switch checked={published} onChange={setPublished} label="Show on the site" /><span className="text-[15px]">{published ? "Shown on the site" : "Hidden from the site"}</span></div>
      <div className="flex justify-end gap-2"><button type="button" className={btn("ghost")} onClick={onClose}>Cancel</button><button type="submit" className={btn("brand")}>{item ? "Save project" : "Add project"}</button></div>
    </form>
  );
}

/**
 * Selected Work: four to six projects the site shows as cards. Toggle one off to hide it without deleting it.
 * TODO(integration): `work_items` table plus a screenshot upload (Supabase Storage). Case pages are a later design task.
 */
export function WorkScreen() {
  const db = useDb();
  const staff = useSession();
  const [cat, setCat] = useState<"all" | WorkItem["category"]>("all");
  const [editing, setEditing] = useState<WorkItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<WorkItem | null>(null);
  if (!staff) return null;

  const canEdit = can(staff.role, "work", "edit");
  const shown = db.work.filter((w) => w.published).length;
  const list = db.work.filter((w) => cat === "all" || w.category === cat);

  return (
    <>
      <PageHeader
        title="Selected work"
        description={<span className="inline-flex flex-wrap items-center gap-2">{shown} shown on the site. <Badge tone={shown >= 4 && shown <= 6 ? "green" : "sun"}>{shown >= 4 && shown <= 6 ? "Looks best at 4 to 6" : "Aim for 4 to 6"}</Badge></span>}
        actions={canEdit ? <button type="button" className={btn("brand")} onClick={() => setEditing("new")}><Icon name="plus" size={18} /> <span className="ml-1.5">Add project</span></button> : undefined}
      />
      <div className="mb-4 overflow-x-auto">
        <Segmented<"all" | WorkItem["category"]> label="Project type" value={cat} onChange={setCat} options={[{ value: "all", label: "All", count: db.work.length }, { value: "Design", label: "Design", count: db.work.filter((w) => w.category === "Design").length }, { value: "Development", label: "Development", count: db.work.filter((w) => w.category === "Development").length }]} />
      </div>
      {list.length === 0 ? (
        <EmptyState icon="image" title="No projects here">Add a project to show it on the site.</EmptyState>
      ) : (
        <Card pad={false}>
          <ul className="m-0 list-none divide-y divide-line p-0">
            {list.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-semibold">{w.title}</span><Badge tone="neutral">{w.category}</Badge></div>
                  <div className="text-sm text-ink/70">{w.challenge}</div>
                  <div className="text-sm font-semibold text-deep">{w.result}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={w.published} onChange={(v) => void workApi.update(w.id, { published: v })} label={`Show ${w.title} on the site`} disabled={!canEdit} />
                  <span className="w-16 text-sm">{w.published ? "Shown" : "Hidden"}</span>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button type="button" className={btn("outline", "sm")} onClick={() => setEditing(w)}>Edit</button>
                    <button type="button" className={btn("ghost", "sm", "!px-2")} aria-label={`Delete ${w.title}`} onClick={() => setDeleting(w)}><Icon name="trash" size={18} /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Overlay open={editing !== null} onClose={() => setEditing(null)} variant="modal" title={editing === "new" ? "Add a project" : "Edit project"}>
        <WorkForm item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      </Overlay>
      <ConfirmModal open={!!deleting} title="Delete this project?" confirmLabel="Delete project" onClose={() => setDeleting(null)} onConfirm={async () => { if (deleting) { await workApi.remove(deleting.id); toast("Project deleted."); } setDeleting(null); }}>
        “{deleting?.title}” will be removed from the site. To keep it but hide it, turn off “Show on the site” instead.
      </ConfirmModal>
    </>
  );
}
