/**
 * Pure calculation logic for the Cost Estimator's Bill of Quantities (BOQ),
 * split out from `cost-estimator-section.tsx` so it can be unit tested in
 * isolation — same convention as this app's other `*-math.ts` files (e.g.
 * `src/components/schedule/schedule-monthly-plan-math.ts`).
 *
 * BOTTOM-UP MODEL (post-Part-20, "where do these BOQ numbers come from"
 * follow-up — see docs/OPEN_QUESTIONS.md #67): every row's `amount` is now
 * `quantity × a real, admin-maintained ₹-per-unit rate`
 * (`BoqRateItem.ratePerUnit`, `/admin/pricing-content`) — genuinely
 * bottom-up, not derived from a percentage share of a total the way this
 * module used to work (see `docs/CHANGELOG.md`'s entry for the old model,
 * if you're diffing against a previous version). `quantity` itself is still
 * `builtUpAreaSqft × qtyPerSqft`, where `qtyPerSqft` is a standard,
 * publicly-known Indian residential construction thumb-rule coefficient
 * (never owner-confirmed) — that part is unchanged.
 *
 * One consequence, worth restating here since it's easy to miss reading
 * only the code: this BOQ's own total (sum of these 11 real, bottom-up
 * amounts) is **not** forced to equal the headline "Estimated Project Cost"
 * (built-up area × the package's own published ₹/sqft rate from
 * `CONSTRUCTION_PACKAGES`, src/lib/content/public-site.ts — a separate,
 * owner-confirmed number). The two describe the same build from two
 * independent sources and can legitimately differ a little — that's honest,
 * not a bug, and the UI copy in `cost-estimator-section.tsx` says so.
 *
 * A real Bill of Quantities is still produced from actual structural
 * drawings and a specific site's conditions — this remains an indicative
 * approximation for budgeting purposes only, labeled as such everywhere
 * it's shown.
 */

import type { BoqRateItem, BoqTradeGroup } from "@/types/domain/boq-rate-item";

export type { BoqTradeGroup };

export interface BoqRow {
  key: string;
  label: string;
  unit: string;
  quantity: number;
  /** The real, admin-maintained rate actually used for this row at this tier — no longer derived/back-calculated from anything. */
  rate: number;
  amount: number;
  /** "structure" = shell/core trades, same rate at every tier. "finish" = trades whose rate can genuinely vary by tier. Shown in the "How these estimates are calculated" panel. */
  group: BoqTradeGroup;
  /** The per-sqft coefficient this row's quantity was derived from — surfaced so the panel can show the formula, not just the result. */
  qtyPerSqft: number;
  /** true when `minQty` was applied (i.e. the raw area-derived quantity would have rounded down to something unrealistically small) — lets the panel say so explicitly instead of silently overriding the formula. */
  minQtyApplied: boolean;
  /** Copied from the source rate item, so the panel can say "rounded up to a whole number" vs. "rounded to 1 decimal place" without re-deriving it. */
  discrete: boolean;
  /** This row's share of the BOQ's own total (computed from real amounts, not assumed as an input), as a 0–100 percentage. */
  costSharePercent: number;
  /** This same item's rate at the Essential tier, for comparison — lets the panel show "₹X at Essential → ₹Y at this tier" concretely for a finish item, instead of an abstract percentage shift. */
  essentialRatePerUnit: number;
  /** Plain-language explanation, copied from the source `BoqRateItem.rationale`. */
  rationale: string;
}

const TIER_SLUGS = ["essential", "smart", "premium", "signature"] as const;
type TierSlug = (typeof TIER_SLUGS)[number];
function isTierSlug(value: string | undefined): value is TierSlug {
  return !!value && (TIER_SLUGS as readonly string[]).includes(value);
}

/**
 * Builds the BOQ line items for a given built-up area and package tier,
 * from the admin-maintained `BoqRateItem[]` (fetch via `useBoqRates()`,
 * `src/hooks/use-boq-rates.ts` — this function itself takes no dependency
 * on the adapter, so it stays pure and unit-testable). An unrecognized/
 * omitted `tierSlug` falls back to each item's `essential` rate.
 */
