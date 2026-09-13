import { Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/domain/empty-state";
import { formatDateTime } from "@/lib/utils/format";

export interface AuditTimelineEntry {
  id: string;
  message: string;
  actorName: string;
  createdAt: string;
}

/**
 * Shared read-only append-only-log renderer — icon circle + message +
 * actorName · date, in a `border-l-2 pl-4` `<li>`. Extracted in Part 19
 * after `ContractAuditHistory`/`POAuditHistory`/`RequisitionAuditHistory`
 * turned out to be byte-for-byte-identical markup (differing only in
 * entry type, icon map, and empty-state copy) — a duplicated-UI-logic
 * violation of the master prompt's explicit "No duplicated UI logic"
 * engineering principle. `LeadActivityLog`'s read-only rendering half
 * matched the same pattern too and is now a 4th consumer.
 * `VendorAssessmentHistory` and `DocumentVersionHistory` were checked and
 * are genuinely different shapes (ratings-grid cards, file-metadata
 * version cards) — deliberately not folded into this component. See
 * `docs/OPEN_QUESTIONS.md` #40 and `docs/COMPONENT_GUIDE.md`.
 *
 * Business-vocabulary-free, same spirit as `StatusBadge`/`MetricCard`:
 * callers pass their own entries plus an icon-resolver function; this
 * component knows nothing about contracts, POs, requisitions, or leads.
 */
export function AuditTimeline<Entry extends AuditTimelineEntry>({
  entries,
  getIcon,
  emptyTitle,
  emptyDescription,
}: {
  entries: Entry[];
  getIcon: (entry: Entry) => LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (entries.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ol className="flex flex-col gap-4">
      {entries.map((entry) => {
        const Icon = getIcon(entry) ?? Pencil;
        return (
          <li key={entry.id} className="flex gap-3 border-l-2 border-border pl-4">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm text-ink">{entry.message}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {entry.actorName} · {formatDateTime(entry.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
