import type { DPRManpowerCategory } from "@/types/domain/dpr";

/**
 * Owner-specified, fixed manpower category list (§7C) — display order and
 * labels only; not a configurable/pending-confirmation vocabulary the way
 * `Lead.status` is. Source of truth for the union itself: `dpr.ts`'s
 * `DPRManpowerCategory`.
 */
export const DPR_MANPOWER_CATEGORIES: { value: DPRManpowerCategory; label: string }[] = [
  { value: "civil_mason", label: "Civil Mason" },
  { value: "carpenter", label: "Carpenter" },
  { value: "bar_bender", label: "Bar Bender" },
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "painter", label: "Painter" },
  { value: "tile_masonry_finishing", label: "Tile/Masonry Finishing" },
  { value: "other", label: "Other" },
];

export function manpowerCategoryLabel(category: DPRManpowerCategory): string {
  return DPR_MANPOWER_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}
