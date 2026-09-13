"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { GSTR_TYPE_CONFIG } from "@/components/finance/gstr-config";
import { getTotalValue } from "@/components/finance/gstr-math";
import { formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import { useCustomers } from "@/hooks/use-customers";
import { mockGRNs } from "@/data/mock/grn";
import { mockContracts } from "@/data/mock/contracts";
import type { GSTRRecord } from "@/types/domain/gstr-record";
import type { Vendor } from "@/types/domain/vendor";
import type { Customer } from "@/types/domain/customer";

function referenceLabel(record: GSTRRecord): string {
  if (record.type === "purchase") {
    return mockGRNs.find((g) => g.id === record.grnId)?.grnNumber ?? "—";
  }
  if (record.contractId) {
    return mockContracts.find((c) => c.id === record.contractId)?.contractNumber ?? "—";
  }
  return record.saleDescription ?? "—";
}

function partyLabel(record: GSTRRecord, allVendors: Vendor[], allCustomers: Customer[]): string {
  if (record.type === "purchase") {
    return allVendors.find((v) => v.id === record.vendorId)?.tradeName ?? "—";
  }
  if (record.customerId) {
    return allCustomers.find((c) => c.id === record.customerId)?.name ?? "—";
  }
  return "Walk-in / unlinked";
}

export function GSTRTable({
  records,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  records: GSTRRecord[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  /** Omit (pass `undefined`) for a read-only viewer — rows become non-interactive. */
  onView?: (record: GSTRRecord) => void;
}) {
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];
  const { customers: allCustomers } = useCustomers();
  const columns: DataTableColumn<GSTRRecord>[] = [
    {
      key: "type",
      header: "Category",
      render: (r) => {
        const { label, variant } = GSTR_TYPE_CONFIG[r.type];
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: "reference",
      header: "Reference",
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{referenceLabel(r)}</p>
          <p className="text-xs text-ink-muted">{r.invoiceReference ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "party",
      header: "Party",
      hideOnMobile: true,
      render: (r) => partyLabel(r, allVendors, allCustomers),
    },
    {
      key: "project",
      header: "Project",
      hideOnMobile: true,
      render: (r) => (r.projectId ? allProjects.find((p) => p.id === r.projectId)?.name ?? "—" : "—"),
    },
    {
      key: "period",
      header: "Period",
      sortKey: "period",
      render: (r) => r.period,
    },
    {
      key: "taxableValue",
      header: "Taxable Value",
      sortKey: "taxableValue",
      render: (r) => formatINR(r.taxableValue),
    },
    {
      key: "taxAmount",
      header: "Tax",
      hideOnMobile: true,
      render: (r) => formatINR(r.taxAmount),
    },
    {
      key: "total",
      header: "Total",
      render: (r) => formatINR(getTotalValue(r)),
    },
  ];

  return (
    <DataTable columns={columns} rows={records} keyFor={(r) => r.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}
