"use client";

import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/domain/empty-state";
import { VENDOR_ASSESSMENT_CRITERIA, computeAverageRating, computeCriteriaAverages, formatRating } from "@/components/vendors/vendor-rating";
import type { VendorAssessment } from "@/types/domain/vendor";

/** Required "rating summary" — an overall 0–10 average plus a per-criterion breakdown, computed from the full assessment history. */
export function VendorRatingSummary({ assessments }: { assessments: VendorAssessment[] }) {
  const overall = computeAverageRating(assessments);
  const criteriaAverages = computeCriteriaAverages(assessments);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-4 w-4 text-brand-red" aria-hidden />
          Rating Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {criteriaAverages === null || overall === null ? (
          <EmptyState
            title="Not yet assessed"
            description="Add an assessment below to start this vendor's rating summary."
          />
        ) : (
          <>
            <p className="text-2xl font-semibold text-ink">{formatRating(overall)}</p>
            <div className="flex flex-col gap-2">
              {VENDOR_ASSESSMENT_CRITERIA.map((criterion) => (
                <div key={criterion.key} className="flex items-center gap-3 text-sm">
                  <span className="w-56 shrink-0 text-ink-muted">{criterion.label}</span>
                  <div className="h-2 flex-1 rounded-full bg-surface-muted">
                    <div
                      className="h-2 rounded-full bg-brand-red"
                      style={{ width: `${(criteriaAverages[criterion.key] / 10) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-medium text-ink">{criteriaAverages[criterion.key].toFixed(1)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-muted">
              Based on {assessments.length} assessment{assessments.length === 1 ? "" : "s"} on file.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
