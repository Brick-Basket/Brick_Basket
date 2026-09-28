import type { Metadata } from "next";
import { PageBanner } from "@/components/marketing/page-banner";
import { CostEstimatorSection } from "@/components/marketing/sections/cost-estimator-section";
import { PackageComparisonTable } from "@/components/marketing/sections/package-comparison-table";
import { PackageSpecsAccordion } from "@/components/marketing/sections/package-specs-accordion";
import { PlansIntro, PlansCta } from "@/components/marketing/sections/plans-intro";

export const metadata: Metadata = {
  title: "Plans & Packages",
  description:
    "Four real BrickBasket home construction packages — Essential, Smart, Premium and Signature — with published per-sqft rates, plus a live cost estimator.",
};

/**
 * FRONTEND IMPLEMENTATION DECISION: this page used to have no confirmed
 * package tiers or pricing at all (owner requirements only named a
 * confirmed service list), so it was built around that service list instead
 * of inventing tiers/prices — see docs/OPEN_QUESTIONS.md #15's original
 * text. The owner has since supplied real pricing (the proposal PDF's
 * "BRICKBASKET Home Construction Service-Packages", pages 5–9), now in
 * `CONSTRUCTION_PACKAGES` (`src/lib/content/public-site.ts`) — this page
 * shows those 4 real tiers plus the live Cost Estimator built on the same
 * data, shared with the Home page's one-pager section (`CostEstimatorSection`,
 * `id="cost-estimator"`) so the two can never drift. See
 * docs/OPEN_QUESTIONS.md #15/#58 for the still-open question of whether/how
 * the PDF's *second*, differently-named tier scheme (page 11, no pricing)
 * should also be reconciled here.
 */
export default function PlansPage() {
  return (
    <>
      <PageBanner pageKey="plans" />

      <section className="container py-16 md:py-20">
        <PlansIntro />

        <div className="mt-10">
          <PackageComparisonTable />
        </div>

        <div className="mt-10">
          <PackageSpecsAccordion />
        </div>

        <PlansCta />
      </section>

      <CostEstimatorSection showHeading />
    </>
  );
}
