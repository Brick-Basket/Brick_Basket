import { Badge, type BadgeProps } from "@/components/ui/badge";

/**
 * Generic status→label/tone pill. Feature modules define their own
 * `Record<Status, { label: string; tone: BadgeProps["variant"] }>` config
 * (e.g. `src/components/leads/lead-status-config.ts`) and pass it in here —
 * this component carries no business vocabulary of its own, so it works
 * unchanged for Contract/RFQ/PO/GRN status pills in later parts.
 */
export function StatusBadge<Status extends string>({
  status,
  config,
}: {
  status: Status;
  config: Record<Status, { label: string; tone: BadgeProps["variant"] }>;
}) {
  const entry = config[status];
  if (!entry) return <Badge variant="neutral">{status}</Badge>;
  return <Badge variant={entry.tone}>{entry.label}</Badge>;
}
