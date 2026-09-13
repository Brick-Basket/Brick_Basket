import type { BadgeProps } from "@/components/ui/badge";
import type { MRCStatus } from "@/types/domain/mrc";

/**
 * CONFIGURABLE — see docs/OPEN_QUESTIONS.md #6 and #33. Mirrors
 * `CONTRACT_STATUS_CONFIG`'s shape exactly; `"issued"` plays the role
 * Contract calls `"sent_for_acceptance"` — renamed to match this module's
 * `mrc:issue` permission key.
 */
export const MRC_STATUS_CONFIG: Record<MRCStatus, { label: string; tone: BadgeProps["variant"] }> = {
  draft: { label: "Draft", tone: "neutral" },
  issued: { label: "Issued", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "error" },
};

/** Left-to-right steps for `MRCStatusTimeline` — "declined" replaces the final step's meaning rather than adding a fourth column, same as Contract's timeline. */
export const MRC_STATUS_STEPS: { key: MRCStatus | "accepted_or_declined"; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "issued", label: "Issued" },
  { key: "accepted_or_declined", label: "Customer Response" },
];
