import type { FixedAssetCategory, FixedAssetStatus } from "@/types/domain/fixed-asset";

export const FIXED_ASSET_CATEGORY_CONFIG: Record<FixedAssetCategory, { label: string }> = {
  equipment: { label: "Equipment" },
  vehicle: { label: "Vehicle" },
  furniture: { label: "Furniture" },
  it_computer: { label: "IT / Computer" },
  tools_machinery: { label: "Tools & Machinery" },
  other: { label: "Other" },
};

export const FIXED_ASSET_STATUS_CONFIG: Record<FixedAssetStatus, { label: string; variant: "success" | "neutral" }> = {
  active: { label: "Active", variant: "success" },
  disposed: { label: "Disposed", variant: "neutral" },
};

/** The owner's stated threshold (§8E) — this module tracks only assets valued above this amount. */
export const FIXED_ASSET_MIN_VALUE = 5_000;
