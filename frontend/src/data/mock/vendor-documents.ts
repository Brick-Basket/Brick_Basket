import type { VendorDocument } from "@/types/domain/vendor";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/vendors-adapter.ts. FRONTEND IMPLEMENTATION
 * DECISION — see `src/types/domain/vendor.ts`'s header comment on
 * `VendorDocument` and docs/OPEN_QUESTIONS.md #82. Seeded sparsely (only
 * `vendor_1` and `vendor_4` have documents on file) so the empty state is
 * also exercised. No seeded entry has a real file behind it — `vendorsAdapter.getDocumentPreviewUrl`
 * only returns a URL for a document attached with a real file during this
 * session.
 */
export const mockVendorDocuments: VendorDocument[] = [
  {
    id: "vdoc_1",
    vendorId: "vendor_1",
    documentType: "pan_card",
    fileName: "pan-card.pdf",
    fileType: "application/pdf",
    fileSizeBytes: 182_300,
    uploadedBy: "u_pm",
    uploadedByName: "Karan Mehta",
    uploadedAt: "2026-08-02T05:00:00.000Z",
  },
  {
    id: "vdoc_2",
    vendorId: "vendor_1",
    documentType: "gstin_certificate",
    fileName: "gstin-certificate.pdf",
    fileType: "application/pdf",
    fileSizeBytes: 241_800,
    uploadedBy: "u_pm",
    uploadedByName: "Karan Mehta",
    uploadedAt: "2026-08-02T05:05:00.000Z",
  },
  {
    id: "vdoc_3",
    vendorId: "vendor_4",
    documentType: "msme_udyam_certificate",
    fileName: "msme-udyam-certificate.pdf",
    fileType: "application/pdf",
    fileSizeBytes: 198_400,
    uploadedBy: "u_pm",
    uploadedByName: "Karan Mehta",
    uploadedAt: "2026-05-03T05:00:00.000Z",
  },
];
