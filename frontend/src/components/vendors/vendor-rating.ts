import type { VendorAssessment } from "@/types/domain/vendor";

/** Owner-specified verbatim ("Vendor assessment 0–10"). */
export const VENDOR_ASSESSMENT_CRITERIA: {
  key: keyof Pick<VendorAssessment, "quality" | "timelineAdherence" | "futureBusinessProbability" | "presentCapacity">;
  label: string;
}[] = [
  { key: "quality", label: "Quality of material/service" },
  { key: "timelineAdherence", label: "Adherence to supply/service timeline" },
  { key: "futureBusinessProbability", label: "Probability of future business prospects" },
  { key: "presentCapacity", label: "Present supply/service capacity" },
];

function overallScore(a: VendorAssessment): number {
  return (a.quality + a.timelineAdherence + a.futureBusinessProbability + a.presentCapacity) / 4;
}

/**
 * The vendor list's required "rating" column and the detail page's rating
 * summary are both computed from the full assessment history, not a
 * single stored field — a vendor assessed multiple times over time shows
 * the average of every assessment's overall score, not just the latest.
 * FRONTEND IMPLEMENTATION DECISION: the owner requirements don't specify
 * "latest" vs. "aggregate" — see docs/OPEN_QUESTIONS.md #28.
 */
export function computeAverageRating(assessments: VendorAssessment[]): number | null {
  if (assessments.length === 0) return null;
  const sum = assessments.reduce((total, a) => total + overallScore(a), 0);
  return sum / assessments.length;
}

export function formatRating(rating: number | null): string {
  return rating === null ? "Not yet assessed" : `${rating.toFixed(1)} / 10`;
}

/** Per-criterion average across every assessment on file — backs the rating summary's breakdown. */
export function computeCriteriaAverages(assessments: VendorAssessment[]): Record<(typeof VENDOR_ASSESSMENT_CRITERIA)[number]["key"], number> | null {
  if (assessments.length === 0) return null;
  const totals = { quality: 0, timelineAdherence: 0, futureBusinessProbability: 0, presentCapacity: 0 };
  for (const a of assessments) {
    totals.quality += a.quality;
    totals.timelineAdherence += a.timelineAdherence;
    totals.futureBusinessProbability += a.futureBusinessProbability;
    totals.presentCapacity += a.presentCapacity;
  }
  const n = assessments.length;
  return {
    quality: totals.quality / n,
    timelineAdherence: totals.timelineAdherence / n,
    futureBusinessProbability: totals.futureBusinessProbability / n,
    presentCapacity: totals.presentCapacity / n,
  };
}
