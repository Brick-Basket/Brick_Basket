import type { ContractCategory } from "@/types/domain/contract";

/**
 * Accepted Cost Estimate (Part 8) — "predefined workable rates by work
 * category before project start." Each rate is associated with one
 * project, per the owner requirement's "Project association."
 *
 * `category` reuses `ContractCategory` rather than defining a new,
 * near-identical work-category union — the same 8-value set already
 * flagged CONFIGURABLE / not owner-confirmed in `contract.ts` and
 * `docs/OPEN_QUESTIONS.md` #23, now shared by a second module for
 * consistency (both are "workable rate by work category" concepts).
 *
 * `uom` — Document 2 correction: "UOM should be a predefined dropdown
 * (KG, Sq.ft, Nos., Meter, MT, Sq.mt), not free text." Those 6 values are
 * owner-specified verbatim and listed first in `ACE_UOM_ORDER`
 * (`src/components/ace/ace-uom-config.ts`); 4 additional units (Bag
 * (50kg), Cu.ft, Litre, 1000 Nos.) are appended after them — a
 * **FRONTEND IMPLEMENTATION DECISION** to cover units already present in
 * this module's own seed data that aren't in the owner's literal 6-value
 * list, rather than silently relabeling real demo rows to fit (same
 * "preserve real data, document the deviation" approach used for the
 * vendor code series' starting numbers in `vendor-config.ts`). See
 * docs/OPEN_QUESTIONS.md #82.
 */
export type ACEUnitOfMeasure = "kg" | "sq_ft" | "nos" | "meter" | "mt" | "sq_mt" | "bag_50kg" | "cu_ft" | "litre" | "nos_1000";

export interface ACEItem {
  id: string;
  projectId: string;
  category: ContractCategory;
  itemDescription: string;
  uom: ACEUnitOfMeasure;
  /** Rupees per `uom` unit — a plain number, formatted only at render time. */
  rate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateACEItemInput = Omit<ACEItem, "id" | "createdAt" | "updatedAt">;

export type UpdateACEItemInput = Partial<Omit<CreateACEItemInput, "projectId">>;
