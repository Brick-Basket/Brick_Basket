import type { BadgeProps } from "@/components/ui/badge";
import type { LeadStatus } from "@/types/domain/lead";

/**
 * CONFIGURABLE — demo pipeline vocabulary pending client confirmation (see
 * docs/OPEN_QUESTIONS.md #3). `order` drives the Kanban column order; keep
 * it in sync with `LeadStatus`'s declaration order in `lead.ts`.
 */
export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; tone: BadgeProps["variant"]; order: number }> = {
  new: { label: "New", tone: "brand", order: 0 },
  contacted: { label: "Contacted", tone: "warning", order: 1 },
  qualified: { label: "Qualified", tone: "success", order: 2 },
  converted: { label: "Converted", tone: "success", order: 3 },
  lost: { label: "Lost", tone: "neutral", order: 4 },
};

export const LEAD_STATUS_ORDER: LeadStatus[] = (Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).sort(
  (a, b) => LEAD_STATUS_CONFIG[a].order - LEAD_STATUS_CONFIG[b].order,
);