export function computeBoqRows(builtUpAreaSqft: number, tierSlug: string | undefined, rateItems: BoqRateItem[]): BoqRow[] {
  if (builtUpAreaSqft <= 0 || rateItems.length === 0) return [];
  const tier: TierSlug = isTierSlug(tierSlug) ? tierSlug : "essential";

  const rows = rateItems.map((item) => {
    const rawQty = builtUpAreaSqft * item.qtyPerSqft;
    const minQtyApplied = !!item.minQty && rawQty < item.minQty;
    const flooredQty = item.minQty ? Math.max(rawQty, item.minQty) : rawQty;
    const quantity = item.discrete ? Math.ceil(flooredQty) : Math.round(flooredQty * 10) / 10;
    const rate = item.ratePerUnit[tier];
    const amount = quantity * rate;
    return {
      key: item.key,
      label: item.label,
      unit: item.unit,
      quantity,
      rate,
      amount,
      group: item.group,
      qtyPerSqft: item.qtyPerSqft,
      minQtyApplied,
      discrete: item.discrete,
      essentialRatePerUnit: item.ratePerUnit.essential,
      rationale: item.rationale,
    };
  });

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  return rows.map((r) => ({ ...r, costSharePercent: total > 0 ? (r.amount / total) * 100 : 0 }));
}

export function sumBoqAmount(rows: BoqRow[]): number {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

/**
 * FEATURE ADDITION (this pass — owner asked for "exactly more features what
 * JSW One Homes are providing"): JSW's estimator offers an "I just know my
 * plot area" path alongside its "I have all details / built-up area" path.
 * This app's estimator only ever had the second (you type Plinth Area
 * directly) — this adds the first as a genuine second input mode, rather
 * than a cosmetic relabeling.
 *
 * Plot Area (the total land you own) is not the same thing as Plinth Area
 * (the building's ground-floor footprint) — a plot always has some setback/
 * open space around the building per local building bylaws. There's no
 * BrickBasket-confirmed ground-coverage figure for this, so rather than
 * silently assuming one number, the calculator asks which coverage
 * percentage to assume and lets the visitor change it — the resulting
 * Plinth Area is always shown as "derived from" so nobody mistakes it for
 * an exact input. 65% is offered as the default because it's a commonly
 * cited typical permissible ground coverage for individual residential
 * plots under Indian municipal byelaws (varies significantly by city/plot
 * size/zone in reality) — a reasonable starting assumption, not a legal
 * guarantee for any specific site. See docs/OPEN_QUESTIONS.md.
 */
export const GROUND_COVERAGE_OPTIONS = [50, 55, 60, 65, 70, 75] as const;
export const DEFAULT_GROUND_COVERAGE_PERCENT = 65;

export function derivePlinthAreaFromPlot(plotAreaSqft: number, groundCoveragePercent: number): number {
  if (plotAreaSqft <= 0 || groundCoveragePercent <= 0) return 0;
  return Math.round(plotAreaSqft * (groundCoveragePercent / 100));
}

export interface PackageEstimate {
  slug: string;
  name: string;
  low: number;
  high: number;
}

/**
 * FEATURE ADDITION (this pass): a side-by-side "all 4 packages, for this
 * exact size" comparison — computed the same way the headline estimate is
 * (built-up area × each package's own real ₹/sqft rate), just for every
 * tier at once instead of only the selected one. Keeps this app's existing
 * documented improvement over JSW (showing real tiers openly rather than
 * one opaque number) visible even after a specific package is chosen.
 */
export function computeAllPackageEstimates(
  builtUpAreaSqft: number,
  packages: { slug: string; name: string; rateMin: number; rateMax: number }[],
): PackageEstimate[] {
  if (builtUpAreaSqft <= 0) return [];
  return packages.map((pkg) => ({
    slug: pkg.slug,
    name: pkg.name,
    low: builtUpAreaSqft * pkg.rateMin,
    high: builtUpAreaSqft * pkg.rateMax,
  }));
}

export interface BoqGroupSummary {
  structureTotal: number;
  finishTotal: number;
  structurePercent: number;
  finishPercent: number;
}

/**
 * FEATURE ADDITION (this pass): totals the BOQ's already-tier-adjusted rows
 * by trade group, for the "Structure vs. Finish" proportion bar in the
 * results panel — a simple, honest visualization of the same split
 * `getTierAdjustedCostShare` already computes per item, at a glance.
 */
export function summarizeBoqByGroup(rows: BoqRow[]): BoqGroupSummary {
  const structureTotal = rows.filter((r) => r.group === "structure").reduce((sum, r) => sum + r.amount, 0);
  const finishTotal = rows.filter((r) => r.group === "finish").reduce((sum, r) => sum + r.amount, 0);
  const total = structureTotal + finishTotal;
  return {
    structureTotal,
    finishTotal,
    structurePercent: total > 0 ? (structureTotal / total) * 100 : 0,
    finishPercent: total > 0 ? (finishTotal / total) * 100 : 0,
  };
}
