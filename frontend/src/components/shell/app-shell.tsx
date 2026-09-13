"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Sidebar, NavList } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";
import { Logo } from "@/components/brand/logo";
import { PORTAL_NAV, ADMIN_NAV } from "@/components/shell/nav-config";

/**
 * Composes Sidebar + Topbar + Breadcrumbs + a mobile drawer around a
 * protected route's content. Used by both the (portal) and (internal)
 * layouts — see docs/COMPONENT_GUIDE.md.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 fix): `navGroups` used to
 * be a prop supplied by each layout (a Server Component). `NavItem.icon`
 * holds a raw lucide-react component reference, and a Server Component may
 * not pass a function reference as a prop into a Client Component — React
 * throws "Functions cannot be passed directly to Client Components" /
 * "Only plain objects can be passed to Client Components from Server
 * Components" at runtime. This never surfaced in static verification
 * (no `tsc`/`next dev` in this environment) and only appeared once the app
 * was actually run. Fix: AppShell (already `"use client"`) now looks up the
 * right nav config itself from its own `variant` prop, so the icon-bearing
 * config never crosses the server→client boundary as a prop. See
 * docs/OPEN_QUESTIONS.md for the logged entry.
 */
export function AppShell({
  variant,
  homeHref,
  homeLabel,
  showProjectSelector,
  profileHref,
  children,
}: {
  variant: "portal" | "admin";
  homeHref: string;
  homeLabel: string;
  showProjectSelector?: boolean;
  profileHref?: string;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navGroups = variant === "admin" ? ADMIN_NAV : PORTAL_NAV;

  return (
    <div data-shell={variant} className="flex min-h-screen bg-surface-muted">
      {/* Skip-to-content link — Part 19 accessibility pass. Visually
         hidden until focused (keyboard/screen-reader only), jumps past the
         sidebar/topbar straight to `#main-content` below. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-brand-red focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>
      <Sidebar groups={navGroups} homeHref={homeHref} />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            aria-hidden
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex w-72 flex-col bg-brand-charcoal px-4 py-6">
            <div className="flex items-center justify-between px-3">
              <Logo variant="dark" size="sm" />
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-md text-white/70 hover:bg-white/10"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto" onClick={() => setMobileNavOpen(false)}>
              <NavList groups={navGroups} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setMobileNavOpen(true)}
          showProjectSelector={showProjectSelector ?? true}
          profileHref={profileHref}
        />
        <Breadcrumbs rootHref={homeHref} rootLabel={homeLabel} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
