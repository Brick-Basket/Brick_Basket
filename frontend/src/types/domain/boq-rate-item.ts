/**
 * A single material/labor line item's admin-maintained rate data, backing
 * the Cost Estimator's "Indicative Bill of Quantities" panel
 * (`cost-estimator-math.ts`'s `computeBoqRows`).
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20, "where do these BOQ
 * numbers come from" follow-up — see docs/OPEN_QUESTIONS.md #67): before
 * this entity existed, the BOQ model worked backwards from an abstract
 * "cost share" percentage of the package's own ₹/sqft total — e.g. "Cement
 * is always 16% of whatever the total estimate is" — and then *derived* an
 * implied "Est. Rate" by dividing that slice back down by quantity. That
 * produced numbers that could look like real market prices (₹876/bag
 * cement, ₹1,871/litre paint) without actually being ones — they were an
 * artifact of the percentage split and the specific project size, not a
 * real supplier rate anyone set or could verify. This entity flips the
 * model to be genuinely bottom-up instead: a real, admin-editable ₹-per-unit
 * rate for each of the 11 materials/labor items, so `amount = quantity ×
 * rate` directly, and the rate shown on screen is the actual number someone
 * typed into the admin panel — not a derived artifact of a total.
 *
 * One consequence, called out here rather than left implicit: the BOQ's own
 * total (sum of these 11 real, bottom-up amounts) is no longer forced to
 * exactly equal the headline "Estimated Project Cost" (built-up area × the
 * package's own published ₹/sqft rate, from `CONSTRUCTION_PACKAGES` in
 * `public-site.ts` — a completely separate, owner-confirmed number). The
 * two are related (both describe the same build) but independently
 * sourced, so a visible gap between them is expected and honest — it means
 * real material costs and the published package rate card have drifted
 * apart a little, which is normal, rather than a bug to hide by forcing
 * one number to match the other.
 */
export type BoqTradeGroup = "structure" | "finish";

/**
 * ₹ per unit, one value per package tier. For a "structure" item
 * (cement/steel/bricks/sand/aggregate/labor) all four values are always
 * kept equal by the admin UI — the rationale for every structure item
 * explicitly says its quality/cost doesn't change by finish tier, only its
 * quantity (which scales with built-up area, not tier). For a "finish" item
 * (flooring/paint/doors/plumbing/electrical), the four values can genuinely
 * differ — a Signature-tier fixture really does cost more per unit than an
 * Essential-tier one.
 */
export interface BoqTierRates {
  essential: number;
  smart: number;
  premium: number;
  signature: number;
}

export interface BoqRateItem {
  id: string;
  /** Stable slug — matches the Cost Estimator's calculation code, not admin-editable. */
  key: string;
  label: string;
  unit: string;
  /** Quantity of this unit per sqft of total built-up area (a standard construction thumb-rule coefficient) — admin-editable. */
  qtyPerSqft: number;
  /** "structure" = shell/core trades, same rate at every tier. "finish" = trades whose per-unit rate can genuinely vary by tier. Not admin-editable — changing which group an item belongs to is a calculation-model change, not a rate update. */
  group: BoqTradeGroup;
  /** Floor so a small project never shows an unrealistic quantity like "0 doors" — not admin-editable here (a calculation-model detail, same as `group`). */
  minQty?: number;
  /** true = a discrete, physically countable unit, always rounded up to a whole number. Not admin-editable. */
  discrete: boolean;
  /** The real, admin-maintained ₹-per-unit rate — this is the number that actually drives the BOQ total now. */
  ratePerUnit: BoqTierRates;
  /** Plain-language explanation, editable so an admin can correct or expand on it as real rates change. */
  rationale: string;
  updatedAt: string;
  /** Display name of whoever last saved a change — never trust a client-supplied value for this once a real backend exists (see docs/BACKEND_CLAUDE_HANDOFF.md §5). */
  updatedBy?: string;
}

export interface UpdateBoqRateItemInput {
  qtyPerSqft?: number;
  ratePerUnit?: Partial<BoqTierRates>;
  rationale?: string;
}
