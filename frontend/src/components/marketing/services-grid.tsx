"use client";

import { Card } from "@/components/ui/card";
import { CONFIRMED_SERVICES } from "@/lib/content/public-site";
import { useLanguage } from "@/components/providers/language-provider";
import { SERVICES_HI } from "@/lib/i18n/translations";

/**
 * Shared services-card grid — used by the standalone `/services` page and by
 * the Home page's Services section, so the two can never drift apart (the
 * same reasoning `public-site.ts`'s header comment already applies to the
 * underlying data; this applies it to the rendering too).
 *
 * FRONTEND FIX (RSC serialization crash, reported via the user's own
 * `npm run dev` output — see docs/CHANGELOG.md): this used to accept a
 * `services` prop. Once this component picked up `useLanguage()` for the
 * Hindi pass (`"use client"`, docs/OPEN_QUESTIONS.md #77), every caller
 * became a Server Component passing `CONFIRMED_SERVICES` — whose items
 * carry a `LucideIcon` component reference — across the Server→Client RSC
 * boundary as a prop, which Next.js rejects at runtime ("Only plain objects
 * can be passed to Client Components...", "Functions cannot be passed
 * directly..."). Fix: import `CONFIRMED_SERVICES` directly instead, exactly
 * like `WhyUsSection`/`HowItWorksSection` already do for their own local
 * data — a Client Component importing data itself is always safe; only
 * receiving it as a prop from a Server Component parent is not. Both call
 * sites (`(public)/page.tsx`, `(public)/services/page.tsx`) had the
 * now-obsolete `services={CONFIRMED_SERVICES}` prop removed to match.
 */
export function ServicesGrid() {
  const { lang } = useLanguage();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {CONFIRMED_SERVICES.map((service) => {
        const Icon = service.icon;
        const tr = SERVICES_HI[service.title];
        const title = lang === "hi" && tr ? tr.title : service.title;
        const description = lang === "hi" && tr ? tr.description : service.description;
        return (
          <Card key={service.title} className="p-6 transition-shadow hover:shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-4 font-heading text-base font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm text-ink-muted">{description}</p>
          </Card>
        );
      })}
    </div>
  );
}
