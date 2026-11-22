"use client";

import { useState, type FormEvent } from "react";
import { teamApi } from "@/lib/control-room/admin-api";
import { timeAgo } from "@/lib/control-room/format";
import { PERMS, ROLES, roleLabel, type Access, type Area } from "@/lib/control-room/roles";
import { useDb, useSession } from "@/lib/control-room/store";
import { toast } from "@/lib/control-room/toast";
import { emailOk } from "@/lib/control-room/validate";
import type { Role, Staff } from "@/lib/control-room/types";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Field, inputCls } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Overlay } from "../ui/Overlay";
import { Avatar, Badge, btn, Card, CardHeader, PageHeader } from "../ui/kit";

const AREA_LABEL: Record<Area, string> = {
  overview: "Overview", leads: "Leads", deals: "Deals", services: "Services and pricing", packages: "School packages", work: "Selected work",
  partners: "Partners", referrers: "Referrers", campaigns: "Campaigns", birthdays: "Birthdays", team: "Team and permissions", settings: "Settings", activity: "Activity log",
};
const ACCESS: Record<Access, { label: string; icon: "edit" | "search" | "x" }> = { edit: { label: "Can edit", icon: "edit" }, view: { label: "Can view", icon: "search" }, none: { label: "No access", icon: "x" } };

function InviteForm({ onClose }: { onClose: () => void }) {
  const db = useDb();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("sales");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter their name.";
    if (!emailOk(email)) next.email = "That email looks incomplete. Check the @ and the dot.";
    else if (db.staff.some((s) => s.email === email.trim().toLowerCase())) next.email = "This person is already on the team.";
    setErrors(next);
    if (Object.keys(next).length) return;
    await teamApi.invite({ name: name.trim(), email: email.trim(), role });
    toast(`Invite sent to ${email.trim()}.`);
    onClose();
  };
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field id="i-name" label="Name" error={errors.name}><input id="i-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} /></Field>
      <Field id="i-email" label="Email" error={errors.email}><input id="i-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} /></Field>
      <Field id="i-role" label="Role" hint={ROLES.find((r) => r.id === role)?.blurb}>
        <select id="i-role" className={inputCls} value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
      </Field>
      <div className="text-sm text-ink/70">They get an email to choose a password and set up an authenticator app. Nobody can sign up on their own.</div>
      <div className="flex justify-end gap-2"><button type="button" className={btn("ghost")} onClick={onClose}>Cancel</button><button type="submit" className={btn("brand")}>Send invite</button></div>
    </form>
  );
}

/**
 * Owner only: who is on the team, their role, and the permissions table that explains each role.
 * The table is read-only on purpose: changing what a role can do is a code change plus a database rule (see the handover, "Roles").
 */
export function TeamScreen() {
  const db = useDb();
  const me = useSession();
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Staff | null>(null);
  if (!me) return null;

  const changeRole = async (s: Staff, role: Role) => {
    const ok = await teamApi.setRole(s.id, role);
    toast(ok ? `${s.name} is now ${roleLabel(role)}.` : "The team needs at least one Owner.", ok ? "ok" : "error");
  };
  const confirmRemove = async () => {
    if (!removing) return;
    const ok = await teamApi.remove(removing.id);
    toast(ok ? `${removing.name} was removed.` : "The team needs at least one Owner.", ok ? "ok" : "error");
    setRemoving(null);
  };

  return (
    <>
      <PageHeader title="Team and permissions" description="Invite people, choose their role and see what each role can do." actions={<button type="button" className={btn("brand")} onClick={() => setInviting(true)}><Icon name="plus" size={18} /> <span className="ml-1.5">Invite someone</span></button>} />
      <Card pad={false} className="mb-6">
        <ul className="m-0 list-none divide-y divide-line p-0">
          {db.staff.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                <Avatar name={s.name} />
                <span className="min-w-0"><span className="block truncate text-[15px] font-medium">{s.name}{s.id === me.id && <span className="ml-2 text-sm text-ink/70">(you)</span>}</span><span className="block truncate text-sm text-ink/70">{s.email}</span></span>
              </span>
              <Badge tone={s.status === "active" ? "green" : "sun"}>{s.status === "active" ? "Active" : "Invited"}</Badge>
              <span className="w-28 text-sm text-ink/70">{s.lastSeen ? timeAgo(s.lastSeen) : "Not signed in yet"}</span>
              <select aria-label={`Role of ${s.name}`} className={`${inputCls} !w-auto`} value={s.role} disabled={s.id === me.id} onChange={(e) => void changeRole(s, e.target.value as Role)}>
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              {s.id !== me.id ? <button type="button" className={btn("ghost", "sm", "!px-2")} aria-label={`Remove ${s.name}`} onClick={() => setRemoving(s)}><Icon name="trash" size={18} /></button> : <span className="w-9" />}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="What each role can do" hint="Hiding a screen is only the surface. The database enforces the same table." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[15px]">
            <thead className="text-sm"><tr><th className="py-2 pr-3 font-semibold">Screen</th>{ROLES.map((r) => <th key={r.id} className="px-2 py-2 font-semibold">{r.label}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {(Object.keys(PERMS) as Area[]).map((a) => (
                <tr key={a}>
                  <th scope="row" className="py-2.5 pr-3 font-medium">{AREA_LABEL[a]}</th>
                  {ROLES.map((r) => {
                    const acc = ACCESS[PERMS[a][r.id]];
                    return <td key={r.id} className="px-2 py-2.5"><span className="inline-flex items-center gap-1.5 text-sm"><Icon name={acc.icon} size={15} />{acc.label}</span></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-ink/70 sm:grid-cols-2">{ROLES.map((r) => <div key={r.id}><span className="font-semibold text-ink">{r.label}.</span> {r.blurb}</div>)}</div>
      </Card>

      <Overlay open={inviting} onClose={() => setInviting(false)} variant="modal" title="Invite someone"><InviteForm onClose={() => setInviting(false)} /></Overlay>
      <ConfirmModal open={!!removing} title="Remove this person?" confirmLabel="Remove access" onClose={() => setRemoving(null)} onConfirm={confirmRemove}>{removing?.name} will no longer be able to open the Control Room.</ConfirmModal>
    </>
  );
}
