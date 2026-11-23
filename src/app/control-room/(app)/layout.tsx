import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Shell } from "@/components/control-room/shell/Shell";
import { StaffProvider } from "@/components/control-room/shell/StaffProvider";
import { createClient } from "@/lib/supabase/server";
import type { Staff } from "@/lib/control-room/types";

export default async function AppLayout({ children }: { children: ReactNode }) {
  let staff: Staff | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/control-room/login");
    }

    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal.data?.currentLevel !== "aal2") {
      redirect("/control-room/login");
    }

    const { data: staffRow } = await supabase
      .from("staff")
      .select("id,name,email,role,status,last_seen_at")
      .eq("id", user.id)
      .single();

    if (!staffRow || staffRow.status !== "active") {
      redirect("/control-room/login");
    }

    staff = {
      id: staffRow.id,
      name: staffRow.name,
      email: staffRow.email,
      role: staffRow.role,
      status: staffRow.status,
      lastSeen: staffRow.last_seen_at,
    };
  } catch (e: unknown) {
    // If it's a Next.js redirect error, rethrow it so navigation works
    if (e && typeof e === "object" && "digest" in e && typeof e.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) {
      throw e;
    }

    // In dev mode with unconfigured Supabase, provide fallback staff
    if (process.env.NODE_ENV !== "production") {
      staff = {
        id: "staff_owner",
        name: "Albert (Dev)",
        email: "owner@albertnelly.com",
        role: "owner",
        status: "active",
        lastSeen: null,
      };
    } else {
      redirect("/control-room/login");
    }
  }

  return (
    <StaffProvider staff={staff}>
      <Shell>{children}</Shell>
    </StaffProvider>
  );
}
