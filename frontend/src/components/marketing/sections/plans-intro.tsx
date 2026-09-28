"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";
import { CONSTRUCTION_PACKAGES } from "@/lib/content/public-site";
import { useLanguage } from "@/components/providers/language-provider";
import { PACKAGE_HI } from "@/lib/i18n/translations";

/**
 * `/plans` page's own chrome — eyebrow/title/intro paragraph and the 4
 * package cards (core features + "Best for"). Extracted out of
 * `plans/page.tsx` (a Server Component that keeps its own SEO `metadata`
 * export — same reason `HeroSection`/`ClosingCtaSection` were extracted from
 * the Home page, see those files) so this piece alone can read
 * `useLanguage()` for bilingual support (docs/OPEN_QUESTIONS.md #77).
 * `coreFeatures`/`bestFor` translate via `PACKAGE_HI`; the package tier
 * names themselves (Essential/Smart/Premium/Signature) stay English.
 *
 * Deliberately has no `<section>`/container wrapper of its own — `page.tsx`
 * keeps the single outer `<section className="container py-16 md:py-20">`
 * that also holds `PackageComparisonTable`, `PackageSpecsAccordion` and
 * `PlansCta`, exactly matching this page's original single-section layout.
 */
export function PlansIntro() {
  const { lang, t } = useLanguage();

  return (
    <>
      <SectionHeading eyebrow={t("plans.eyebrow")} title={t("plans.title")} />
      <p className="mx-auto mt-4 max-w-2xl text-center text-ink-muted">{t("plans.intro")}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CONSTRUCTION_PACKAGES.map((pkg) => {
          const tr = lang === "hi" ? PACKAGE_HI[pkg.slug] : undefined;
          return (
            <div key={pkg.slug} className="flex flex-col rounded-card border border-border bg-surface p-6 shadow-card">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-red">{pkg.name}</span>
              <span className="mt-1 font-heading text-2xl font-bold text-ink">
                ₹{pkg.rateMin.toLocaleString("en-IN")}
                {pkg.rateMax !== pkg.rateMin && `–₹${pkg.rateMax.toLocaleString("en-IN")}`}
                <span className="text-xs font-normal text-ink-muted"> /sqft</span>
              </span>
              <p className="mt-3 text-sm text-ink-muted">{tr?.coreFeatures ?? pkg.coreFeatures}</p>
              <p className="mt-3 text-xs font-medium text-ink">
                {t("plans.bestFor")}: {tr?.bestFor ?? pkg.bestFor}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

/**
 * The closing CTA button — last thing in `page.tsx`'s single section, after
 * the (server-rendered) Package Comparison Table and Specs Accordion. Kept
 * in this same file as `PlansIntro` since both are this one page's chrome.
 */
export function PlansCta() {
  const { t } = useLanguage();
  return (
    <div className="mt-10 text-center">
      <Link href={PUBLIC_ROUTES.contact} className={buttonVariants({ size: "lg" })}>
        {t("plans.ctaButton")} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
