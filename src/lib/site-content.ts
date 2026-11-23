import "server-only";
import { createClient } from "@supabase/supabase-js";
import { formatPrice } from "@/lib/control-room/price";
import { naira } from "@/lib/control-room/format";
import type { PriceDisplay } from "@/lib/control-room/types";
import type { SceneId } from "@/types/scene";
import { defaultSiteContent, type SiteContent } from "@/types/site-content";

export { defaultSiteContent, type SiteContent };

/**
 * Server reader that fetches published content for the public showroom.
 * Gracefully falls back to static data if Supabase is unavailable or queries fail.
 */
export async function getSiteContent(): Promise<SiteContent> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return defaultSiteContent;
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    const [servicesRes, packagesRes, costsRes, workRes, partnersRes, settingsRes] =
      await Promise.all([
        supabase
          .from("services")
          .select("*")
          .eq("published", true)
          .order("position", { ascending: true }),
        supabase
          .from("packages")
          .select("*")
          .order("position", { ascending: true }),
        supabase
          .from("running_costs")
          .select("*")
          .order("position", { ascending: true }),
        supabase
          .from("work_items")
          .select("*")
          .eq("published", true)
          .order("position", { ascending: true }),
        supabase
          .from("partners")
          .select("*")
          .eq("published", true)
          .eq("status", "active")
          .order("position", { ascending: true }),
        supabase
          .from("settings")
          .select("whatsapp_number")
          .eq("id", true)
          .maybeSingle(),
      ]);

    // Services
    let services = defaultSiteContent.services;
    if (servicesRes.data && servicesRes.data.length > 0) {
      services = servicesRes.data.map((row) => {
        const pObj = (
          typeof row.price === "object" && row.price !== null
            ? row.price
            : { kind: "none" }
        ) as PriceDisplay;
        const priceStr = formatPrice(pObj);
        return {
          scene: (row.scene || "web") as SceneId,
          title: String(row.title || ""),
          description: String(row.description || ""),
          audience: String(row.audience || ""),
          price: priceStr || undefined,
          badge: row.badge ? String(row.badge) : undefined,
        };
      });
    }

    // Packages
    let packages = defaultSiteContent.packages;
    if (packagesRes.data && packagesRes.data.length > 0) {
      packages = packagesRes.data.map((row) => {
        const pObj = (
          typeof row.price === "object" && row.price !== null
            ? row.price
            : { kind: "custom" }
        ) as PriceDisplay;
        const priceStr = formatPrice(pObj) || "Custom quote after consultation";
        return {
          name: String(row.name || ""),
          description: String(row.description || ""),
          audience: String(row.audience || ""),
          price: priceStr,
          features: Array.isArray(row.features) ? (row.features as string[]) : [],
          more: Array.isArray(row.more) ? (row.more as string[]) : [],
          featured: Boolean(row.featured),
        };
      });
    }

    // Running Costs
    let runningCosts = defaultSiteContent.runningCosts;
    if (costsRes.data && costsRes.data.length > 0) {
      runningCosts = costsRes.data.map((row) => ({
        item: String(row.item || ""),
        amount: row.amount != null ? naira(Number(row.amount)) : "₦0",
      }));
    }

    // Work Items
    let work = defaultSiteContent.work;
    if (workRes.data && workRes.data.length > 0) {
      work = workRes.data.map((row) => ({
        category: (row.category || "Design") as "Design" | "Development",
        title: String(row.title || ""),
        challenge: String(row.challenge || ""),
        result: String(row.result || ""),
        imagePath: row.image_path ? String(row.image_path) : null,
      }));
    }

    // Partners
    let partnerTiles = defaultSiteContent.partnerTiles;
    const partnerLogos: Record<string, string> = {};
    if (partnersRes.data && partnersRes.data.length > 0) {
      partnerTiles = partnersRes.data.map((row) => {
        const name = String(row.name || "");
        if (row.logo_path) {
          partnerLogos[name] = String(row.logo_path);
        }
        return name;
      });
    }

    // WhatsApp Number
    let whatsappNumber = defaultSiteContent.whatsappNumber;
    if (settingsRes.data?.whatsapp_number) {
      const cleaned = String(settingsRes.data.whatsapp_number).replace(/\D/g, "");
      if (cleaned.length >= 9) {
        whatsappNumber = cleaned;
      }
    }

    return {
      services,
      packages,
      runningCosts,
      work,
      partnerTiles,
      partnerLogos,
      whatsappNumber,
    };
  } catch (err) {
    console.warn("[site-content] Falling back to static data:", err);
    return defaultSiteContent;
  }
}
