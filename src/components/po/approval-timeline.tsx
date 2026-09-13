import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PO_STATUS_STEPS } from "@/components/po/po-status-config";
import type { PurchaseOrderStatus } from "@/types/domain/purchase-order";

interface TimelineState {
  /** Step indices (into `PO_STATUS_STEPS`) that are fully complete. */
  completed: Set<number>;
  /** The step currently awaiting action, if any. */
  current: number | null;
  /** The step index a rejection happened at, if any. */
  rejected: number | null;
}

function getTimelineState(status: PurchaseOrderStatus, rejectedAtLevel: 1 | 2 | null): TimelineState {
  switch (status) {
    case "draft":
      return { completed: new Set([0]), current: 1, rejected: null };
    case "pending_approval_l1":
      return { completed: new Set([0, 1]), current: 2, rejected: null };
    case "pending_approval_l2":
      return { completed: new Set([0, 1, 2]), current: 3, rejected: null };
    case "approved":
      return { completed: new Set([0, 1, 2, 3]), current: 4, rejected: null };
    case "released":
      return { completed: new Set([0, 1, 2, 3, 4]), current: 5, rejected: null };
    case "issued":
      return { completed: new Set([0, 1, 2, 3, 4, 5]), current: null, rejected: null };
    case "rejected": {
      const rejectedIndex = rejectedAtLevel === 2 ? 3 : 2;
      const completed = rejectedAtLevel === 2 ? [0, 1, 2] : [0, 1];
      return { completed: new Set(completed), current: null, rejected: rejectedIndex };
    }
  }
}

/**
 * The required visual "Approval Timeline" for Purchase Orders — 6
 * sequential milestones (Draft → Submitted → Level 1 → Level 2 → Released →
 * Issued), with a rejection at either approval level shown as its own
 * terminal step. Mirrors `RequisitionStatusTimeline`'s (Part 8) and
 * `ContractStatusTimeline`'s (Part 5) horizontal-stepper pattern, extended
 * to a longer sequence for the PO module's owner-named milestones.
 */
export function ApprovalTimeline({ status, rejectedAtLevel }: { status: PurchaseOrderStatus; rejectedAtLevel: 1 | 2 | null }) {
  const { completed, current, rejected } = getTimelineState(status, rejectedAtLevel);

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {PO_STATUS_STEPS.map((step, index) => {
        const isRejectedStep = index === rejected;
        const isComplete = completed.has(index);
        const isCurrent = index === current;

        return (
          <li key={step.key} className="flex flex-1 items-center gap-2" style={{ minWidth: "6rem" }}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isRejectedStep
                    ? "border-error bg-error/10 text-error"
                    : isComplete
                      ? "border-success bg-success/10 text-success"
                      : isCurrent
                        ? "border-brand-red bg-brand-red/10 text-brand-red"
                        : "border-border bg-surface-muted text-ink-muted",
                )}
              >
                {isRejectedStep ? <X className="h-4 w-4" aria-hidden /> : isComplete ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
              </span>
              <span className="max-w-[6rem] text-xs text-ink-muted">{isRejectedStep ? "Rejected" : step.label}</span>
            </div>
            {index < PO_STATUS_STEPS.length - 1 && <div className={cn("h-px flex-1", isComplete ? "bg-success" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
