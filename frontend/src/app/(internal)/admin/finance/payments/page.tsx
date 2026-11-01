"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Plus, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePermission } from "@/lib/permissions/use-permission";
import { useInvoices } from "@/hooks/use-invoices";
import { usePayments, useVendorPayments } from "@/hooks/use-payments";
import { useProjectContext } from "@/components/providers/project-provider";
import { InvoiceFilters } from "@/components/invoices/invoice-filters";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { PaymentFilters } from "@/components/payments/payment-filters";
import { PaymentTable } from "@/components/payments/payment-table";
import { PaymentForm } from "@/components/payments/payment-form";
import type { Invoice } from "@/types/domain/invoice";
import type { Payment } from "@/types/domain/payment";
import type { InvoiceListParams } from "@/lib/api/adapters/invoices-adapter";
import type { PaymentListParams } from "@/lib/api/adapters/payments-adapter";

type Tab = "invoices" | "receipts";
type AddDialog = "invoice" | "payment" | "receipt" | null;

const PAGE_SIZE = 10;

/**
 * "Capture PO/vendor code/invoice details/invoice amount/invoice copy/
 * payment details" (§8B) — two tabs on one route.
 *
 * BrickBasket "Invoices and Payments together, Receipts separate"
 * correction: this page used to split "Invoices" from a combined
 * "Payments & Receipts" tab that mixed vendor payments (against these
 * same invoices) with customer receipts (against accepted Contracts, an
 * unrelated money-in workflow) behind a direction filter dropdown.
 * Vendor invoices and the payments recorded against them now live
 * together on one "Invoices & Payments" tab — the Invoice table's own
 * Payment Status column already cross-references them (`InvoiceTable` +
 * `useVendorPayments`, unchanged), and the payment ledger itself is now a
 * second section on that same tab instead of a tab switch away. Customer
 * receipts get their own "Receipts" tab. Both sections still read/write
 * the same underlying `Payment` entity (`direction: "payment" |
 * "receipt"`, Part 16) via the same adapter/hooks — only this page's
 * grouping and the reused `PaymentForm`/`PaymentFilters` components'
 * direction-locking changed (see their own header comments).
 */
export default function AdminPaymentsPage() {
  return (
    <PermissionGuard
      permission="finance:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Payments & Receipts" description="Ask an administrator for the finance:read permission." />
        </div>
      }
    >
      <AdminPaymentsContent />
    </PermissionGuard>
  );
}

