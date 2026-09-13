"use client";

import { formatINR } from "@/lib/utils/format";
import type { GRNLineItem } from "@/types/domain/grn";

/**
 * "Materials ordered" vs. "Materials received" side by side, plus Brand,
 * Warranty certificate and Rate — the owner's required GRN fields shown
 * per line. Amount (`rate × receivedQuantity`) is always computed, never
 * stored.
 */
export function GRNLineItemsTable({ lineItems }: { lineItems: GRNLineItem[] }) {
  if (lineItems.length === 0) {
    return <p className="text-sm text-ink-muted">No lines recorded.</p>;
  }

  const totalAmount = lineItems.reduce((sum, l) => sum + l.rate * l.receivedQuantity, 0);

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted">
          <tr>
            <th className="px-3 py-2 font-medium text-ink-muted">Material</th>
            <th className="px-3 py-2 font-medium text-ink-muted">Ordered</th>
            <th className="px-3 py-2 font-medium text-ink-muted">Received</th>
            <th className="px-3 py-2 font-medium text-ink-muted">Brand</th>
            <th className="px-3 py-2 font-medium text-ink-muted">Warranty Certificate</th>
            <th className="px-3 py-2 font-medium text-ink-muted">Rate</th>
            <th className="px-3 py-2 font-medium text-ink-muted">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((l) => {
            const short = l.receivedQuantity < l.orderedQuantity;
            return (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-ink">{l.description}</td>
                <td className="px-3 py-2 text-ink-muted">
                  {l.orderedQuantity.toLocaleString("en-IN")} {l.uom}
                </td>
                <td className={`px-3 py-2 font-medium ${short ? "text-warning" : "text-ink"}`}>
                  {l.receivedQuantity.toLocaleString("en-IN")} {l.uom}
                  {short && <span className="ml-1 text-xs font-normal text-ink-muted">(partial)</span>}
                </td>
                <td className="px-3 py-2 text-ink-muted">{l.brand || "—"}</td>
                <td className="px-3 py-2 text-ink-muted">{l.warrantyCertificateNumber || "—"}</td>
                <td className="px-3 py-2 text-ink-muted">{formatINR(l.rate)}</td>
                <td className="px-3 py-2 text-ink">{formatINR(l.rate * l.receivedQuantity)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-muted">
            <td className="px-3 py-2 font-medium text-ink" colSpan={6}>
              Total (received)
            </td>
            <td className="px-3 py-2 font-semibold text-ink">{formatINR(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
