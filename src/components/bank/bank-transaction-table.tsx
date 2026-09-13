"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { BankTransaction } from "@/types/domain/bank-transaction";

export function BankTransactionTable({
  transactions,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  transactions: BankTransaction[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  /** Omit (pass `undefined`) for a read-only viewer — rows become non-interactive. */
  onView?: (transaction: BankTransaction) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<BankTransaction>[] = [
    {
      key: "partyOrVendorCode",
      header: "Party/Vendor Code",
      render: (t) => (
        <div>
          <p className="font-medium text-ink">{t.partyOrVendorCode}</p>
          <p className="text-xs text-ink-muted">{t.invoiceNumber}</p>
        </div>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (t) => allProjects.find((p) => p.id === t.projectId)?.name ?? "—",
    },
    {
      key: "location",
      header: "State/City",
      hideOnMobile: true,
      render: (t) => `${t.city}, ${t.state}`,
    },
    {
      key: "yearOfExecution",
      header: "Year",
      sortKey: "yearOfExecution",
      render: (t) => t.yearOfExecution,
    },
    {
      key: "paymentAmount",
      header: "Amount",
      sortKey: "paymentAmount",
      render: (t) => formatINR(t.paymentAmount),
    },
    {
      key: "taxAmount",
      header: "Tax",
      hideOnMobile: true,
      render: (t) => formatINR(t.taxAmount),
    },
    {
      key: "itcApplicable",
      header: "ITC",
      render: (t) => (t.itcApplicable ? <Badge variant="success">Applicable</Badge> : <Badge variant="neutral">Not Applicable</Badge>),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={transactions}
      keyFor={(t) => t.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      onRowClick={onView}
    />
  );
}
