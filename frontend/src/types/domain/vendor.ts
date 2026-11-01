/**
 * Vendor Management (Part 7). Every field below is owner-specified
 * verbatim from the requirements' "Vendor fields" list, with one
 * exception noted below.
 *
 * FRONTEND IMPLEMENTATION DECISION — `codeSeriesCategory` vs. `nature`:
 * the owner requirements name exactly 3 values for the vendor's "Nature"
 * field (Supply / Service / Service & Supply), but the vendor CODE series
 * table names 6 categories (Service & Supply, Service, Supply,
 * Specialised Work, Machinery Hiring, Design/Detailing/Consultancy) —
 * the last two have no corresponding `nature` value. Rather than force
 * a 6-value list into the 3-value `nature` field (or vice versa), this
 * type keeps both: `nature` is the owner-specified 3-value field shown
 * on the vendor record, and `codeSeriesCategory` is a separate field
 * that exists only to determine which of the 6 vendor-code series a
 * vendor's code is assigned from. See docs/OPEN_QUESTIONS.md #27.
 *
 * `codeSeriesCategory` is set once at creation and never edited
 * afterward — a vendor's code is a permanent identifier once assigned.
 */
export type VendorGSTCategory = "registered" | "non_registered";

export type VendorNature = "supply" | "service" | "service_and_supply";

/**
 * Determines vendor code assignment — see `src/components/vendors/vendor-config.ts`
 * for the series numbers/starting values, and the header comment above for
 * why this is a separate field from `nature`.
 */
export type VendorCodeSeriesCategory =
  | "service_and_supply"
  | "service"
  | "supply"
  | "specialised_work"
  | "machinery_hiring"
  | "design_detailing_consultancy";

export interface Vendor {
  id: string;
  /** Assigned by the backend/adapter at creation from `codeSeriesCategory`'s series — never client-supplied. */
  vendorCode: string;
  tradeName: string;
  gstCategory: VendorGSTCategory;
  /** Required when `gstCategory === "registered"`; not applicable otherwise. */
  gstin?: string;
  /**
   * Document 2 correction: PAN was missing from the vendor profile — added
   * as an optional field (not every vendor record in this mock dataset has
   * one on file) alongside the existing GSTIN/MSME-UDYAM identifiers. See
   * docs/OPEN_QUESTIONS.md #82.
   */
  panNumber?: string;
  address: string;
  /** Optional — not every vendor has MSME/UDYAM registration. */
  msmeUdyamNumber?: string;
  contactPerson: string;
  contactPersonDesignation: string;
  email: string;
  contactNumber: string;
  nature: VendorNature;
  codeSeriesCategory: VendorCodeSeriesCategory;
  /** Annual turnover in rupees — a plain number, formatted only at render time. */
  turnover: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateVendorInput = Omit<Vendor, "id" | "vendorCode" | "createdAt" | "updatedAt">;

/** `codeSeriesCategory` is intentionally excluded — immutable after creation, see the header comment. */
export type UpdateVendorInput = Partial<Omit<CreateVendorInput, "codeSeriesCategory">>;

/**
 * 0–10 assessment, owner-specified criteria verbatim. A vendor may be
 * assessed more than once over time (append-only history, same pattern as
 * `LeadActivity`/`ContractAuditEntry`/`DocumentVersion`) — the "rating
 * summary" required by the module is computed from this history, never
 * stored as a single field on `Vendor`. See
 * `src/components/vendors/vendor-rating.ts`.
 */
export interface VendorAssessment {
  id: string;
  vendorId: string;
  quality: number;
  timelineAdherence: number;
  futureBusinessProbability: number;
  presentCapacity: number;
  notes?: string;
  assessedBy: string;
  assessedByName: string;
  assessedAt: string;
}

export type CreateVendorAssessmentInput = Pick<
  VendorAssessment,
  "quality" | "timelineAdherence" | "futureBusinessProbability" | "presentCapacity" | "notes"
>;

/**
 * Document 2 correction: vendor document attachments — "option to attach
 * vendor documents (e.g. PAN card, GSTIN certificate, MSME/UDYAM
 * certificate, or other supporting documents), selecting the type of
 * document first." Modeled as its own append-only per-vendor list (same
 * "metadata-only, no real backend storage yet" treatment as
 * `Document`/`SiteUpdateMedia`): the uploaded file's bytes are kept only
 * as an in-memory object URL for this session
 * (`VendorsAdapter.getDocumentPreviewUrl`), never persisted — choosing a
 * file is optional, a document can be logged as metadata-only. See
 * docs/OPEN_QUESTIONS.md #82.
 */
export type VendorDocumentType = "pan_card" | "gstin_certificate" | "msme_udyam_certificate" | "other";

export interface VendorDocument {
  id: string;
  vendorId: string;
  documentType: VendorDocumentType;
  /** Free-text label — shown instead of the type's default label when set; typically only used for `"other"`. */
  label?: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

export type CreateVendorDocumentInput = Pick<VendorDocument, "documentType" | "label" | "fileName" | "fileType" | "fileSizeBytes">;

/**
 * Document 2 correction: past-work entries need a "completed" vs. "under
 * progress" status — previously every entry was implicitly treated as
 * finished work. `completedAt` is only meaningful once `status` is
 * `"completed"`; see `VendorPastWorkEntry` below.
 */
export type VendorPastWorkStatus = "completed" | "in_progress";

/**
 * FRONTEND IMPLEMENTATION DECISION: the owner requirements call for a
 * "past work section" showing "past BrickBasket work experience/value"
 * but don't define its data model. Modeled as a minimal append-only log
 * per vendor — description + value + status (+ completion date once
 * completed), optionally linked to one of the mock projects — the same
 * thin-slice treatment `VendorPastWorkEntry` gets here as `Customer` got
 * in Part 5. See docs/OPEN_QUESTIONS.md #28.
 */
export interface VendorPastWorkEntry {
  id: string;
  vendorId: string;
  projectId?: string;
  description: string;
  /** Rupees — a plain number, formatted only at render time. */
  value: number;
  status: VendorPastWorkStatus;
  /** Set only when `status === "completed"` — work still under progress has no completion date yet. */
  completedAt?: string;
  createdAt: string;
}

export type CreateVendorPastWorkInput = Pick<VendorPastWorkEntry, "projectId" | "description" | "value" | "status" | "completedAt">;
