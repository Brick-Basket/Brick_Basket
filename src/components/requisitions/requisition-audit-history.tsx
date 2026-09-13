import { CheckCircle2, FilePlus, FileX2, Pencil, Send } from "lucide-react";
import { AuditTimeline } from "@/components/domain/audit-timeline";
import type { RequisitionAuditEntry } from "@/types/domain/requisition-audit";

const ACTION_ICON: Record<RequisitionAuditEntry["action"], typeof FilePlus> = {
  created: FilePlus,
  updated: Pencil,
  submitted: Send,
  approved: CheckCircle2,
  rejected: FileX2,
};

/**
 * The "History" required by the Purchase/Material Requisition module —
 * read-only, every entry is system-appended by `RequisitionsAdapter`'s
 * mutating methods. Thin wrapper over the shared `AuditTimeline` (Part
 * 19) — see that component's header comment.
 */
export function RequisitionAuditHistory({ entries }: { entries: RequisitionAuditEntry[] }) {
  return (
    <AuditTimeline
      entries={entries}
      getIcon={(entry) => ACTION_ICON[entry.action] ?? Pencil}
      emptyTitle="No history yet"
      emptyDescription="Actions taken on this requisition will appear here."
    />
  );
}
