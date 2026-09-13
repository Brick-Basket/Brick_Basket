"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_MODE_CONFIG } from "@/components/payments/payment-config";
import { formatINR, formatDate } from "@/lib/utils/format";
import { useVendors } from "@/hooks/use-vendors";
import { useCustomers } from "@/hooks/use-customers";
import { useProjects } from "@/hooks/use-projects";
import type { Payment } from "@/types/domain/payment";

export function PaymentTable({
  payments,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  payments: Payment[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  /** Omit (pass `undefined`) for a read-only viewer — rows become non-interactive. */
  onView?: (payment: Payment) => void;
}) {
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];
  const { customers: allCustomers } = useCustomers();
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<Payment>[] = [
    {
      key: "direction",
      header: "Type",
      render: (p) =>
        p.direction === "payment" ? (
          <Badge variant="error">Payment</Badge>
        ) : (
          <Badge variant="success">Receipt</Badge>
        ),
    },
    {
      key: "party",
      header: "Party",
      render: (p) =>
        p.direction === "payment"
          ? allVendors.find((v) => v.id === p.vendorId)?.tradeName ?? "—"
          : allCustomers.find((c) => c.id === p.customerId)?.name ?? "—",
    },
    {
      key: "project",
      header: "Project",
      hideOnMobile: true,
      render: (p) => allProjects.find((proj) => proj.id === p.projectId)?.name ?? "—",
    },
    {
      key: "paymentDate",
      header: "Date",
      sortKey: "paymentDate",
      render: (p) => formatDate(p.paymentDate),
    },
    {
      key: "amount",
      header: "Amount",
      sortKey: "amount",
      render: (p) => formatINR(p.amount),
    },
    {
      key: "mode",
      header: "Mode",
      hideOnMobile: true,
      render: (p) => (
        <div>
          <p>{PAYMENT_MODE_CONFIG[p.mode].label}</p>
          {p.referenceNumber && <p className="text-xs text-ink-muted">{p.referenceNumber}</p>}
        </div>
      ),
    },
  ];

  return (
    <DataTable columns={columns} rows={payments} keyFor={(p) => p.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}
