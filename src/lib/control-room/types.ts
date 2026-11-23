import type { LeadType } from "@/types/lead";
import type { SceneId } from "@/types/scene";

/**
 * Domain types of the Control Room. They mirror the tables the backend will have later
 * (see docs/CONTROL_ROOM_HANDOVER.md). Money is always a whole number of naira.
 */
export type { LeadType, SceneId };

export type IconName =
  | "home" | "users" | "board" | "tag" | "cap" | "image" | "link" | "share" | "mail" | "cake" | "shield" | "sliders"
  | "clock" | "search" | "plus" | "x" | "check" | "chevronRight" | "chevronDown" | "menu" | "logout" | "arrowUp"
  | "arrowDown" | "chat" | "edit" | "trash";

export type Role = "owner" | "finance" | "sales" | "content";
export type Staff = { id: string; name: string; email: string; role: Role; status: "active" | "invited" | "disabled"; lastSeen: string | null };

export type LeadStatus = "new" | "contacted" | "deal" | "archived";
export type Lead = {
  id: string;
  createdAt: string;
  type: LeadType;
  name: string;
  email: string;
  whatsapp: string | null;
  service: string | null;
  business: string | null;
  category: string | null;
  birthDay: number | null;
  birthMonth: number | null;
  /** The chip the visitor saw in the registration panel (a service or package name). */
  context: string | null;
  /** Which button on the site opened the form. */
  source: string;
  status: LeadStatus;
  notes: string;
  tags: string[];
  dealId: string | null;
  ownerId: string | null;
};

export type DealStage = "new" | "conversation" | "quote" | "deposit" | "progress" | "delivered" | "closed" | "lost";
export const DEAL_STAGE_LABEL: Record<DealStage, string> = {
  new: "New", conversation: "In conversation", quote: "Quote sent", deposit: "Deposit received",
  progress: "In progress", delivered: "Delivered", closed: "Closed", lost: "Lost",
};
/** The pipeline board has 7 columns. The last one holds both Closed and Lost deals. */
export const DEAL_COLUMNS: { id: string; label: string; stages: DealStage[] }[] = [
  { id: "new", label: "New", stages: ["new"] },
  { id: "conversation", label: "In conversation", stages: ["conversation"] },
  { id: "quote", label: "Quote sent", stages: ["quote"] },
  { id: "deposit", label: "Deposit received", stages: ["deposit"] },
  { id: "progress", label: "In progress", stages: ["progress"] },
  { id: "delivered", label: "Delivered", stages: ["delivered"] },
  { id: "closed", label: "Closed or lost", stages: ["closed", "lost"] },
];
export const OPEN_STAGES: DealStage[] = ["new", "conversation", "quote", "deposit", "progress"];

export type Deal = {
  id: string;
  title: string;
  client: string;
  service: string;
  leadId: string | null;
  stage: DealStage;
  /** Agreed price in naira. 0 means "not agreed yet". */
  agreed: number;
  referrerId: string | null;
  /** Percent of the agreed price owed to the referrer once the deal is delivered. */
  commissionRate: number | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
};

export type PaymentCategory = "deposit" | "balance" | "commission" | "expense" | "other";
export type Payment = {
  id: string;
  dealId: string | null;
  direction: "in" | "out";
  amount: number;
  date: string;
  category: PaymentCategory;
  note: string;
  recordedBy: string;
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  template: "welcome" | "birthday" | "promo";
  audience: string;
  audienceSize: number;
  status: "draft" | "scheduled" | "sending" | "sent" | "automated";
  scheduledFor: string | null;
  sentAt: string | null;
  stats: { delivered: number; opened: number; clicked: number } | null;
  body: string;
};

export type PriceDisplay =
  | { kind: "exact"; amount: number }
  | { kind: "from"; amount: number }
  | { kind: "range"; min: number; max: number }
  | { kind: "perStudent"; amount: number }
  | { kind: "custom" }
  | { kind: "none" };

export type ServiceItem = {
  id: string; title: string; description: string; audience: string; badge: string; scene: SceneId; price: PriceDisplay; published: boolean;
};
export type PackageTier = {
  id: string; name: string; description: string; audience: string; price: PriceDisplay; featured: boolean; features: string[]; more: string[];
};
export type RunningCost = { id: string; item: string; amount: number };
export type WorkItem = {
  id: string; category: "Design" | "Development"; title: string; challenge: string; result: string; published: boolean;
  imagePath?: string | null;
};
export type Partner = {
  id: string; name: string; category: string; note: string; link: string; status: "active" | "pending"; published: boolean;
  logoPath?: string | null;
};
export type Referrer = {
  id: string; name: string; email: string; whatsapp: string; rate: number; status: "active" | "paused"; joinedAt: string;
};
export type MessageTemplate = { id: string; type: LeadType | "birthday"; label: string; body: string };
export type Settings = { whatsappNumber: string; birthdayDiscount: number; commissionMin: number; commissionMax: number };
export type Activity = { id: string; at: string; actorId: string; action: string; target: string };

/** Everything the prototype keeps in the browser. Later: one database table (or more) per key. */
export type Db = {
  staff: Staff[];
  leads: Lead[];
  deals: Deal[];
  payments: Payment[];
  campaigns: Campaign[];
  services: ServiceItem[];
  packages: PackageTier[];
  runningCosts: RunningCost[];
  work: WorkItem[];
  partners: Partner[];
  referrers: Referrer[];
  templates: MessageTemplate[];
  settings: Settings;
  activity: Activity[];
};
