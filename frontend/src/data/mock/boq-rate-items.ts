import type { BoqRateItem } from "@/types/domain/boq-rate-item";

/**
 * Seed data for the 11 BOQ line items (see docs/OPEN_QUESTIONS.md #67).
 * Every `qtyPerSqft` below is unchanged from the original `BOQ_ITEM_TEMPLATES`
 * thumb-rule coefficients (standard, publicly-known Indian residential
 * construction rules of thumb — never owner-confirmed, same status as
 * before). Every `ratePerUnit` is a **frontend-estimated starting value**
 * — a plausible current general-market ₹ figure for that material/fixture
 * grade, not a BrickBasket-confirmed supplier rate or a number the owner
 * has reviewed. These are meant to be corrected by whoever actually
 * maintains BrickBasket's real material costs, via `/admin/pricing-content`
 * — not presented to a site visitor as owner-verified pricing until someone
 * with real rate knowledge has reviewed and adjusted them.
 */
export const mockBoqRateItems: BoqRateItem[] = [
  {
    id: "boq_cement",
    key: "cement",
    label: "Cement",
    unit: "bags",
    qtyPerSqft: 0.4,
    group: "structure",
    discrete: false,
    ratePerUnit: { essential: 400, smart: 400, premium: 400, signature: 400 },
    rationale:
      "Cement goes into the foundation, columns, beams, slabs and plastering — everywhere concrete or mortar is used. 0.4 bags per sqft of built-up area is a standard rule of thumb for a typical RCC-framed Indian home. ₹400/bag is a frontend-estimated general-market starting rate (a 50kg OPC/PPC bag) — confirm against your actual supplier rate. Held flat across every tier: how much cement a home needs depends on its structural size, not how premium its finishes are.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_steel",
    key: "steel",
    label: "Steel (TMT Bars)",
    unit: "kg",
    qtyPerSqft: 4,
    group: "structure",
    discrete: false,
    ratePerUnit: { essential: 65, smart: 65, premium: 65, signature: 65 },
    rationale:
      "TMT reinforcement bars go into the same structural elements as cement — foundation, columns, beams and slabs. 4 kg per sqft is a standard residential thumb-rule (the real figure depends on the structural engineer's design). ₹65/kg is a frontend-estimated general-market starting rate — confirm against your actual supplier rate. Held flat across tiers, same reasoning as cement.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_bricks",
    key: "bricks",
    label: "Bricks / Blocks",
    unit: "nos",
    qtyPerSqft: 8,
    group: "structure",
    discrete: true,
    ratePerUnit: { essential: 8, smart: 8, premium: 8, signature: 8 },
    rationale:
      "Covers brick/block masonry for external and internal walls, at a standard coverage rate of 8 units per sqft. ₹8/unit is a frontend-estimated starting rate — actual cost differs meaningfully between standard clay brick and the Hollow Concrete Blocks the Premium-tier proposal specifically names (this model doesn't yet distinguish the two — see docs/OPEN_QUESTIONS.md #60). Confirm the real rate for whichever material each tier actually uses.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_sand",
    key: "sand",
    label: "Sand",
    unit: "cft",
    qtyPerSqft: 1.2,
    group: "structure",
    discrete: false,
    ratePerUnit: { essential: 45, smart: 45, premium: 45, signature: 45 },
    rationale:
      "Fine aggregate, mixed with cement for concrete, mortar and plastering. 1.2 cft per sqft follows the same structural-size logic as cement and steel. ₹45/cft is a frontend-estimated general-market starting rate — sand pricing varies significantly by region and source, confirm locally.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_aggregate",
    key: "aggregate",
    label: "Aggregate",
    unit: "cft",
    qtyPerSqft: 0.9,
    group: "structure",
    discrete: false,
    ratePerUnit: { essential: 55, smart: 55, premium: 55, signature: 55 },
    rationale:
      "Coarse aggregate (crushed stone), mixed with cement and sand for the foundation, columns, beams and slabs. 0.9 cft per sqft follows the same structural-size logic as the other core materials. ₹55/cft is a frontend-estimated general-market starting rate — confirm against your actual supplier rate.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_flooring",
    key: "flooring",
    label: "Flooring / Tiles",
    unit: "sqft",
    qtyPerSqft: 1.0,
    group: "finish",
    discrete: false,
    ratePerUnit: { essential: 45, smart: 65, premium: 95, signature: 140 },
    rationale:
      "Roughly 1 sqft of flooring material per sqft of built-up area — the whole floor gets covered regardless of tier, so quantity doesn't change. The four rates are frontend-estimated starting points for a rough grade progression (vitrified tile → better vitrified/marble-look → natural stone/premium wood-finish → imported marble/engineered wood) and should be corrected to whatever BrickBasket actually specifies per tier.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_paint",
    key: "paint",
    label: "Paint & Finishing",
    unit: "litres",
    qtyPerSqft: 0.12,
    group: "finish",
    discrete: false,
    ratePerUnit: { essential: 180, smart: 230, premium: 320, signature: 450 },
    rationale:
      "Interior/exterior paint, primer and finishing coats, at a standard coverage rate of 0.12 litres per sqft. Surface area doesn't change by tier; the four rates are a frontend-estimated starting progression (economy emulsion → premium emulsion → weather-shield/textured → luxury/designer finish) — correct to whatever BrickBasket actually specifies per tier.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_doors_windows",
    key: "doors-windows",
    label: "Doors & Windows",
    unit: "nos",
    qtyPerSqft: 0.012,
    group: "finish",
    minQty: 6,
    discrete: true,
    ratePerUnit: { essential: 6000, smart: 9000, premium: 14000, signature: 22000 },
    rationale:
      "A home of this size needs a broadly similar count of doors/windows regardless of finish grade (minimum 6 assumed). The four rates are a frontend-estimated starting progression (laminate/basic aluminum → better hardware → solid wood/UPVC → premium engineered wood + designer hardware) per unit — correct to real supplier/vendor rates.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_plumbing",
    key: "plumbing",
    label: "Plumbing & Sanitary Fixtures",
    unit: "points",
    qtyPerSqft: 0.008,
    group: "finish",
    minQty: 4,
    discrete: true,
    ratePerUnit: { essential: 3500, smart: 5000, premium: 8000, signature: 13000 },
    rationale:
      "Water supply and drainage points for kitchens/bathrooms/utility areas (minimum 4 assumed). Point count doesn't change by tier; the four rates are a frontend-estimated starting progression for sanitaryware/CP-fitting brand and quality per point — correct to real supplier rates.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_electrical",
    key: "electrical",
    label: "Electrical Points & Wiring",
    unit: "points",
    qtyPerSqft: 0.0125,
    group: "finish",
    minQty: 8,
    discrete: true,
    ratePerUnit: { essential: 1200, smart: 1800, premium: 2800, signature: 4500 },
    rationale:
      "Switch/socket/light points throughout the home (minimum 8 assumed). Point count is driven by room layout, not finish level; the four rates are a frontend-estimated starting progression for wiring gauge and modular switch/fitting quality per point — correct to real supplier rates.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
  {
    id: "boq_labor",
    key: "labor",
    label: "Skilled & Unskilled Labor",
    unit: "mandays",
    qtyPerSqft: 1.5,
    group: "structure",
    discrete: true,
    ratePerUnit: { essential: 700, smart: 700, premium: 700, signature: 700 },
    rationale:
      "Covers only core structural labor — masons, bar-benders, general labor for foundation/RCC/masonry — at 1.5 mandays per sqft. Does not double-count finishing-trade labor (already bundled into each finish item's own rate above, the way a contractor's finishing quote usually bundles material and fixing labor together). ₹700/manday is a frontend-estimated blended skilled+unskilled starting rate — confirm against your actual labor costs. Held flat across tiers: core structural labor scales with build size, not finish level.",
    updatedAt: "2026-09-27T00:00:00.000Z",
  },
];
