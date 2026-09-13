import type { PurchaseOrderStatus } from "@/types/domain/purchase-order";

/**
 * CONFIGURABLE — see docs/OPEN_QUESTIONS.md #3 and #31, and
 * `purchase-order.ts`'s header comment. Demo status vocabulary only.
 */
export const PO_STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; tone: "neutral" | "brand" | "success" | "warning" | "error" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_approval_l1: { label: "Pending L1 Approval", tone: "brand" },
  pending_approval_l2: { label: "Pending L2 Approval", tone: "brand" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "error" },
  released: { label: "Released", tone: "warning" },
  issued: { label: "Issued", tone: "success" },
};

export const PO_STATUS_ORDER: PurchaseOrderStatus[] = [
  "draft",
  "pending_approval_l1",
  "pending_approval_l2",
  "approved",
  "rejected",
  "released",
  "issued",
];

/** The 6 sequential milestones `ApprovalTimeline` renders — the owner's "two-level approval," "Release state" and "Issue state" expanded into one visual sequence. */
export const PO_STATUS_STEPS: { key: string; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "level1", label: "Level 1 Approval" },
  { key: "level2", label: "Level 2 Approval" },
  { key: "released", label: "Released" },
  { key: "issued", label: "Issued" },
];
