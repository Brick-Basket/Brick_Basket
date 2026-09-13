import type { ContractCategory } from "@/types/domain/contract";

/**
 * Project Cost Accounting — Finance, Part 15.
 *
 * Owner requirements (§8A): "Cost capture across supply/service/composite
 * categories (civil, mechanical, electrical, plumbing & sanitary,
 * finishing, labour, other)" plus a budget/actual/variance view with
 * over/under indicators.
 *
 * `category` reuses `ContractCategory` rather than defining a new,
 * near-identical 7-value union matching the owner's literal Part 15 text
 * (which omits `design_consultancy`) — the same category set is already
 * shared by `Contract`/`ContractLineItem` (Part 5, built ahead of schedule
 * from this exact requirement) and `ACEItem` (Part 8). `CostEntry` is the
 * third module to reuse it, closing the loop `docs/OPEN_QUESTIONS.md` #23
 * already anticipated. Still CONFIGURABLE / not owner-confirmed — swap
 * the shared union the moment the client supplies the real category list.
 *
 * One `CostEntry` row is a per-project, per-category budget vs. actual
 * figure — a flat record with no status/workflow, the same shape as
 * `ACEItem`/`StockEntry`. **FRONTEND IMPLEMENTATION DECISION**:
 * `actualAmount` is a manually-entered number for now, not auto-aggregated
 * from Payments/Receipts, because that module (Part 16) doesn't exist yet.
 * See docs/OPEN_QUESTIONS.md #36.
 */
export interface CostEntry {
  id: string;
  projectId: string;
  category: ContractCategory;
  /** Rupees — budgeted spend for this project/category. */
  budgetAmount: number;
  /** Rupees — actual spend for this project/category, manually entered. */
  actualAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCostEntryInput = Omit<CostEntry, "id" | "createdAt" | "updatedAt">;

export type UpdateCostEntryInput = Partial<Omit<CreateCostEntryInput, "projectId" | "category">>;
