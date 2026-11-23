import { requireStaff, handle } from "@/lib/control-room/server/guard";
import {
  rowToStaff,
  rowToLead,
  rowToDeal,
  rowToPayment,
  rowToCampaign,
  rowToService,
  rowToPackage,
  rowToRunningCost,
  rowToWorkItem,
  rowToPartner,
  rowToReferrer,
  rowToTemplate,
  rowToSettings,
  rowToActivity,
  shouldRedactPayments,
  shouldRedactCommission,
} from "@/lib/control-room/server/mappers";
import type { Db } from "@/lib/control-room/types";
import { seedDb } from "@/lib/control-room/demo";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    // Graceful offline development fallback if Supabase credentials are missing
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      return seedDb();
    }

    const { supabase, staff } = await requireStaff("overview", "view");

    const redactPayments = shouldRedactPayments(staff.role);
    const redactCommission = shouldRedactCommission(staff.role);

    // Parallel fetch across all tables
    const [
      staffRes,
      leadsRes,
      dealsRes,
      paymentsRes,
      campaignsRes,
      servicesRes,
      packagesRes,
      runningCostsRes,
      workRes,
      partnersRes,
      referrersRes,
      templatesRes,
      settingsRes,
      activityRes,
    ] = await Promise.all([
      supabase.from("staff").select("*").order("name"),
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("deals").select("*").order("created_at", { ascending: false }),
      redactPayments ? Promise.resolve({ data: [] }) : supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("services").select("*").order("position"),
      supabase.from("packages").select("*").order("position"),
      supabase.from("running_costs").select("*").order("position"),
      supabase.from("work_items").select("*").order("position"),
      supabase.from("partners").select("*").order("position"),
      supabase.from("referrers").select("*").order("joined_at", { ascending: false }),
      supabase.from("message_templates").select("*").order("type"),
      supabase.from("settings").select("*").maybeSingle(),
      supabase.from("activity_log").select("*").order("at", { ascending: false }).limit(200),
    ]);

    const db: Db = {
      staff: (staffRes.data || []).map(rowToStaff),
      leads: (leadsRes.data || []).map(rowToLead),
      deals: (dealsRes.data || []).map((row) => rowToDeal(row, redactCommission)),
      payments: redactPayments ? [] : (paymentsRes.data || []).map(rowToPayment),
      campaigns: (campaignsRes.data || []).map((row) => rowToCampaign(row)),
      services: (servicesRes.data || []).map(rowToService),
      packages: (packagesRes.data || []).map(rowToPackage),
      runningCosts: (runningCostsRes.data || []).map(rowToRunningCost),
      work: (workRes.data || []).map(rowToWorkItem),
      partners: (partnersRes.data || []).map(rowToPartner),
      referrers: (referrersRes.data || []).map(rowToReferrer),
      templates: (templatesRes.data || []).map(rowToTemplate),
      settings: rowToSettings(settingsRes.data),
      activity: (activityRes.data || []).map(rowToActivity),
    };

    return db;
  });
}
