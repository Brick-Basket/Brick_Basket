import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { STORE_REQUISITION_STATUS_STEPS } from "@/components/store-requisitions/store-requisition-status-config";
import type { StoreRequisitionStatus } from "@/types/domain/store-requisition";

const STEP_INDEX: Record<StoreRequisitionStatus, number> = {
  draft: 0,
  submitted: 1,
  approved: 2,
  rejected: 2,
  issued: 3,
};

/** Horizontal status timeline — mirrors `RequisitionStatusTimeline`'s pattern (Part 8), with an added final "Issued" step. */
export function StoreRequisitionStatusTimeline({ status }: { status: StoreRequisitionStatus }) {
  const currentIndex = STEP_INDEX[status];
  const rejected = status === "rejected";
  const lastIndex = STORE_REQUISITION_STATUS_STEPS.length - 1;

  return (
    <ol className="flex items-center gap-2">
      {STORE_REQUISITION_STATUS_STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex || (index === currentIndex && index < lastIndex && !rejected);
        const isFinalRejected = index === 2 && rejected;

        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isFinalRejected
                    ? "border-error bg-error/10 text-error"
                    : isComplete && !isCurrent
                      ? "border-success bg-success/10 text-success"
                      : isCurrent
                        ? "border-brand-red bg-brand-red/10 text-brand-red"
                        : "border-border bg-surface-muted text-ink-muted",
                )}
              >
                {isFinalRejected ? (
                  <X className="h-4 w-4" aria-hidden />
                ) : isComplete && !isCurrent ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              <span className="max-w-[7rem] text-xs text-ink-muted">{index === 2 && rejected ? "Rejected" : step.label}</span>
            </div>
            {index < lastIndex && <div className={cn("h-px flex-1", index < currentIndex ? "bg-success" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
