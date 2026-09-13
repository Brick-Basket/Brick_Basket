"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { formatDate } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { DPR } from "@/types/domain/dpr";

export function DPRTable({
  dprs,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  dprs: DPR[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (dpr: DPR) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<DPR>[] = [
    {
      key: "dprNumber",
      header: "DPR",
      sortKey: "dprNumber",
      render: (d) => <p className="font-medium text-ink">{d.dprNumber}</p>,
    },
    {
      key: "project",
      header: "Project",
      render: (d) => allProjects.find((p) => p.id === d.projectId)?.name ?? "—",
    },
    {
      key: "reportDate",
      header: "Report Date",
      sortKey: "reportDate",
      render: (d) => formatDate(d.reportDate),
    },
    {
      key: "preparedBy",
      header: "Prepared By",
      render: (d) => d.preparedByName,
    },
    {
      key: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      render: (d) => formatDate(d.createdAt),
    },
  ];

  return (
    <DataTable columns={columns} rows={dprs} keyFor={(d) => d.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}
