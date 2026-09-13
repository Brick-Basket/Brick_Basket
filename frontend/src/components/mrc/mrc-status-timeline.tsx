import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MRC_STATUS_STEPS } from "@/components/mrc/mrc-status-config";
import type { MRCStatus } from "@/types/domain/mrc";

const STEP_INDEX: Record<MRCStatus, number> = {
  draft: 0,
  issued: 1,
  accepted: 2,
  declined: 2,
};

/** Horizontal status timeline, mirroring `ContractStatusTimeline` (Part 5). */
export function MRCStatusTimeline({ status }: { status: MRCStatus }) {
  const currentIndex = STEP_INDEX[status];
  const declined = status === "declined";

  return (
    <ol className="flex items-center gap-2">
      {MRC_STATUS_STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = index < currentIndex || (index === currentIndex && index < 2);
        const isFinalDeclined = index === 2 && declined;
        const isFinalAccepted = index === 2 && status === "accepted";

        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isFinalDeclined
                    ? "border-error bg-error/10 text-error"
                    : isFinalAccepted || (isComplete && !isCurrent)
                      ? "border-success bg-success/10 text-success"
                      : isCurrent
                        ? "border-brand-red bg-brand-red/10 text-brand-red"
                        : "border-border bg-surface-muted text-ink-muted",
                )}
              >
                {isFinalDeclined ? (
                  <X className="h-4 w-4" aria-hidden />
                ) : isFinalAccepted || (isComplete && !isCurrent) ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              <span className="max-w-[7rem] text-xs text-ink-muted">
                {index === 2 && declined ? "Declined" : step.label}
              </span>
            </div>
            {index < MRC_STATUS_STEPS.length - 1 && (
              <div className={cn("h-px flex-1", index < currentIndex ? "bg-success" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
