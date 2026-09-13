import type { DPRWorkCategory, DPRWorkItemMaster } from "@/types/domain/dpr";

/**
 * The full owner-specified DPR work-item master list (§7C) — Civil (23),
 * Electrical (15), Plumbing & Sanitary (18), Finishing (21) = 77 items
 * total, transcribed verbatim from the owner requirements, item numbers
 * included. Centralized here (not scattered across components) is what
 * "configurable master data" means in this build — see `dpr.ts`'s header
 * comment on why this isn't an adapter-backed entity.
 *
 * Ids follow `<category>_<slNo>` (e.g. `civil_13`). The last row of each
 * category is that category's "Other ___ work" catch-all, `isOtherCatchAll:
 * true`, with an empty `uom` — the owner list doesn't give one, so the UOM
 * field for those rows is left free-text/editable rather than disabled.
 */
export const DPR_WORK_ITEMS: DPRWorkItemMaster[] = [
  // Civil Works (23)
  { id: "civil_1", category: "civil", slNo: 1, description: "Site clearance", uom: "Sq.m", isOtherCatchAll: false },
  { id: "civil_2", category: "civil", slNo: 2, description: "Earthwork/Excavation", uom: "Cum", isOtherCatchAll: false },
  { id: "civil_3", category: "civil", slNo: 3, description: "PCC", uom: "Cum", isOtherCatchAll: false },
  { id: "civil_4", category: "civil", slNo: 4, description: "Footing reinforcement", uom: "MT", isOtherCatchAll: false },
  { id: "civil_5", category: "civil", slNo: 5, description: "Footing shuttering", uom: "Sq.m", isOtherCatchAll: false },
  { id: "civil_6", category: "civil", slNo: 6, description: "Footing concrete", uom: "Cum", isOtherCatchAll: false },
  { id: "civil_7", category: "civil", slNo: 7, description: "Column reinforcement", uom: "MT", isOtherCatchAll: false },
  { id: "civil_8", category: "civil", slNo: 8, description: "Column shuttering", uom: "Sq.m", isOtherCatchAll: false },
  { id: "civil_9", category: "civil", slNo: 9, description: "Column concrete", uom: "Cum", isOtherCatchAll: false },
  { id: "civil_10", category: "civil", slNo: 10, description: "Plinth beam", uom: "Cum", isOtherCatchAll: false },
  { id: "civil_11", category: "civil", slNo: 11, description: "Backfilling", uom: "Cum", isOtherCatchAll: false },
  { id: "civil_12", category: "civil", slNo: 12, description: "Floor PCC", uom: "Cum", isOtherCatchAll: false },
  { id: "civil_13", category: "civil", slNo: 13, description: "Brick/block masonry", uom: "Cum/Sq.m", isOtherCatchAll: false },
  { id: "civil_14", category: "civil", slNo: 14, description: "Lintel", uom: "Rmt", isOtherCatchAll: false },
  { id: "civil_15", category: "civil", slNo: 15, description: "Slab reinforcement", uom: "MT", isOtherCatchAll: false },
  { id: "civil_16", category: "civil", slNo: 16, description: "Slab shuttering", uom: "Sq.m", isOtherCatchAll: false },
  { id: "civil_17", category: "civil", slNo: 17, description: "Slab concrete", uom: "Cum", isOtherCatchAll: false },
  { id: "civil_18", category: "civil", slNo: 18, description: "Staircase", uom: "Item", isOtherCatchAll: false },
  { id: "civil_19", category: "civil", slNo: 19, description: "Internal plaster", uom: "Sq.m", isOtherCatchAll: false },
  { id: "civil_20", category: "civil", slNo: 20, description: "External plaster", uom: "Sq.m", isOtherCatchAll: false },
  { id: "civil_21", category: "civil", slNo: 21, description: "Screed/floor leveling", uom: "Sq.m", isOtherCatchAll: false },
  { id: "civil_22", category: "civil", slNo: 22, description: "Waterproofing", uom: "Sq.m", isOtherCatchAll: false },
  { id: "civil_23", category: "civil", slNo: 23, description: "Other civil work", uom: "", isOtherCatchAll: true },

  // Electrical Works (15)
  { id: "electrical_1", category: "electrical", slNo: 1, description: "Electrical conduit – concealed", uom: "Rmt", isOtherCatchAll: false },
  { id: "electrical_2", category: "electrical", slNo: 2, description: "Junction boxes", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_3", category: "electrical", slNo: 3, description: "Switch/socket boxes", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_4", category: "electrical", slNo: 4, description: "Cable/wire laying", uom: "Rmt", isOtherCatchAll: false },
  { id: "electrical_5", category: "electrical", slNo: 5, description: "DB installation", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_6", category: "electrical", slNo: 6, description: "MCB/RCCB/RCBO", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_7", category: "electrical", slNo: 7, description: "Earthing", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_8", category: "electrical", slNo: 8, description: "Main cable", uom: "Rmt", isOtherCatchAll: false },
  { id: "electrical_9", category: "electrical", slNo: 9, description: "Light fixtures", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_10", category: "electrical", slNo: 10, description: "Fans", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_11", category: "electrical", slNo: 11, description: "Switches & sockets", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_12", category: "electrical", slNo: 12, description: "Exhaust fans", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_13", category: "electrical", slNo: 13, description: "External lighting", uom: "Nos", isOtherCatchAll: false },
  { id: "electrical_14", category: "electrical", slNo: 14, description: "Testing & commissioning", uom: "Item", isOtherCatchAll: false },
  { id: "electrical_15", category: "electrical", slNo: 15, description: "Other electrical work", uom: "", isOtherCatchAll: true },

  // Plumbing & Sanitary (18)
  { id: "plumbing_1", category: "plumbing_sanitary", slNo: 1, description: "Cold-water piping", uom: "Rmt", isOtherCatchAll: false },
  { id: "plumbing_2", category: "plumbing_sanitary", slNo: 2, description: "Hot-water piping", uom: "Rmt", isOtherCatchAll: false },
  { id: "plumbing_3", category: "plumbing_sanitary", slNo: 3, description: "Soil pipe", uom: "Rmt", isOtherCatchAll: false },
  { id: "plumbing_4", category: "plumbing_sanitary", slNo: 4, description: "Waste pipe", uom: "Rmt", isOtherCatchAll: false },
  { id: "plumbing_5", category: "plumbing_sanitary", slNo: 5, description: "Rainwater pipe", uom: "Rmt", isOtherCatchAll: false },
  { id: "plumbing_6", category: "plumbing_sanitary", slNo: 6, description: "Floor trap", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_7", category: "plumbing_sanitary", slNo: 7, description: "Gully trap", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_8", category: "plumbing_sanitary", slNo: 8, description: "Inspection chamber", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_9", category: "plumbing_sanitary", slNo: 9, description: "Water tank", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_10", category: "plumbing_sanitary", slNo: 10, description: "Pump installation", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_11", category: "plumbing_sanitary", slNo: 11, description: "WC installation", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_12", category: "plumbing_sanitary", slNo: 12, description: "Wash basin", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_13", category: "plumbing_sanitary", slNo: 13, description: "Kitchen sink", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_14", category: "plumbing_sanitary", slNo: 14, description: "Shower/mixer", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_15", category: "plumbing_sanitary", slNo: 15, description: "Health faucet", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_16", category: "plumbing_sanitary", slNo: 16, description: "Sanitary accessories", uom: "Nos", isOtherCatchAll: false },
  { id: "plumbing_17", category: "plumbing_sanitary", slNo: 17, description: "Pressure/leakage testing", uom: "Item", isOtherCatchAll: false },
  { id: "plumbing_18", category: "plumbing_sanitary", slNo: 18, description: "Other plumbing/sanitary", uom: "", isOtherCatchAll: true },

  // Finishing Works (21)
  { id: "finishing_1", category: "finishing", slNo: 1, description: "Floor tiles", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_2", category: "finishing", slNo: 2, description: "Wall tiles", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_3", category: "finishing", slNo: 3, description: "Marble/granite", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_4", category: "finishing", slNo: 4, description: "Skirting", uom: "Rmt", isOtherCatchAll: false },
  { id: "finishing_5", category: "finishing", slNo: 5, description: "Putty", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_6", category: "finishing", slNo: 6, description: "Internal painting", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_7", category: "finishing", slNo: 7, description: "External painting", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_8", category: "finishing", slNo: 8, description: "Doors", uom: "Nos", isOtherCatchAll: false },
  { id: "finishing_9", category: "finishing", slNo: 9, description: "Door frames", uom: "Nos", isOtherCatchAll: false },
  { id: "finishing_10", category: "finishing", slNo: 10, description: "Windows", uom: "Nos", isOtherCatchAll: false },
  { id: "finishing_11", category: "finishing", slNo: 11, description: "Aluminium/UPVC works", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_12", category: "finishing", slNo: 12, description: "Glass works", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_13", category: "finishing", slNo: 13, description: "False ceiling", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_14", category: "finishing", slNo: 14, description: "Kitchen counter", uom: "Rmt", isOtherCatchAll: false },
  { id: "finishing_15", category: "finishing", slNo: 15, description: "Modular kitchen", uom: "Item", isOtherCatchAll: false },
  { id: "finishing_16", category: "finishing", slNo: 16, description: "Wardrobes", uom: "Item", isOtherCatchAll: false },
  { id: "finishing_17", category: "finishing", slNo: 17, description: "Railings", uom: "Rmt", isOtherCatchAll: false },
  { id: "finishing_18", category: "finishing", slNo: 18, description: "Waterproofing/Sealant", uom: "Sq.m", isOtherCatchAll: false },
  { id: "finishing_19", category: "finishing", slNo: 19, description: "Cleaning", uom: "Item", isOtherCatchAll: false },
  { id: "finishing_20", category: "finishing", slNo: 20, description: "Landscaping", uom: "Item", isOtherCatchAll: false },
  { id: "finishing_21", category: "finishing", slNo: 21, description: "Other finishing", uom: "", isOtherCatchAll: true },
];

export const DPR_WORK_CATEGORY_CONFIG: Record<DPRWorkCategory, { label: string; order: number }> = {
  civil: { label: "Civil Works", order: 1 },
  electrical: { label: "Electrical Works", order: 2 },
  plumbing_sanitary: { label: "Plumbing & Sanitary", order: 3 },
  finishing: { label: "Finishing Works", order: 4 },
};

export function getDPRWorkItem(id: string): DPRWorkItemMaster | undefined {
  return DPR_WORK_ITEMS.find((i) => i.id === id);
}

export function dprWorkItemsByCategory(category: DPRWorkCategory): DPRWorkItemMaster[] {
  return DPR_WORK_ITEMS.filter((i) => i.category === category).sort((a, b) => a.slNo - b.slNo);
}
