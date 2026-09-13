import type { PurchaseRequisitionStatus } from "@/types/domain/requisition";

/**
 * CONFIGURABLE — see docs/OPEN_QUESTIONS.md #3 and #29, and
 * `requisition.ts`'s header comment. Demo status vocabulary only.
 */
export const REQUISITION_STATUS_CONFIG: Record<PurchaseRequisitionStatus, { label: string; tone: "neutral" | "brand" | "success" | "warning" | "error" }> = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "brand" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "error" },
};

export const REQUISITION_STATUS_ORDER: PurchaseRequisitionStatus[] = ["draft", "submitted", "approved", "rejected"];

/** Horizontal timeline steps — mirrors `CONTRACT_STATUS_STEPS`'s pattern. */
export const REQUISITION_STATUS_STEPS: { key: string; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "decision", label: "Review Decision" },
];
