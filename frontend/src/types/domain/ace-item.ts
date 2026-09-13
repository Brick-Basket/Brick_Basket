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
 */
export interface ACEItem {
  id: string;
  projectId: string;
  category: ContractCategory;
  itemDescription: string;
  uom: string;
  /** Rupees per `uom` unit — a plain number, formatted only at render time. */
  rate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateACEItemInput = Omit<ACEItem, "id" | "createdAt" | "updatedAt">;

export type UpdateACEItemInput = Partial<Omit<CreateACEItemInput, "projectId">>;
