import type { CostEntry } from "@/types/domain/cost-entry";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/cost-adapter.ts.
 *
 * Figures are illustrative demo data only, deliberately different from
 * the owner requirements' example budget (Civil ₹35L, Electrical ₹7L,
 * Plumbing & Sanitary ₹5L, Mechanical/HVAC ₹4L, Finishing ₹15L, Labour
 * ₹8L, Other ₹3L, Total ₹77L) — per `docs/PART_PROMPTS.md`'s Part 15
 * instruction to use "clearly-labeled illustrative figures (not the
 * owner's example numbers presented as real)". None of these numbers are
 * owner-confirmed.
 *
 * `proj_modern_residence` covers all 8 `ContractCategory` values and
 * exercises all three variance states (over/under/on-budget).
 * `proj_luxury_villa` covers only 4 categories, to exercise "no entry for
 * this category yet" gaps in the summary view. `proj_commercial_complex`
 * has no entries at all, to exercise the page's empty state.
 */
export const mockCostEntries: CostEntry[] = [
  // proj_modern_residence — full spread, all 8 categories
  {
    id: "cost_1",
    projectId: "proj_modern_residence",
    category: "civil",
    budgetAmount: 4_200_000,
    actualAmount: 4_450_000,
    createdAt: "2026-04-01T05:00:00.000Z",
    updatedAt: "2026-08-15T05:00:00.000Z",
  },
  {
    id: "cost_2",
    projectId: "proj_modern_residence",
    category: "electrical",
    budgetAmount: 950_000,
    actualAmount: 890_000,
    createdAt: "2026-04-01T05:00:00.000Z",
    updatedAt: "2026-08-10T05:00:00.000Z",
  },
  {
    id: "cost_3",
    projectId: "proj_modern_residence",
    category: "plumbing_sanitary",
    budgetAmount: 620_000,
    actualAmount: 620_000,
    createdAt: "2026-04-01T05:00:00.000Z",
    updatedAt: "2026-08-05T05:00:00.000Z",
  },
  {
    id: "cost_4",
    projectId: "proj_modern_residence",
    category: "mechanical",
    budgetAmount: 480_000,
    actualAmount: 560_000,
    notes: "HVAC ducting revised upward after site survey.",
    createdAt: "2026-04-01T05:00:00.000Z",
    updatedAt: "2026-08-20T05:00:00.000Z",
  },
  {
    id: "cost_5",
    projectId: "proj_modern_residence",
    category: "finishing",
    budgetAmount: 1_800_000,
    actualAmount: 1_650_000,
    createdAt: "2026-04-01T05:00:00.000Z",
    updatedAt: "2026-08-25T05:00:00.000Z",
  },
  {
    id: "cost_6",
    projectId: "proj_modern_residence",
    category: "labour",
    budgetAmount: 1_100_000,
    actualAmount: 1_180_000,
    createdAt: "2026-04-01T05:00:00.000Z",
    updatedAt: "2026-08-28T05:00:00.000Z",
  },
  {
    id: "cost_7",
    projectId: "proj_modern_residence",
    category: "design_consultancy",
    budgetAmount: 350_000,
    actualAmount: 300_000,
    createdAt: "2026-04-01T05:00:00.000Z",
    updatedAt: "2026-06-01T05:00:00.000Z",
  },
  {
    id: "cost_8",
    projectId: "proj_modern_residence",
    category: "other",
    budgetAmount: 250_000,
    actualAmount: 260_000,
    createdAt: "2026-04-01T05:00:00.000Z",
    updatedAt: "2026-08-30T05:00:00.000Z",
  },
  // proj_luxury_villa — partial coverage (4 of 8 categories)
  {
    id: "cost_9",
    projectId: "proj_luxury_villa",
    category: "civil",
    budgetAmount: 6_500_000,
    actualAmount: 6_200_000,
    createdAt: "2026-05-20T05:00:00.000Z",
    updatedAt: "2026-08-12T05:00:00.000Z",
  },
  {
    id: "cost_10",
    projectId: "proj_luxury_villa",
    category: "electrical",
    budgetAmount: 1_200_000,
    actualAmount: 1_350_000,
    notes: "Upgraded to concealed copper wiring per customer request.",
    createdAt: "2026-05-20T05:00:00.000Z",
    updatedAt: "2026-08-18T05:00:00.000Z",
  },
  {
    id: "cost_11",
    projectId: "proj_luxury_villa",
    category: "finishing",
    budgetAmount: 3_000_000,
    actualAmount: 3_000_000,
    createdAt: "2026-05-20T05:00:00.000Z",
    updatedAt: "2026-08-22T05:00:00.000Z",
  },
  {
    id: "cost_12",
    projectId: "proj_luxury_villa",
    category: "labour",
    budgetAmount: 1_800_000,
    actualAmount: 1_700_000,
    createdAt: "2026-05-20T05:00:00.000Z",
    updatedAt: "2026-08-24T05:00:00.000Z",
  },
  // proj_commercial_complex — intentionally no entries (empty state)
];
