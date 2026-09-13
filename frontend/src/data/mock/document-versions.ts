import type { DocumentVersion } from "@/types/domain/document";

/**
 * Mock/demo version-history dataset only — never imported outside
 * src/lib/api/adapters/documents-adapter.ts. Only `doc_1` has more than
 * one version seeded, to demonstrate the version metadata + history view
 * without every document needing one.
 */
export const mockDocumentVersions: DocumentVersion[] = [
  {
    id: "docver_1_1",
    documentId: "doc_1",
    version: 1,
    fileName: "villa-structural-final-v1.pdf",
    fileType: "application/pdf",
    fileSizeBytes: 3_900_000,
    uploadedBy: "u_pm",
    uploadedByName: "Karan Mehta",
    uploadedAt: "2026-08-20T09:00:00.000Z",
  },
  {
    id: "docver_1_2",
    documentId: "doc_1",
    version: 2,
    fileName: "villa-structural-final-v2.pdf",
    fileType: "application/pdf",
    fileSizeBytes: 4_200_000,
    uploadedBy: "u_pm",
    uploadedByName: "Karan Mehta",
    uploadedAt: "2026-08-28T10:00:00.000Z",
    note: "Revised after the site engineer flagged a beam clearance discrepancy.",
  },
];
