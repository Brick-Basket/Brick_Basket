import { Badge } from "@/components/ui/badge";
import type { MRCLineItem } from "@/types/domain/mrc";

/** Read-only line-items table for the MRC detail view, on both the admin and customer sides. No amounts/money — this module certifies materials, make and warranty terms, not value. */
export function MRCLineItemsTable({ lineItems }: { lineItems: MRCLineItem[] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">Source</th>
            <th className="px-4 py-3 font-medium text-ink-muted">Description</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">UOM</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Qty</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">Make</th>
            <th className="px-4 py-3 font-medium text-ink-muted">Warranty Terms</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((li) => (
            <tr key={li.id} className="border-b border-border last:border-0">
              <td className="whitespace-nowrap px-4 py-3">
                <Badge variant={li.source === "grn" ? "brand" : "neutral"}>{li.source === "grn" ? "From GRN" : "Manual"}</Badge>
              </td>
              <td className="px-4 py-3 text-ink">{li.description}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{li.uom}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{li.quantity.toLocaleString("en-IN")}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink">{li.make}</td>
              <td className="px-4 py-3 text-ink-muted">{li.warrantyTerms ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
