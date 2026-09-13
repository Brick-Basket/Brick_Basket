import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { REQUISITION_STATUS_STEPS } from "@/components/requisitions/requisition-status-config";
import type { PurchaseRequisitionStatus } from "@/types/domain/requisition";

const STEP_INDEX: Record<PurchaseRequisitionStatus, number> = {
  draft: 0,
  submitted: 1,
  approved: 2,
  rejected: 2,
};

/** Horizontal status timeline, mirroring `ContractStatusTimeline`'s pattern — same accept/decline-style terminal step, here approved/rejected. */
export function RequisitionStatusTimeline({ status }: { status: PurchaseRequisitionStatus }) {
  const currentIndex = STEP_INDEX[status];
  const rejected = status === "rejected";

  return (
    <ol className="flex items-center gap-2">
      {REQUISITION_STATUS_STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex || (index === currentIndex && index < 2);
        const isFinalRejected = index === 2 && rejected;
        const isFinalApproved = index === 2 && status === "approved";

        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isFinalRejected
                    ? "border-error bg-error/10 text-error"
                    : isFinalApproved || (isComplete && !isCurrent)
                      ? "border-success bg-success/10 text-success"
                      : isCurrent
                        ? "border-brand-red bg-brand-red/10 text-brand-red"
                        : "border-border bg-surface-muted text-ink-muted",
                )}
              >
                {isFinalRejected ? (
                  <X className="h-4 w-4" aria-hidden />
                ) : isFinalApproved || (isComplete && !isCurrent) ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              <span className="max-w-[7rem] text-xs text-ink-muted">{index === 2 && rejected ? "Rejected" : step.label}</span>
            </div>
            {index < REQUISITION_STATUS_STEPS.length - 1 && (
              <div className={cn("h-px flex-1", index < currentIndex ? "bg-success" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
