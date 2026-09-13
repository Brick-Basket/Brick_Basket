import { formatINR } from "@/lib/utils/format";
import { CONTRACT_CATEGORY_CONFIG } from "@/components/contracts/contract-category-config";
import type { ContractLineItem } from "@/types/domain/contract";

/** Read-only line-items table for the contract detail view, on both the admin and customer sides. */
export function ContractLineItemsTable({ lineItems }: { lineItems: ContractLineItem[] }) {
  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0);

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">Category</th>
            <th className="px-4 py-3 font-medium text-ink-muted">Description</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">UOM</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Qty</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Rate</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((li) => (
            <tr key={li.id} className="border-b border-border last:border-0">
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{CONTRACT_CATEGORY_CONFIG[li.category].label}</td>
              <td className="px-4 py-3 text-ink">{li.description}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{li.uom}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{li.quantity.toLocaleString("en-IN")}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{formatINR(li.rate)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink">{formatINR(li.quantity * li.rate)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-muted">
            <td colSpan={5} className="px-4 py-3 text-right font-medium text-ink">
              Total
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink">{formatINR(total)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="border-t border-border bg-surface-muted px-4 py-2 text-xs text-ink-muted">
        Illustrative rates for demonstration only — not owner-confirmed pricing. See docs/OPEN_QUESTIONS.md.
      </p>
    </div>
  );
}
