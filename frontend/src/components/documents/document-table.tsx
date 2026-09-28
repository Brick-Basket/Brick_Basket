"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { DOCUMENT_CATEGORY_CONFIG } from "@/components/documents/document-category-config";
import { formatBytes, formatDate } from "@/lib/utils/format";
import type { Document } from "@/types/domain/document";

/** The former "Project" column was dropped — every list this renders is already scoped to one contract (owner correction #3), so it was always the same value on every row. */
export function DocumentTable({
  documents,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  documents: Document[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (document: Document) => void;
}) {
  const columns: DataTableColumn<Document>[] = [
    {
      key: "title",
      header: "Document",
      sortKey: "title",
      render: (d) => (
        <div>
          <p className="font-medium text-ink">{d.title}</p>
          <p className="text-xs text-ink-muted">
            {d.fileName} · v{d.version}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortKey: "category",
      render: (d) => DOCUMENT_CATEGORY_CONFIG[d.category].label,
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (d) =>
        d.visibleToCustomer ? (
          <Badge variant="success">Customer-visible</Badge>
        ) : (
          <Badge variant="neutral">Internal only</Badge>
        ),
    },
    {
      key: "size",
      header: "Size",
      hideOnMobile: true,
      render: (d) => formatBytes(d.fileSizeBytes),
    },
    {
      key: "uploadedAt",
      header: "Uploaded",
      sortKey: "uploadedAt",
      render: (d) => formatDate(d.uploadedAt),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={documents}
      keyFor={(d) => d.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      onRowClick={onView}
    />
  );
}
