import type { ACEUnitOfMeasure } from "@/types/domain/ace-item";

/**
 * UOM dropdown options for the Accepted Cost Estimate module — Document 2
 * correction: "UOM should be a predefined dropdown, not free text." The
 * first 6 (KG, Sq.ft, Nos., Meter, MT, Sq.mt) are owner-specified
 * verbatim. The remaining 4 are a FRONTEND IMPLEMENTATION DECISION, added
 * to cover units already used by this module's own seed data — see
 * `src/types/domain/ace-item.ts`'s header comment and
 * docs/OPEN_QUESTIONS.md #82.
 */
export const ACE_UOM_CONFIG: Record<ACEUnitOfMeasure, { label: string }> = {
  kg: { label: "KG" },
  sq_ft: { label: "Sq.ft" },
  nos: { label: "Nos." },
  meter: { label: "Meter" },
  mt: { label: "MT" },
  sq_mt: { label: "Sq.mt" },
  bag_50kg: { label: "Bag (50kg)" },
  cu_ft: { label: "Cu.ft" },
  litre: { label: "Litre" },
  nos_1000: { label: "1000 Nos." },
};

export const ACE_UOM_ORDER: ACEUnitOfMeasure[] = ["kg", "sq_ft", "nos", "meter", "mt", "sq_mt", "bag_50kg", "cu_ft", "litre", "nos_1000"];
