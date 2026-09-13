/**
 * Document — a file record in the Drawing & Document Management module
 * (admin + customer), per the owner requirements.
 *
 * Source module: Drawing & Document Management (Part 6).
 * Relationships: `projectId` → `Project`. `uploadedBy` → a staff user
 * (demo directory, `src/lib/auth/mock-users.ts`).
 * Backend ownership: real file storage, versioning, and access control are
 * all backend-owned (see docs/OPEN_QUESTIONS.md #8–9) — the frontend only
 * creates/reads documents through the adapter boundary
 * (`documents-adapter.ts`). In this mock, an uploaded file's actual bytes
 * live only in the browser's memory for the session (via `URL.createObjectURL`)
 * — never in this type, and never sent anywhere — so a page reload loses
 * the ability to preview/download anything the demo user uploaded, same as
 * every other mock adapter in this app.
 */

// Confirmed set — the owner requirements name these six categories exactly
// ("Finalized drawings," "2D layouts," "3D layouts," "Material/test
// certificates," "Bills/tax invoices without price for warranty
// assessment," "Warranted goods with invoice and warranty certificate").
// Not configurable, unlike Lead/Contract's status/category vocabularies.
export type DocumentCategory =
  | "finalized_drawing"
  | "layout_2d"
  | "layout_3d"
  | "material_test_certificate"
  | "warranty_tax_invoice"
  | "warranted_goods_certificate";

export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  projectId: string;
  fileName: string;
  /** Browser MIME type, e.g. "application/pdf" | "image/png". Allowed types/sizes are TBD — see docs/OPEN_QUESTIONS.md #8. */
  fileType: string;
  fileSizeBytes: number;
  /** Starts at 1; incremented each time a new version is uploaded — see `DocumentVersion`. */
  version: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  updatedAt: string;
  /**
   * Customer visibility control, per the owner requirement. Admin-only
   * toggle; the customer-facing adapter query must always filter to
   * `true` regardless of what a client sends — see docs/API_CONTRACTS.md.
   */
  visibleToCustomer: boolean;
  /**
   * Warranty mapping fields — only meaningful for the two warranty-related
   * categories. FRONTEND IMPLEMENTATION DECISION: the owner requirements
   * ask for a "warranty mapping view" but don't define its data model, so
   * this is a minimal free-text + date pairing, not a real
   * warranted-item/product catalog. See docs/OPEN_QUESTIONS.md.
   */
  warrantyItem?: string;
  warrantyExpiresAt?: string;
}

/** One entry in a document's upload history — required "version metadata." */
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  note?: string;
}

export type CreateDocumentInput = {
  title: string;
  category: DocumentCategory;
  projectId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  visibleToCustomer: boolean;
  warrantyItem?: string;
  warrantyExpiresAt?: string;
};

export type UpdateDocumentInput = Partial<
  Pick<Document, "title" | "visibleToCustomer" | "warrantyItem" | "warrantyExpiresAt">
>;

export type UploadNewVersionInput = {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  note?: string;
};
