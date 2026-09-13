/**
 * Fixed Assets — Finance, Part 17 (§8E).
 *
 * Owner requirements, in full: "Assets under organization with individual
 * value above ₹5,000." The ₹5,000 threshold is the one owner-confirmed
 * business rule this module has — it defines what counts as a "fixed
 * asset" worth tracking at all, not a field the frontend invented.
 * Everything else (category vocabulary, lifecycle status, the rest of the
 * field list) is a **FRONTEND IMPLEMENTATION DECISION** — see
 * `docs/OPEN_QUESTIONS.md` #38.
 *
 * `category` is an invented, generic asset-type vocabulary — no owner
 * text names one. `projectId`/`vendorId` are both optional: an asset can
 * be site-specific (a project's own tools/machinery) or org-wide (office
 * furniture, a company vehicle), and not every asset traces back to a
 * formal `Vendor` purchase. `status` is a simple two-value lifecycle
 * (active/disposed) — the owner text doesn't ask for one, but "assets
 * under organization" implies some are eventually retired; kept
 * deliberately minimal (no depreciation schedule, no confirmed
 * depreciation method) since nothing in the owner text asks for one.
 */
export type FixedAssetCategory = "equipment" | "vehicle" | "furniture" | "it_computer" | "tools_machinery" | "other";

export type FixedAssetStatus = "active" | "disposed";

export interface FixedAsset {
  id: string;
  assetName: string;
  category: FixedAssetCategory;
  /** Rupees — must be above ₹5,000 per the owner's stated threshold; enforced in `FixedAssetForm`. */
  value: number;
  purchaseDate: string;
  /** → `Vendor.id`, when the asset was bought from a vendor already on file. */
  vendorId?: string;
  /** → `Project.id`, when the asset is assigned to one project rather than the organization as a whole. */
  projectId?: string;
  serialNumber?: string;
  status: FixedAssetStatus;
  /** Set only when `status === "disposed"`. */
  disposedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateFixedAssetInput = Omit<FixedAsset, "id" | "createdAt" | "updatedAt">;

export type UpdateFixedAssetInput = Partial<CreateFixedAssetInput>;
