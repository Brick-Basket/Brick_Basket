import type { RFQStatus } from "@/types/domain/rfq";

/**
 * CONFIGURABLE — see docs/OPEN_QUESTIONS.md #3 and #30, and `rfq.ts`'s
 * header comment. Demo readiness-state vocabulary only.
 */
export const RFQ_STATUS_CONFIG: Record<RFQStatus, { label: string; tone: "neutral" | "brand" | "success" | "warning" | "error" }> = {
  draft: { label: "In Comparison", tone: "brand" },
  finalized: { label: "Finalized", tone: "success" },
};

export const RFQ_STATUS_ORDER: RFQStatus[] = ["draft", "finalized"];
