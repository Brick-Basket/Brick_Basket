import type { StockMaterial } from "@/types/domain/stock-entry";

/**
 * Wastage — Store Management, Part 11.
 *
 * Owner requirements (§6D): "Materials procured above defined scope
 * should be categorized as wastage with quantity and value. Provide
 * wastage summary/detail UI." The exact scope-threshold rule (per-item,
 * per-category, or per-project) is not owner-confirmed — see
 * docs/OPEN_QUESTIONS.md #12. This build does not compute "above scope"
 * automatically against ACE/Requisition quantities; a wastage entry is
 * simply logged by whoever records it, at the moment they judge material
 * to be over-scope. Reuses `StockMaterial` (this module's own reference
 * list) rather than a separate wastage-category union, for consistency
 * with the Stock Statement module.
 */
export interface WastageEntry {
  id: string;
  projectId: string;
  material: StockMaterial;
  /** Free-text name, only meaningful when `material === "other"`. */
  otherMaterialName?: string;
  uom: string;
  quantity: number;
  /** Rupees — the value of the wasted quantity, per the owner's explicit "quantity and value." */
  value: number;
  reason?: string;
  recordedBy: string;
  recordedByName: string;
  /** ISO date — when the wastage was identified/logged. */
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateWastageEntryInput = Omit<WastageEntry, "id" | "createdAt" | "updatedAt" | "recordedBy" | "recordedByName">;

export type UpdateWastageEntryInput = Partial<Omit<CreateWastageEntryInput, "projectId">>;
