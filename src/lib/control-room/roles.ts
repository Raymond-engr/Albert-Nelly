import type { IconName, Role } from "./types";

/**
 * Who sees what. Hiding a menu item is only cosmetic: the server and the database must enforce the same
 * table (see docs/CONTROL_ROOM_HANDOVER.md, section "Roles").
 */
export type Area =
  | "overview" | "leads" | "deals" | "services" | "packages" | "work" | "partners" | "referrers"
  | "campaigns" | "birthdays" | "team" | "settings" | "activity";
export type Access = "none" | "view" | "edit";

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: "owner", label: "Owner", blurb: "Everything, including team and settings." },
  { id: "finance", label: "Finance", blurb: "Deals, payments, commissions, prices." },
  { id: "sales", label: "Sales", blurb: "Leads and deals, without payments." },
  { id: "content", label: "Content and Marketing", blurb: "Selected work, partners, campaigns, birthdays." },
];
export const roleLabel = (r: Role) => ROLES.find((x) => x.id === r)?.label ?? r;

const row = (owner: Access, finance: Access, sales: Access, content: Access): Record<Role, Access> => ({ owner, finance, sales, content });
export const PERMS: Record<Area, Record<Role, Access>> = {
  overview: row("view", "view", "view", "view"),
  leads: row("edit", "none", "edit", "view"),
  deals: row("edit", "edit", "edit", "none"),
  services: row("edit", "edit", "view", "view"),
  packages: row("edit", "edit", "view", "view"),
  work: row("edit", "none", "view", "edit"),
  partners: row("edit", "none", "view", "edit"),
  referrers: row("edit", "edit", "view", "none"),
  campaigns: row("edit", "none", "view", "edit"),
  birthdays: row("edit", "none", "view", "edit"),
  team: row("edit", "none", "none", "none"),
  settings: row("edit", "none", "none", "none"),
  activity: row("view", "view", "none", "none"),
};
/** Recording payments is a separate right from editing deals. */
export const PAYMENT_ROLES: Role[] = ["owner", "finance"];

export const access = (role: Role, area: Area): Access => PERMS[area][role];
export function can(role: Role, area: Area, need: "view" | "edit" = "view"): boolean {
  const a = access(role, area);
  return need === "view" ? a !== "none" : a === "edit";
}
export const canSeeMoney = (role: Role) => PAYMENT_ROLES.includes(role);

export type NavItem = { area: Area; label: string; href: string; icon: IconName; group: string };
const B = "/control-room";
export const NAV: NavItem[] = [
  { area: "overview", label: "Overview", href: B, icon: "home", group: "" },
  { area: "leads", label: "Leads", href: `${B}/leads`, icon: "users", group: "Work" },
  { area: "deals", label: "Deals", href: `${B}/deals`, icon: "board", group: "Work" },
  { area: "referrers", label: "Referrers", href: `${B}/referrers`, icon: "share", group: "Work" },
  { area: "services", label: "Services and pricing", href: `${B}/services`, icon: "tag", group: "Site" },
  { area: "packages", label: "School packages", href: `${B}/packages`, icon: "cap", group: "Site" },
  { area: "work", label: "Selected work", href: `${B}/work`, icon: "image", group: "Site" },
  { area: "partners", label: "Partners", href: `${B}/partners`, icon: "link", group: "Site" },
  { area: "campaigns", label: "Campaigns", href: `${B}/campaigns`, icon: "mail", group: "Messages" },
  { area: "birthdays", label: "Birthdays", href: `${B}/birthdays`, icon: "cake", group: "Messages" },
  { area: "team", label: "Team and permissions", href: `${B}/team`, icon: "shield", group: "Admin" },
  { area: "settings", label: "Settings", href: `${B}/settings`, icon: "sliders", group: "Admin" },
  { area: "activity", label: "Activity log", href: `${B}/activity`, icon: "clock", group: "Admin" },
];

const SEGMENT: Record<string, Area> = {
  "": "overview", leads: "leads", deals: "deals", services: "services", packages: "packages", work: "work", partners: "partners",
  referrers: "referrers", campaigns: "campaigns", birthdays: "birthdays", team: "team", settings: "settings", activity: "activity",
};
export function areaForPath(path: string): Area {
  const seg = path.replace(B, "").split("/").filter(Boolean)[0] ?? "";
  return SEGMENT[seg] ?? "overview";
}
