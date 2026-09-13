"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { formatINR } from "@/lib/utils/format";
import type { PurchaseOrderLineItem } from "@/types/domain/purchase-order";

/**
 * Read-only line items for the PO detail page. Amount/tax/total are always
 * computed at render time (never stored) — see
 * `docs/DATA_MODELS.md`'s field typing conventions, same as the RFQ
 * comparison table's approach.
 */
export function POLineItemsTable({ lineItems, taxPercent }: { lineItems: PurchaseOrderLineItem[]; taxPercent: number }) {
  const columns: DataTableColumn<PurchaseOrderLineItem>[] = [
    {
      key: "description",
      header: "Item",
      render: (l) => <span className="font-medium text-ink">{l.description}</span>,
    },
    { key: "uom", header: "UOM", hideOnMobile: true, render: (l) => l.uom },
    { key: "quantity", header: "Qty", render: (l) => l.quantity.toLocaleString("en-IN") },
    { key: "rate", header: "Rate", render: (l) => formatINR(l.rate) },
    { key: "amount", header: "Amount", render: (l) => formatINR(l.rate * l.quantity) },
  ];

  const subtotal = lineItems.reduce((sum, l) => sum + l.rate * l.quantity, 0);
  const tax = subtotal * (taxPercent / 100);
  const total = subtotal + tax;

  return (
    <div className="flex flex-col gap-3">
      <DataTable columns={columns} rows={lineItems} keyFor={(l) => l.id} />
      <div className="ml-auto flex w-full flex-col gap-1 rounded-card border border-border bg-surface-muted px-4 py-3 text-sm sm:w-64">
        <div className="flex justify-between text-ink-muted">
          <span>Subtotal</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink-muted">
          <span>Tax ({taxPercent}%)</span>
          <span>{formatINR(tax)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-1 font-semibold text-ink">
          <span>Total</span>
          <span>{formatINR(total)}</span>
        </div>
      </div>
    </div>
  );
}
