"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { workApi } from "@/lib/control-room/content-api";
import { call } from "@/lib/control-room/http";
import { can } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import { validateUpload, getPublicMediaUrl } from "@/lib/media";
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
  const [imagePath, setImagePath] = useState<string | null>(item?.imagePath ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.imagePath ? getPublicMediaUrl(item.imagePath) : null);
  const [imageWarning, setImageWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUpload("work", file.type, file.size);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, image: validation.error || "Invalid file" }));
      return;
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });

    setImageWarning(validation.warning || null);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setImagePath(null);
    setImageWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Give the project a name.";
    if (challenge.trim().length < 5) next.challenge = "Write one line on the problem.";
    if (result.trim().length < 2) next.result = "Add one result, ideally with a number.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      let finalImagePath = imagePath;

      if (imageFile) {
        const entityId = item?.id || `work-${Date.now()}`;
        const uploadRes = await call<{ signedUrl: string; path: string }>(
          "POST",
          "/api/control-room/uploads",
          {
            entityType: "work",
            entityId,
            contentType: imageFile.type,
            size: imageFile.size,
          }
        );

        if (uploadRes?.signedUrl) {
          await fetch(uploadRes.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": imageFile.type },
            body: imageFile,
          });
          finalImagePath = uploadRes.path;
        }
      }

      const data = {
        title: title.trim(),
        category,
        challenge: challenge.trim(),
        result: result.trim(),
        published,
        imagePath: finalImagePath,
      };

      if (item) await workApi.update(item.id, data);
      else await workApi.create(data);

      toast(item ? "Project saved." : "Project added.");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save project.";
      setErrors((prev) => ({ ...prev, form: msg }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {errors.form && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}
      <Field id="w-title" label="Project name" error={errors.title}>
        <input id="w-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} />
      </Field>
      <Field id="w-cat" label="Type">
        <select id="w-cat" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as WorkItem["category"])}>
          <option>Design</option>
          <option>Development</option>
        </select>
      </Field>
      <Field id="w-chal" label="The challenge" hint="One line on the problem." error={errors.challenge}>
        <input id="w-chal" className={inputCls} value={challenge} onChange={(e) => setChallenge(e.target.value)} aria-invalid={!!errors.challenge} />
      </Field>
      <Field id="w-res" label="The result" hint="One result, ideally with a number." error={errors.result}>
        <input id="w-res" className={inputCls} value={result} onChange={(e) => setResult(e.target.value)} aria-invalid={!!errors.result} />
      </Field>

      {/* Image attachment & preview */}
      <Field id="w-image" label="Project screenshot (16:10, max 500 KB)" error={errors.image}>
        {previewUrl ? (
          <div className="flex flex-col gap-2">
            <div className="relative aspect-[16/10] w-full max-w-sm overflow-hidden rounded-xl border border-line bg-cloud">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Screenshot preview" className="size-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <label className={btn("outline", "sm") + " cursor-pointer"}>
                Replace screenshot
                <input ref={fileInputRef} type="file" accept="image/webp,image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
              </label>
              <button type="button" className={btn("ghost", "sm")} onClick={handleRemoveImage}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex aspect-[16/10] max-w-sm cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-cloud/50 hover:bg-cloud transition p-4 text-center">
            <span className="text-ink/60 mb-2"><Icon name="image" size={24} /></span>
            <span className="text-sm font-semibold">Upload screenshot</span>
            <span className="text-xs text-ink/60 mt-1">WebP, PNG, or JPEG under 500 KB (150 KB recommended)</span>
            <input ref={fileInputRef} type="file" accept="image/webp,image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
          </label>
        )}
        {imageWarning && <p className="mt-1 text-xs text-sun">{imageWarning}</p>}
      </Field>

      <div className="flex items-center gap-3">
        <Switch checked={published} onChange={setPublished} label="Show on the site" />
        <span className="text-[15px]">{published ? "Shown on the site" : "Hidden from the site"}</span>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className={btn("ghost")} onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className={btn("brand")} disabled={saving}>
          {saving ? "Saving..." : item ? "Save project" : "Add project"}
        </button>
      </div>
    </form>
  );
}

/**
 * Selected Work: projects shown as cards with screenshot support.
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
                {w.imagePath && (
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-cloud">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getPublicMediaUrl(w.imagePath) || ""} alt="" className="size-full object-cover" />
                  </div>
                )}
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
