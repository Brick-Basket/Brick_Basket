import type { StoreRequisitionStatus } from "@/types/domain/store-requisition";

/**
 * CONFIGURABLE — frontend implementation decision, not owner-confirmed
 * (§6B's text names no states at all). See
 * `src/types/domain/store-requisition.ts`'s header comment.
 */
export const STORE_REQUISITION_STATUS_CONFIG: Record<
  StoreRequisitionStatus,
  { label: string; tone: "neutral" | "brand" | "success" | "warning" | "error" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "brand" },
  approved: { label: "Approved", tone: "warning" },
  rejected: { label: "Rejected", tone: "error" },
  issued: { label: "Issued", tone: "success" },
};

export const STORE_REQUISITION_STATUS_ORDER: StoreRequisitionStatus[] = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "issued",
];

/** Horizontal timeline steps — mirrors `REQUISITION_STATUS_STEPS`'s pattern (Part 8), with an added "Issued" step for this module's extra stage. */
export const STORE_REQUISITION_STATUS_STEPS: { key: string; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "decision", label: "Stores Decision" },
  { key: "issued", label: "Issued" },
];
