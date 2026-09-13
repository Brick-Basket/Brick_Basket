"use client";

import { useState } from "react";
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

type Tab = "invoices" | "payments";

const PAGE_SIZE = 10;

/**
 * "Capture PO/vendor code/invoice details/invoice amount/invoice copy/
 * payment details" (§8B) — split across two tabs on one route, one entity
 * per hand-off stage (Invoice, then Payment against it), the same
 * Detail/Summary toggle mechanic Wastage used (Part 11), repurposed here
 * to switch between two sibling record types instead of two views of one.
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

  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "invoiceDate", sortDir: "desc" });
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const invoicesQuery = useInvoices(invoiceFilters);
  const { result: vendorPaymentsResult } = useVendorPayments();

  const [paymentFilters, setPaymentFilters] = useState<PaymentListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "paymentDate", sortDir: "desc" });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const paymentsQuery = usePayments(paymentFilters);

  const handleInvoiceSortChange = (key: string) => {
    setInvoiceFilters((prev) => ({
      ...prev,
      sortBy: key as InvoiceListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };
  const closeInvoiceForm = () => {
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  const handlePaymentSortChange = (key: string) => {
    setPaymentFilters((prev) => ({
      ...prev,
      sortBy: key as PaymentListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };
  const closePaymentForm = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Payments & Receipts</h1>
          <p className="text-sm text-ink-muted">Vendor invoices against issued Purchase Orders, and the payments/receipts recorded against them.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5">
            <Button variant={tab === "invoices" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("invoices")} aria-pressed={tab === "invoices"}>
              <FileText className="h-4 w-4" aria-hidden />
              Invoices
            </Button>
            <Button variant={tab === "payments" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("payments")} aria-pressed={tab === "payments"}>
              <ReceiptIcon className="h-4 w-4" aria-hidden />
              Payments & Receipts
            </Button>
          </div>
          <PermissionGuard permission="finance:write">
            <Button onClick={() => (tab === "invoices" ? setShowInvoiceForm(true) : setShowPaymentForm(true))}>
              <Plus className="h-4 w-4" aria-hidden />
              {tab === "invoices" ? "Add Invoice" : "Add Entry"}
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {tab === "invoices" && (
        <>
          <InvoiceFilters value={invoiceFilters} onChange={setInvoiceFilters} />

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
                onView={
                  canWrite
                    ? (invoice) => {
                        setEditingInvoice(invoice);
                        setShowInvoiceForm(true);
                      }
                    : undefined
                }
              />
              <Pagination
                page={invoicesQuery.result.page}
                pageSize={invoicesQuery.result.pageSize}
                total={invoicesQuery.result.total}
                onPageChange={(page) => setInvoiceFilters((prev) => ({ ...prev, page }))}
              />
            </>
          )}
        </>
      )}

      {tab === "payments" && (
        <>
          <PaymentFilters value={paymentFilters} onChange={setPaymentFilters} />

          {paymentsQuery.status === "loading" && (
            <div className="flex flex-col gap-3">
              <LoadingSkeleton className="h-10 w-full" />
              <LoadingSkeleton className="h-64 w-full" />
            </div>
          )}

          {paymentsQuery.status === "error" && (
            <ErrorState title="Could not load payments" description={paymentsQuery.error ?? undefined} onRetry={paymentsQuery.refetch} />
          )}

          {paymentsQuery.status === "success" && paymentsQuery.result && paymentsQuery.result.items.length === 0 && (
            <EmptyState title="No payments or receipts match these filters" description="Try clearing a filter, or add a new entry." />
          )}

          {paymentsQuery.status === "success" && paymentsQuery.result && paymentsQuery.result.items.length > 0 && (
            <>
              <PaymentTable
                payments={paymentsQuery.result.items}
                sortBy={paymentFilters.sortBy}
                sortDir={paymentFilters.sortDir}
                onSortChange={handlePaymentSortChange}
                onView={
                  canWrite
                    ? (payment) => {
                        setEditingPayment(payment);
                        setShowPaymentForm(true);
                      }
                    : undefined
                }
              />
              <Pagination
                page={paymentsQuery.result.page}
                pageSize={paymentsQuery.result.pageSize}
                total={paymentsQuery.result.total}
                onPageChange={(page) => setPaymentFilters((prev) => ({ ...prev, page }))}
              />
            </>
          )}
        </>
      )}

      <Dialog
        open={showInvoiceForm}
        onClose={closeInvoiceForm}
        title={editingInvoice ? "Edit Invoice" : "Add Invoice"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <InvoiceForm
          mode={editingInvoice ? "edit" : "create"}
          invoice={editingInvoice ?? undefined}
          onCancel={closeInvoiceForm}
          onSuccess={() => {
            closeInvoiceForm();
            invoicesQuery.refetch();
          }}
        />
      </Dialog>

      <Dialog
        open={showPaymentForm}
        onClose={closePaymentForm}
        title={editingPayment ? "Edit Entry" : "Add Payment/Receipt"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <PaymentForm
          mode={editingPayment ? "edit" : "create"}
          payment={editingPayment ?? undefined}
          onCancel={closePaymentForm}
          onSuccess={() => {
            closePaymentForm();
            paymentsQuery.refetch();
          }}
        />
      </Dialog>
    </div>
  );
}
