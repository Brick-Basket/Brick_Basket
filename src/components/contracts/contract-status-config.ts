import type { BadgeProps } from "@/components/ui/badge";
import type { ContractStatus } from "@/types/domain/contract";

/**
 * CONFIGURABLE — see docs/OPEN_QUESTIONS.md #3 and docs/STATUS_DEFINITIONS.md.
 * `"declined"` and the admin `withdraw` action are frontend implementation
 * decisions, not owner-confirmed (the owner text only names "accept").
 */
export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; tone: BadgeProps["variant"] }> = {
  draft: { label: "Draft", tone: "neutral" },
  sent_for_acceptance: { label: "Sent for Acceptance", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "error" },
};

/** Left-to-right steps for `ContractStatusTimeline` — "declined" replaces the final step's meaning rather than adding a fourth column. */
export const CONTRACT_STATUS_STEPS: { key: ContractStatus | "accepted_or_declined"; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "sent_for_acceptance", label: "Sent for Acceptance" },
  { key: "accepted_or_declined", label: "Customer Response" },
];
