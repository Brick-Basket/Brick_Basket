"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { getTaxRecordStatus } from "@/components/finance/tax-record-math";
import { TAX_RECORD_STATUS_CONFIG, TAX_RECORD_TYPE_CONFIG } from "@/components/finance/tax-record-config";
import { formatDate, formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { TaxRecord } from "@/types/domain/tax-record";

export function TaxRecordTable({
  records,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  records: TaxRecord[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  /** Omit (pass `undefined`) for a read-only viewer — rows become non-interactive. */
  onView?: (record: TaxRecord) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<TaxRecord>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.name}</p>
          <p className="text-xs text-ink-muted">{r.authority}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      hideOnMobile: true,
      render: (r) => <Badge variant="neutral">{TAX_RECORD_TYPE_CONFIG[r.type].label}</Badge>,
    },
    {
      key: "project",
      header: "Project",
      hideOnMobile: true,
      render: (r) => (r.projectId ? allProjects.find((p) => p.id === r.projectId)?.name ?? "—" : "Organization-wide"),
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortKey: "dueDate",
      render: (r) => formatDate(`${r.dueDate}T00:00:00.000Z`),
    },
    {
      key: "amount",
      header: "Amount",
      sortKey: "amount",
      render: (r) => formatINR(r.amount),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const status = getTaxRecordStatus(r);
        const { label, variant } = TAX_RECORD_STATUS_CONFIG[status];
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
  ];

  return (
    <DataTable columns={columns} rows={records} keyFor={(r) => r.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}
