"use client";

import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/domain/empty-state";
import { stockMaterialLabel } from "@/components/stock/stock-material-config";
import { formatINR } from "@/lib/utils/format";
import type { WastageEntry } from "@/types/domain/wastage-entry";

/**
 * The "summary" half of the required summary/detail UI — total quantity
 * and value grouped by material, computed client-side from the full
 * entry list (never stored) so the backend doesn't need a dedicated
 * aggregate endpoint for this frontend to demo the required view.
 */
export function WastageSummary({ entries }: { entries: WastageEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState icon={Trash2} title="No wastage entries match these filters" description="Try clearing a filter, or log a new entry." />;
  }

  const groups = new Map<string, { label: string; totalQuantity: number; totalValue: number; uom: string; count: number }>();
  for (const entry of entries) {
    const key = entry.material === "other" ? `other:${entry.otherMaterialName ?? ""}` : entry.material;
    const label = stockMaterialLabel(entry.material, entry.otherMaterialName);
    const existing = groups.get(key);
    if (existing) {
      existing.totalQuantity += entry.quantity;
      existing.totalValue += entry.value;
      existing.count += 1;
    } else {
      groups.set(key, { label, totalQuantity: entry.quantity, totalValue: entry.value, uom: entry.uom, count: 1 });
    }
  }

  const rows = [...groups.values()].sort((a, b) => b.totalValue - a.totalValue);
  const grandTotalValue = rows.reduce((sum, r) => sum + r.totalValue, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <Card key={row.label}>
            <CardContent className="flex flex-col gap-1 pt-6">
              <p className="text-sm font-medium text-ink">{row.label}</p>
              <p className="text-xs text-ink-muted">
                {row.count} entr{row.count === 1 ? "y" : "ies"} · {row.totalQuantity.toLocaleString("en-IN")} {row.uom}
              </p>
              <p className="mt-1 text-lg font-semibold text-ink">{formatINR(row.totalValue)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-ink-muted">
        Total wastage value across {rows.length} material{rows.length === 1 ? "" : "s"}: <span className="font-semibold text-ink">{formatINR(grandTotalValue)}</span>
      </p>
    </div>
  );
}
