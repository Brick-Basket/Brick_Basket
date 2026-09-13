"use client";

import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/domain/empty-state";
import { VENDOR_ASSESSMENT_CRITERIA } from "@/components/vendors/vendor-rating";
import { formatDate } from "@/lib/utils/format";
import type { VendorAssessment } from "@/types/domain/vendor";

/** Read-only assessment history, newest first — same append-only-log presentation as LeadActivityLog/ContractAuditHistory/DocumentVersionHistory. */
export function VendorAssessmentHistory({ assessments }: { assessments: VendorAssessment[] }) {
  if (assessments.length === 0) {
    return <EmptyState icon={ClipboardList} title="No assessments yet" description="Assessments recorded for this vendor will appear here." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {assessments.map((a) => (
        <li key={a.id} className="rounded-card border border-border bg-surface p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-medium text-ink">{a.assessedByName}</p>
            <p className="text-xs text-ink-muted">{formatDate(a.assessedAt)}</p>
          </div>
          <div className="grid gap-1 text-xs text-ink-muted sm:grid-cols-2">
            {VENDOR_ASSESSMENT_CRITERIA.map((criterion) => (
              <p key={criterion.key}>
                {criterion.label}: <span className="font-medium text-ink">{a[criterion.key]}/10</span>
              </p>
            ))}
          </div>
          {a.notes && <p className="mt-2 text-sm text-ink">{a.notes}</p>}
        </li>
      ))}
    </ul>
  );
}
