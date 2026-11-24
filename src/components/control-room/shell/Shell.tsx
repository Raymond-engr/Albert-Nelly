"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { auth } from "@/lib/control-room/api";
import { areaForPath, can, NAV, roleLabel } from "@/lib/control-room/roles";
import { useHydrated, useSession, useDbStatus, useDbRefresh } from "@/lib/control-room/store";
import { ApiError } from "@/lib/control-room/http";
import { toast } from "@/lib/control-room/toast";
import type { Staff } from "@/lib/control-room/types";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "../ui/Brand";
import { Icon } from "../ui/Icon";
import { Avatar, btn, EmptyState } from "../ui/kit";

function Sidebar({ staff, pathname, isSyncing, onNavigate }: { staff: Staff; pathname: string; isSyncing?: boolean; onNavigate?: () => void }) {
  const items = NAV.filter((n) => can(staff.role, n.area));
  const groups = [...new Set(items.map((n) => n.group))];
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <div className="flex items-center justify-between">
        <Link href="/control-room" onClick={onNavigate} className="flex flex-wrap items-center gap-2 text-ink no-underline">
          <Brand />
          <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-semibold text-deep">Control Room</span>
        </Link>
        {isSyncing && (
          <span className="flex items-center gap-1 rounded-full bg-mint/30 px-2 py-0.5 text-[10px] font-medium text-ink/70" title="Syncing updates in background...">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-deep" />
            Syncing
          </span>
        )}
      </div>
      <nav aria-label="Control Room" className="flex flex-col gap-5">
        {groups.map((g) => (
          <div key={g || "top"} className="flex flex-col gap-1">
            {g && <div className="px-3 pb-1 text-xs font-semibold text-ink/60">{g}</div>}
            {items.filter((n) => n.group === g).map((n) => {
              const on = n.href === "/control-room" ? pathname === n.href : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.area}
                  href={n.href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium no-underline ${on ? "bg-mint text-deep" : "text-ink hover:bg-cloud"}`}
                >
                  <Icon name={n.icon} size={18} />
                  {n.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex items-center gap-3">
          <Avatar name={staff.name} />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold">{staff.name}</div>
            <div className="text-sm text-ink/70">{roleLabel(staff.role)}</div>
          </div>
        </div>
        <div className="flex pt-1">
          <button type="button" className={btn("outline", "sm", "w-full justify-center")} onClick={() => { onNavigate?.(); void auth.signOut(); }}>
            <Icon name="logout" size={16} /> <span className="ml-1.5">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Frame of every signed-in screen: sidebar, mobile menu, prototype banner and the access check. */
export function Shell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const staff = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const { status, error, isSyncing, hasLoaded } = useDbStatus();
  const refresh = useDbRefresh();

  // Load snapshot data once staff session is confirmed
  useEffect(() => {
    if (hydrated && staff) {
      void refresh();
    }
  }, [hydrated, staff, refresh]);

  // Toast any background sync errors without disrupting the workspace
  useEffect(() => {
    if (error && hasLoaded) {
      toast(`Background sync error: ${error}`, "error");
    }
  }, [error, hasLoaded]);

  // Handle unhandled ApiErrors with global toast notification
  useEffect(() => {
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      if (reason instanceof ApiError) {
        e.preventDefault();
        toast(reason.message, "error");
        if (reason.status === 409) {
          void refresh();
        }
      }
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [refresh]);

  // Realtime: subscribe to new lead insertions.
  // The Shell only renders after the (app)/layout.tsx guard confirms an aal2 session,
  // so the subscription is always authenticated.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("leads-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const lead = payload.new as { name?: string; service?: string };
          const detail = [lead.name, lead.service].filter(Boolean).join(" — ");
          toast(`New lead: ${detail || "someone"}`, "ok");
          void refresh();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  // TODO(integration): the server checks the session (proxy.ts + a layout check) before anything is sent.
  useEffect(() => {
    if (hydrated && !staff) router.replace("/control-room/login");
  }, [hydrated, staff, router]);

  useEffect(() => {
    if (!menu) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      removeEventListener("keydown", onKey);
    };
  }, [menu]);

  if (!hydrated || !staff) {
    return <div className="grid min-h-svh place-items-center bg-cloud text-sm text-ink/70 dark:bg-paper">Opening the Control Room…</div>;
  }

  const allowed = can(staff.role, areaForPath(pathname));
  return (
    <div className="min-h-svh bg-cloud text-ink dark:bg-paper lg:grid lg:grid-cols-[264px_1fr]">
      <a href="#cr-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[80] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">Skip to content</a>
      <aside className="sticky top-0 hidden h-svh border-r border-line bg-paper lg:block">
        <Sidebar staff={staff} pathname={pathname} isSyncing={isSyncing} />
      </aside>
      {menu && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="w-72 max-w-[85vw] bg-paper shadow-xl">
            <Sidebar staff={staff} pathname={pathname} isSyncing={isSyncing} onNavigate={() => setMenu(false)} />
          </div>
          <button type="button" className="flex-1 bg-ink/40" aria-label="Close menu" onClick={() => setMenu(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper px-4 py-2 lg:hidden">
          <button type="button" className={btn("ghost", "sm", "!px-2")} aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
            <Icon name="menu" size={22} />
          </button>
          <Brand />
          <div className="flex items-center gap-2">
            {isSyncing && (
              <span className="flex items-center gap-1 rounded-full bg-mint/30 px-1.5 py-0.5 text-[10px] font-medium text-ink/70">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-deep" />
              </span>
            )}
            <Avatar name={staff.name} size={32} />
          </div>
        </div>
        <main id="cr-main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {!allowed ? (
            <EmptyState icon="shield" title="This screen isn’t available to your role" action={<Link href="/control-room" className={btn("outline")}>Back to the overview</Link>}>
              Ask an Owner if you need access to this area.
            </EmptyState>
          ) : status === "loading" && !hasLoaded ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint border-t-deep" />
              <p className="mt-4 text-sm font-medium text-ink/70">Opening the Control Room…</p>
            </div>
          ) : status === "error" && !hasLoaded ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
              <h3 className="text-base font-semibold">Unable to load Control Room snapshot</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error || "A connection or network error occurred."}</p>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  className={btn("brand", "sm")}
                  onClick={() => void refresh()}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
