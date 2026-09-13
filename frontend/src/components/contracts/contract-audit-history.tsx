import { CheckCircle2, FilePlus, FileX2, Pencil, RotateCcw, Send } from "lucide-react";
import { AuditTimeline } from "@/components/domain/audit-timeline";
import type { ContractAuditEntry } from "@/types/domain/contract-audit";

const ACTION_ICON: Record<ContractAuditEntry["action"], typeof FilePlus> = {
  created: FilePlus,
  updated: Pencil,
  sent_for_acceptance: Send,
  withdrawn: RotateCcw,
  accepted: CheckCircle2,
  declined: FileX2,
};

/**
 * The acceptance/audit history required by Contract Management — read-only,
 * every entry is system-appended by `ContractsAdapter`'s mutating methods
 * (never authored freehand, unlike `LeadActivityLog`'s notes). Thin
 * wrapper over the shared `AuditTimeline` (Part 19) — see that
 * component's header comment.
 */
export function ContractAuditHistory({ entries }: { entries: ContractAuditEntry[] }) {
  return (
    <AuditTimeline
      entries={entries}
      getIcon={(entry) => ACTION_ICON[entry.action] ?? Pencil}
      emptyTitle="No history yet"
      emptyDescription="Actions taken on this contract will appear here."
    />
  );
}
