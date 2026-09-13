import type { StockMaterial } from "@/types/domain/stock-entry";

/**
 * Label map for the owner-confirmed reference material list (§6C),
 * shared by the Stock Statement and Wastage modules — both reuse
 * `StockMaterial` rather than defining separate near-identical unions.
 */
export const STOCK_MATERIAL_CONFIG: Record<StockMaterial, { label: string }> = {
  cement: { label: "Cement" },
  sand: { label: "Sand" },
  aggregate: { label: "Aggregate" },
  tmt_steel: { label: "TMT Steel" },
  bricks: { label: "Bricks" },
  tiles: { label: "Tiles" },
  pipes: { label: "Pipes" },
  electrical_cable: { label: "Electrical Cable" },
  paint: { label: "Paint" },
  sanitary_fixtures: { label: "Sanitary Fixtures" },
  other: { label: "Other" },
};

export const STOCK_MATERIAL_ORDER: StockMaterial[] = [
  "cement",
  "sand",
  "aggregate",
  "tmt_steel",
  "bricks",
  "tiles",
  "pipes",
  "electrical_cable",
  "paint",
  "sanitary_fixtures",
  "other",
];

/** Display label — falls back to the free-text `otherMaterialName` when `material === "other"`. */
export function stockMaterialLabel(material: StockMaterial, otherMaterialName?: string): string {
  if (material === "other" && otherMaterialName) return otherMaterialName;
  return STOCK_MATERIAL_CONFIG[material].label;
}
