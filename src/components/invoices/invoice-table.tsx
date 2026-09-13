"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { getInvoicePaymentStatus, getTotalPaidForInvoice, type InvoicePaymentStatus } from "@/components/payments/payment-math";
import { formatINR, formatDate } from "@/lib/utils/format";
import { useVendors } from "@/hooks/use-vendors";
import { useProjects } from "@/hooks/use-projects";
import type { Invoice } from "@/types/domain/invoice";
import type { Payment } from "@/types/domain/payment";

const PAYMENT_STATUS_BADGE: Record<InvoicePaymentStatus, { label: string; variant: "success" | "warning" | "error" }> = {
  paid: { label: "Paid", variant: "success" },
  partially_paid: { label: "Partially Paid", variant: "warning" },
  unpaid: { label: "Unpaid", variant: "error" },
};

export function InvoiceTable({
  invoices,
  payments,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  invoices: Invoice[];
  /** Every `"payment"`-direction `Payment` (unpaginated) — see `useVendorPayments`. */
  payments: Payment[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  /** Omit (pass `undefined`) for a read-only viewer — rows become non-interactive. */
  onView?: (invoice: Invoice) => void;
}) {
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice",
      sortKey: "invoiceNumber",
      render: (i) => (
        <div>
          <p className="font-medium text-ink">{i.invoiceNumber}</p>
          {i.notes && <p className="text-xs text-ink-muted">{i.notes}</p>}
        </div>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (i) => allVendors.find((v) => v.id === i.vendorId)?.tradeName ?? "—",
    },
    {
      key: "project",
      header: "Project",
      hideOnMobile: true,
      render: (i) => allProjects.find((p) => p.id === i.projectId)?.name ?? "—",
    },
    {
      key: "invoiceDate",
      header: "Date",
      sortKey: "invoiceDate",
      render: (i) => formatDate(i.invoiceDate),
    },
    {
      key: "invoiceAmount",
      header: "Amount",
      sortKey: "invoiceAmount",
      render: (i) => formatINR(i.invoiceAmount),
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      render: (i) => {
        const totalPaid = getTotalPaidForInvoice(payments, i.id);
        const status = getInvoicePaymentStatus(i.invoiceAmount, totalPaid);
        const { label, variant } = PAYMENT_STATUS_BADGE[status];
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
  ];

  return (
    <DataTable columns={columns} rows={invoices} keyFor={(i) => i.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}
