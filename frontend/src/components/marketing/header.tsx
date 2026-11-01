"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, UserCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useSession } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { LanguageSwitcher } from "@/components/marketing/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MAIN_NAV, PUBLIC_ROUTES, PORTAL_ROUTES, ADMIN_ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";

/**
 * `MAIN_NAV` (`src/lib/constants/routes.ts`) stays the single English
 * source of truth for hrefs/order — this just maps each href to its
 * translation key, so a Hindi visitor sees translated labels without
 * touching that shared route data (also read by the footer's Quick Links).
 */
const NAV_LABEL_KEY: Record<string, string> = {
  "/#home": "nav.home",
  "/#about": "nav.about",
  "/#services": "nav.services",
  "/#how-it-works": "nav.howItWorks",
  "/#cost-estimator": "nav.costEstimator",
  "/#projects": "nav.projects",
  "/#why-us": "nav.whyUs",
  "/#faq": "nav.faq",
  "/#contact": "nav.contact",
};

/**
 * Public-site header. Client component because of the mobile nav
 * disclosure state, the session-aware account link (Login vs. My
 * Account), and the scroll-spy below.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 8): this header used to have no active-route indication at all — every
 * nav link looked identical regardless of which page you were on. Added
 * `usePathname()` + `aria-current="page"` + a visual active state, the
 * same pattern the internal shell's `NavLink` (`components/shell/sidebar.tsx`)
 * already uses, for both the desktop and mobile nav.
 *
 * FRONTEND IMPLEMENTATION DECISION (one-page site pass): MAIN_NAV hrefs are
 * now in-page anchors (`/#about`, `/#services`, ...) pointing at sections
 * stacked on the Home page — see src/app/(public)/page.tsx and
 * src/lib/constants/routes.ts. A plain `pathname === href` match no longer
 * works once every href points at the same page, so active-state tracking
 * now also uses an IntersectionObserver (only while on the Home page) to
 * know which anchored section is currently in view. See
 * docs/OPEN_QUESTIONS.md #46.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { status, session } = useSession();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isHome = pathname === PUBLIC_ROUTES.home;
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    if (!isHome) return;

    const sectionIds = MAIN_NAV.filter((item) => item.href.startsWith("/#")).map((item) =>
      item.href.replace("/#", ""),
    );
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    // Tracks which anchored section is currently scrolled into view so the
    // nav can highlight it. `rootMargin` shrinks the observed viewport to a
    // band near the top, so the section whose heading has just crossed
    // under the sticky header is the one that lights up.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        const topMost = visible.reduce((closest, entry) =>
          entry.boundingClientRect.top < closest.boundingClientRect.top ? entry : closest,
        );
        setActiveSection(topMost.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHome]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) {
      return isHome && activeSection === href.replace("/#", "");
    }
    return pathname === href || (href !== PUBLIC_ROUTES.home && pathname.startsWith(`${href}/`));
  };

  const accountHref =
    status === "authenticated" && session
      ? session.user.roles.includes("customer")
        ? PORTAL_ROUTES.home
        : ADMIN_ROUTES.home
      : PUBLIC_ROUTES.login;
  const accountLabel = status === "authenticated" ? t("nav.myAccount") : t("nav.login");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href={PUBLIC_ROUTES.home} aria-label="BrickBasket home">
          {/* FRONTEND FIX (dark mode): this header's background is
              `bg-surface`, which flips dark in dark mode (see globals.css's
              `:root.dark`) — the "light" logo variant is a dark-charcoal-
              colored wordmark meant for a light surface, so left fixed at
              "light" it would go illegible against the now-dark header.
              Every other `<Logo variant="dark">` call site (footer, mobile
              nav drawer, admin/portal sidebar) already sits on the brand's
              fixed-charcoal background in both themes, so only this one
              needed to become theme-aware. */}
          <Logo variant={theme === "dark" ? "dark" : "light"} size="md" />
        </Link>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-6" aria-label="Main">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap text-[13px] font-medium hover:text-brand-red xl:text-sm",
                isActive(item.href) ? "text-brand-red" : "text-ink",
              )}
            >
              {t(NAV_LABEL_KEY[item.href] ?? "") || item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex xl:gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link
            href={accountHref}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-ink hover:text-brand-red xl:text-sm"
          >
            <UserCircle className="h-4 w-4" aria-hidden />
            {accountLabel}
          </Link>
          <Link href={PUBLIC_ROUTES.contact} className={cn(buttonVariants({ size: "md" }), "shrink-0 whitespace-nowrap")}>
            {t("nav.getQuote")}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink lg:hidden"
          aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-surface lg:hidden"
          aria-label="Mobile"
        >
          <div className="container flex flex-col gap-1 py-3">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium hover:bg-surface-muted",
                  isActive(item.href) ? "bg-brand-red/10 text-brand-red" : "text-ink",
                )}
                onClick={() => setOpen(false)}
              >
                {t(NAV_LABEL_KEY[item.href] ?? "") || item.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
              onClick={() => setOpen(false)}
            >
              <UserCircle className="h-4 w-4" aria-hidden />
              {accountLabel}
            </Link>
            <Link
              href={PUBLIC_ROUTES.contact}
              className="mt-2 rounded-md bg-brand-red px-3 py-2 text-center text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              {t("nav.getQuote")}
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
