import { History } from "lucide-react";
import { EmptyState } from "@/components/domain/empty-state";
import { formatBytes, formatDateTime } from "@/lib/utils/format";
import type { DocumentVersion } from "@/types/domain/document";

/** Version metadata + history required by the Document module. */
export function DocumentVersionHistory({ versions }: { versions: DocumentVersion[] }) {
  if (versions.length === 0) {
    return <EmptyState icon={History} title="No earlier versions" description="This is the only version on file." />;
  }

  return (
    <ol className="flex flex-col gap-3">
      {versions.map((v) => (
        <li key={v.id} className="rounded-card border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink">Version {v.version}</span>
            <span className="text-xs text-ink-muted">{formatDateTime(v.uploadedAt)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {v.fileName} · {formatBytes(v.fileSizeBytes)} · {v.uploadedByName}
          </p>
          {v.note && <p className="mt-1 text-sm text-ink">{v.note}</p>}
        </li>
      ))}
    </ol>
  );
}
