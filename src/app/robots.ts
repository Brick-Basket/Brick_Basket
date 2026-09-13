import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brickbasket.co.in";

/**
 * BrickBasket final hardening pass — SEO. This app has exactly three
 * kinds of route (see `docs/ROUTES.md`), and each gets a deliberate,
 * stated crawl decision rather than a default:
 *
 * - **Public marketing pages** (`/`, `/about`, `/services`, etc.) — the
 *   only content this app wants indexed. Allowed, and listed in
 *   `sitemap.ts`.
 * - **`/admin/*` and `/dashboard/*`** — the internal operations app and
 *   the signed-in customer portal. Neither has any content a search
 *   engine visitor could use anyway (both sit behind this app's
 *   client-side `AuthGuard`, see `docs/AUTHENTICATION.md`), and both would
 *   be actively wrong to surface in search results. Disallowed.
 * - **`/login`** — a deliberate, explicit decision, not an oversight: this
 *   route is left crawlable (not disallowed) because it's a legitimate
 *   public entry point with nothing sensitive on it, but it is left out of
 *   `sitemap.ts` because it has no content of its own worth ranking. A
 *   search engine is free to find and index it via the nav link every
 *   public page already carries; this file just doesn't actively promote
 *   it the way it promotes real content pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/dashboard", "/dashboard/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
