import "server-only";
import type {
  Activity,
  Campaign,
  Deal,
  DealStage,
  Lead,
  LeadStatus,
  LeadType,
  MessageTemplate,
  PackageTier,
  Partner,
  Payment,
  PaymentCategory,
  PriceDisplay,
  Referrer,
  Role,
  RunningCost,
  SceneId,
  ServiceItem,
  Settings,
  Staff,
  WorkItem,
} from "../types";

export function rowToStaff(row: Record<string, unknown>): Staff {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    email: String(row.email || ""),
    role: (row.role || "sales") as Role,
    status: (row.status || "active") as Staff["status"],
    lastSeen: row.last_seen_at ? String(row.last_seen_at) : null,
  };
}

export function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    createdAt: String(row.created_at || new Date().toISOString()),
    type: (row.type || "hire") as LeadType,
    name: String(row.name || ""),
    email: String(row.email || ""),
    whatsapp: row.whatsapp ? String(row.whatsapp) : null,
    service: row.service ? String(row.service) : null,
    business: row.business_name ? String(row.business_name) : null,
    category: row.category ? String(row.category) : null,
    birthDay: row.birth_day != null ? Number(row.birth_day) : null,
    birthMonth: row.birth_month != null ? Number(row.birth_month) : null,
    context: row.context ? String(row.context) : null,
    source: String(row.source || "Website"),
    status: (row.status || "new") as LeadStatus,
    notes: String(row.notes || ""),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    dealId: row.deal_id ? String(row.deal_id) : null,
    ownerId: row.owner_id ? String(row.owner_id) : null,
  };
}

export function rowToDeal(row: Record<string, unknown>, redactCommission = false): Deal {
  return {
    id: String(row.id),
    title: String(row.title || ""),
    client: String(row.client || ""),
    service: String(row.service || ""),
    leadId: row.lead_id ? String(row.lead_id) : null,
    stage: (row.stage || "new") as DealStage,
    agreed: row.agreed != null ? Number(row.agreed) : 0,
    referrerId: row.referrer_id ? String(row.referrer_id) : null,
    commissionRate: redactCommission || row.commission_rate == null ? null : Number(row.commission_rate),
    ownerId: String(row.owner_id || ""),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
    notes: String(row.notes || ""),
  };
}

export function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    dealId: row.deal_id ? String(row.deal_id) : null,
    direction: (row.direction || "in") as "in" | "out",
    amount: row.amount != null ? Number(row.amount) : 0,
    date: String(row.paid_on || row.created_at || new Date().toISOString().slice(0, 10)),
    category: (row.category || "other") as PaymentCategory,
    note: String(row.note || ""),
    recordedBy: String(row.recorded_by || ""),
  };
}

export function rowToCampaign(
  row: Record<string, unknown>,
  recipientStats?: { delivered: number; opened: number; clicked: number; count: number }
): Campaign {
  const audienceStr = Array.isArray(row.audience_types)
    ? (row.audience_types as string[]).join(", ")
    : String(row.audience || "All Leads");

  return {
    id: String(row.id),
    name: String(row.name || ""),
    subject: String(row.subject || ""),
    template: (row.template || "promo") as Campaign["template"],
    audience: audienceStr,
    audienceSize: recipientStats?.count ?? (row.audience_size != null ? Number(row.audience_size) : 0),
    status: (row.status || "draft") as Campaign["status"],
    scheduledFor: row.scheduled_for ? String(row.scheduled_for) : null,
    sentAt: row.sent_at ? String(row.sent_at) : null,
    stats: recipientStats
      ? {
          delivered: recipientStats.delivered,
          opened: recipientStats.opened,
          clicked: recipientStats.clicked,
        }
      : ((row.stats as Campaign["stats"]) ?? null),
    body: String(row.body || ""),
  };
}

export function rowToService(row: Record<string, unknown>): ServiceItem {
  return {
    id: String(row.id),
    title: String(row.title || ""),
    description: String(row.description || ""),
    audience: String(row.audience || ""),
    badge: String(row.badge || ""),
    scene: (row.scene || "web") as SceneId,
    price: (typeof row.price === "object" && row.price !== null ? row.price : { kind: "none" }) as PriceDisplay,
    published: Boolean(row.published),
  };
}

export function rowToPackage(row: Record<string, unknown>): PackageTier {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    description: String(row.description || ""),
    audience: String(row.audience || ""),
    price: (typeof row.price === "object" && row.price !== null ? row.price : { kind: "custom" }) as PriceDisplay,
    featured: Boolean(row.featured),
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
    more: Array.isArray(row.more) ? (row.more as string[]) : [],
  };
}

export function rowToRunningCost(row: Record<string, unknown>): RunningCost {
  return {
    id: String(row.id),
    item: String(row.item || ""),
    amount: row.amount != null ? Number(row.amount) : 0,
  };
}

export function rowToWorkItem(row: Record<string, unknown>): WorkItem {
  return {
    id: String(row.id),
    category: (row.category || "Design") as "Design" | "Development",
    title: String(row.title || ""),
    challenge: String(row.challenge || ""),
    result: String(row.result || ""),
    published: Boolean(row.published),
    imagePath: row.image_path ? String(row.image_path) : null,
  };
}

export function rowToPartner(row: Record<string, unknown>): Partner {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    category: String(row.category || ""),
    note: String(row.note || ""),
    link: String(row.link || ""),
    status: (row.status || "pending") as "active" | "pending",
    published: Boolean(row.published),
    logoPath: row.logo_path ? String(row.logo_path) : null,
  };
}

export function rowToReferrer(row: Record<string, unknown>): Referrer {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    email: String(row.email || ""),
    whatsapp: String(row.whatsapp || ""),
    rate: row.rate != null ? Number(row.rate) : 0,
    status: (row.status || "active") as "active" | "paused",
    joinedAt: String(row.joined_at || new Date().toISOString()),
  };
}

export function rowToTemplate(row: Record<string, unknown>): MessageTemplate {
  return {
    id: String(row.id),
    type: (row.type || "hire") as LeadType | "birthday",
    label: String(row.label || ""),
    body: String(row.body || ""),
  };
}

export function rowToSettings(row: Record<string, unknown> | null | undefined): Settings {
  if (!row) {
    return {
      whatsappNumber: "0803 000 0000",
      birthdayDiscount: 10,
      commissionMin: 5,
      commissionMax: 10,
    };
  }
  return {
    whatsappNumber: String(row.whatsapp_number || "0803 000 0000"),
    birthdayDiscount: row.birthday_discount != null ? Number(row.birthday_discount) : 10,
    commissionMin: row.commission_min != null ? Number(row.commission_min) : 5,
    commissionMax: row.commission_max != null ? Number(row.commission_max) : 10,
  };
}

export function rowToActivity(row: Record<string, unknown>): Activity {
  return {
    id: String(row.id),
    at: String(row.at || new Date().toISOString()),
    actorId: String(row.actor_id || ""),
    action: String(row.action || ""),
    target: String(row.target || ""),
  };
}

/** Check whether payments array should be hidden/empty for this role. */
export function shouldRedactPayments(role: Role): boolean {
  return role !== "owner" && role !== "finance";
}

/** Check whether commissionRate on deals should be redacted to null for this role. */
export function shouldRedactCommission(role: Role): boolean {
  return role === "sales" || role === "content";
}
