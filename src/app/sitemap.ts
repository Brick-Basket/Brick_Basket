import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";

// Same placeholder-until-confirmed domain `src/app/layout.tsx` already uses
// for metadataBase/Open Graph — see docs/OPEN_QUESTIONS.md #17. Set
// NEXT_PUBLIC_SITE_URL to the real production domain before launch; this
// file reads it the same way so both stay in sync automatically.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brickbasket.co.in";

/**
 * BrickBasket final hardening pass — SEO. Only the public marketing pages
 * belong here: they are the only routes this app wants indexed at all (see
 * `robots.ts`, which disallows everything else). Every URL below is one of
 * this app's own confirmed, real public routes (`PUBLIC_ROUTES`, mirroring
 * `docs/ROUTES.md`) — nothing invented beyond what's actually configured.
 *
 * `/login` is deliberately excluded: it's a real, crawlable, public route
 * (not blocked in `robots.ts`), but it's an auth entry point with no content
 * of its own to rank in search — listing it here would be noise, not a
 * genuine page worth a search engine's attention. This is the "login
 * behavior is intentional" decision `robots.ts`'s header comment also
 * names.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicPages: { path: string; priority: number }[] = [
    { path: PUBLIC_ROUTES.home, priority: 1 },
    { path: PUBLIC_ROUTES.about, priority: 0.8 },
    { path: PUBLIC_ROUTES.services, priority: 0.8 },
    { path: PUBLIC_ROUTES.plans, priority: 0.7 },
    { path: PUBLIC_ROUTES.portfolio, priority: 0.7 },
    { path: PUBLIC_ROUTES.howItWorks, priority: 0.6 },
    { path: PUBLIC_ROUTES.whyUs, priority: 0.6 },
    { path: PUBLIC_ROUTES.faq, priority: 0.5 },
    { path: PUBLIC_ROUTES.contact, priority: 0.8 },
  ];

  return publicPages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === PUBLIC_ROUTES.home ? "weekly" : "monthly",
    priority,
  }));
}