function AdminPaymentsContent() {
  const canWrite = usePermission("finance:write");
  const [tab, setTab] = useState<Tab>("invoices");
  const [addDialog, setAddDialog] = useState<AddDialog>(null);

  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "invoiceDate", sortDir: "desc" });
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const invoicesQuery = useInvoices(invoiceFilters);
  const { result: vendorPaymentsResult } = useVendorPayments();

  // Paginated vendor-payment ledger for the "Payment Entries" section of
  // the Invoices & Payments tab — separate from `useVendorPayments` above,
  // which fetches every "payment"-direction row unpaginated just to
  // compute each invoice's paid/partial/unpaid status.
  const [vendorPaymentFilters, setVendorPaymentFilters] = useState<PaymentListParams>({
    direction: "payment",
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "paymentDate",
    sortDir: "desc",
  });
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const vendorPaymentsQuery = usePayments(vendorPaymentFilters);

  const [receiptFilters, setReceiptFilters] = useState<PaymentListParams>({
    direction: "receipt",
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "paymentDate",
    sortDir: "desc",
  });
  const receiptsQuery = usePayments(receiptFilters);

  // BrickBasket "everything interconnected" connectivity fix: all three
  // sections (Invoices, Payment Entries, Receipts) already had a Project
  // dropdown, but none followed the shared Global Project Selector — same
  // follow pattern as `GRNFilters`/Documents, applied to all three filter
  // states at once so switching tabs/sections doesn't lose the selection.
  const { selected } = useProjectContext();
  const userOverrodeProjectRef = useRef(false);
  useEffect(() => {
    if (userOverrodeProjectRef.current) return;
    if (selected) {
      setInvoiceFilters((prev) => (prev.projectId === selected.id ? prev : { ...prev, projectId: selected.id }));
      setVendorPaymentFilters((prev) => (prev.projectId === selected.id ? prev : { ...prev, projectId: selected.id }));
      setReceiptFilters((prev) => (prev.projectId === selected.id ? prev : { ...prev, projectId: selected.id }));
    }
  }, [selected]);
  const handleInvoiceFiltersChange = (next: InvoiceListParams) => {
    if (next.projectId !== invoiceFilters.projectId) userOverrodeProjectRef.current = true;
    setInvoiceFilters(next);
  };
  const handleVendorPaymentFiltersChange = (next: PaymentListParams) => {
    if (next.projectId !== vendorPaymentFilters.projectId) userOverrodeProjectRef.current = true;
    setVendorPaymentFilters(next);
  };
  const handleReceiptFiltersChange = (next: PaymentListParams) => {
    if (next.projectId !== receiptFilters.projectId) userOverrodeProjectRef.current = true;
    setReceiptFilters(next);
  };

  const handleInvoiceSortChange = (key: string) => {
    setInvoiceFilters((prev) => ({
      ...prev,
      sortBy: key as InvoiceListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const handleVendorPaymentSortChange = (key: string) => {
    setVendorPaymentFilters((prev) => ({
      ...prev,
      sortBy: key as PaymentListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const handleReceiptSortChange = (key: string) => {
    setReceiptFilters((prev) => ({
      ...prev,
      sortBy: key as PaymentListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const closeAddDialog = () => {
    setAddDialog(null);
    setEditingInvoice(null);
    setEditingPayment(null);
  };

  const openEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setAddDialog("invoice");
  };

  const openEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setAddDialog(payment.direction === "receipt" ? "receipt" : "payment");
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Payments & Receipts</h1>
          <p className="text-sm text-ink-muted">Vendor invoices and the payments recorded against them, kept together — customer receipts are tracked separately.</p>
        </div>
        <div className="flex rounded-md border border-border p-0.5">
          <Button variant={tab === "invoices" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("invoices")} aria-pressed={tab === "invoices"}>
            <FileText className="h-4 w-4" aria-hidden />
            Invoices & Payments
          </Button>
          <Button variant={tab === "receipts" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("receipts")} aria-pressed={tab === "receipts"}>
            <ReceiptIcon className="h-4 w-4" aria-hidden />
            Receipts
          </Button>
        </div>
      </div>

      {tab === "invoices" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold text-ink">Invoices</h2>
            <PermissionGuard permission="finance:write">
              <Button size="sm" onClick={() => setAddDialog("invoice")}>
                <Plus className="h-4 w-4" aria-hidden />
                Add Invoice
              </Button>
            </PermissionGuard>
          </div>

          <InvoiceFilters value={invoiceFilters} onChange={handleInvoiceFiltersChange} />

          {invoicesQuery.status === "loading" && (
            <div className="flex flex-col gap-3">
              <LoadingSkeleton className="h-10 w-full" />
              <LoadingSkeleton className="h-64 w-full" />
            </div>
          )}

          {invoicesQuery.status === "error" && (
            <ErrorState title="Could not load invoices" description={invoicesQuery.error ?? undefined} onRetry={invoicesQuery.refetch} />
          )}

          {invoicesQuery.status === "success" && invoicesQuery.result && invoicesQuery.result.items.length === 0 && (
            <EmptyState title="No invoices match these filters" description="Try clearing a filter, or add a new invoice." />
          )}

          {invoicesQuery.status === "success" && invoicesQuery.result && invoicesQuery.result.items.length > 0 && (
            <>
              <InvoiceTable
                invoices={invoicesQuery.result.items}
                payments={vendorPaymentsResult?.items ?? []}
                sortBy={invoiceFilters.sortBy}
                sortDir={invoiceFilters.sortDir}
                onSortChange={handleInvoiceSortChange}
                onView={canWrite ? openEditInvoice : undefined}
              />
              <Pagination
                page={invoicesQuery.result.page}
                pageSize={invoicesQuery.result.pageSize}
                total={invoicesQuery.result.total}
                onPageChange={(page) => setInvoiceFilters((prev) => ({ ...prev, page }))}
              />
            </>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <h2 className="font-heading text-lg font-semibold text-ink">Payment Entries</h2>
            <PermissionGuard permission="finance:write">
              <Button size="sm" onClick={() => setAddDialog("payment")}>
                <Plus className="h-4 w-4" aria-hidden />
                Add Payment
              </Button>
            </PermissionGuard>
          </div>

          <PaymentFilters value={vendorPaymentFilters} onChange={handleVendorPaymentFiltersChange} fixedDirection="payment" />

          {vendorPaymentsQuery.status === "loading" && (
            <div className="flex flex-col gap-3">
              <LoadingSkeleton className="h-10 w-full" />
              <LoadingSkeleton className="h-64 w-full" />
            </div>
          )}

          {vendorPaymentsQuery.status === "error" && (
            <ErrorState title="Could not load payments" description={vendorPaymentsQuery.error ?? undefined} onRetry={vendorPaymentsQuery.refetch} />
          )}

          {vendorPaymentsQuery.status === "success" && vendorPaymentsQuery.result && vendorPaymentsQuery.result.items.length === 0 && (
            <EmptyState title="No payments match these filters" description="Try clearing a filter, or add a new payment." />
          )}

          {vendorPaymentsQuery.status === "success" && vendorPaymentsQuery.result && vendorPaymentsQuery.result.items.length > 0 && (
            <>
              <PaymentTable
                payments={vendorPaymentsQuery.result.items}
                sortBy={vendorPaymentFilters.sortBy}
                sortDir={vendorPaymentFilters.sortDir}
                onSortChange={handleVendorPaymentSortChange}
                onView={canWrite ? openEditPayment : undefined}
              />
              <Pagination
                page={vendorPaymentsQuery.result.page}
                pageSize={vendorPaymentsQuery.result.pageSize}
                total={vendorPaymentsQuery.result.total}
                onPageChange={(page) => setVendorPaymentFilters((prev) => ({ ...prev, page }))}
              />
            </>
          )}
        </>
      )}

      {tab === "receipts" && (
        <>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <PermissionGuard permission="finance:write">
              <Button size="sm" onClick={() => setAddDialog("receipt")}>
                <Plus className="h-4 w-4" aria-hidden />
                Add Receipt
              </Button>
            </PermissionGuard>
          </div>

          <PaymentFilters value={receiptFilters} onChange={handleReceiptFiltersChange} fixedDirection="receipt" />

          {receiptsQuery.status === "loading" && (
            <div className="flex flex-col gap-3">
              <LoadingSkeleton className="h-10 w-full" />
              <LoadingSkeleton className="h-64 w-full" />
            </div>
          )}

          {receiptsQuery.status === "error" && (
            <ErrorState title="Could not load receipts" description={receiptsQuery.error ?? undefined} onRetry={receiptsQuery.refetch} />
          )}

          {receiptsQuery.status === "success" && receiptsQuery.result && receiptsQuery.result.items.length === 0 && (
            <EmptyState title="No receipts match these filters" description="Try clearing a filter, or add a new receipt." />
          )}

          {receiptsQuery.status === "success" && receiptsQuery.result && receiptsQuery.result.items.length > 0 && (
            <>
              <PaymentTable
                payments={receiptsQuery.result.items}
                sortBy={receiptFilters.sortBy}
                sortDir={receiptFilters.sortDir}
                onSortChange={handleReceiptSortChange}
                onView={canWrite ? openEditPayment : undefined}
              />
              <Pagination
                page={receiptsQuery.result.page}
                pageSize={receiptsQuery.result.pageSize}
                total={receiptsQuery.result.total}
                onPageChange={(page) => setReceiptFilters((prev) => ({ ...prev, page }))}
              />
            </>
          )}
        </>
      )}

      <Dialog
        open={addDialog === "invoice"}
        onClose={closeAddDialog}
        title={editingInvoice ? "Edit Invoice" : "Add Invoice"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <InvoiceForm
          mode={editingInvoice ? "edit" : "create"}
          invoice={editingInvoice ?? undefined}
          onCancel={closeAddDialog}
          onSuccess={() => {
            closeAddDialog();
            invoicesQuery.refetch();
          }}
        />
      </Dialog>

      <Dialog
        open={addDialog === "payment"}
        onClose={closeAddDialog}
        title={editingPayment ? "Edit Payment" : "Add Payment"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <PaymentForm
          mode={editingPayment ? "edit" : "create"}
          payment={editingPayment ?? undefined}
          lockDirectionTo="payment"
          onCancel={closeAddDialog}
          onSuccess={() => {
            closeAddDialog();
            vendorPaymentsQuery.refetch();
          }}
        />
      </Dialog>

      <Dialog
        open={addDialog === "receipt"}
        onClose={closeAddDialog}
        title={editingPayment ? "Edit Receipt" : "Add Receipt"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <PaymentForm
          mode={editingPayment ? "edit" : "create"}
          payment={editingPayment ?? undefined}
          lockDirectionTo="receipt"
          onCancel={closeAddDialog}
          onSuccess={() => {
            closeAddDialog();
            receiptsQuery.refetch();
          }}
        />
      </Dialog>
    </div>
  );
}
