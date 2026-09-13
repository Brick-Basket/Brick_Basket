import { CheckCircle2, FilePlus, FileX2, Mail, Pencil, Send, ThumbsUp, Truck } from "lucide-react";
import { AuditTimeline } from "@/components/domain/audit-timeline";
import type { PurchaseOrderAuditEntry } from "@/types/domain/purchase-order-audit";

const ACTION_ICON: Record<PurchaseOrderAuditEntry["action"], typeof FilePlus> = {
  created: FilePlus,
  updated: Pencil,
  submitted: Send,
  approved_level1: ThumbsUp,
  approved_level2: CheckCircle2,
  rejected: FileX2,
  released: Truck,
  issued: Mail,
};

/**
 * The "Audit trail" required by the Purchase Order module — read-only,
 * every entry is system-appended by `PurchaseOrdersAdapter`'s mutating
 * methods. Thin wrapper over the shared `AuditTimeline` (Part 19) — see
 * that component's header comment.
 */
export function POAuditHistory({ entries }: { entries: PurchaseOrderAuditEntry[] }) {
  return (
    <AuditTimeline
      entries={entries}
      getIcon={(entry) => ACTION_ICON[entry.action] ?? Pencil}
      emptyTitle="No history yet"
      emptyDescription="Actions taken on this Purchase Order will appear here."
    />
  );
}
