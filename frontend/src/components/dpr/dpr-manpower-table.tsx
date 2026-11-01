import { DPR_MANPOWER_CATEGORIES } from "@/components/dpr/dpr-manpower-config";
import { getTotalManpower } from "@/components/dpr/dpr-work-item-math";
import type { DPRManpowerEntry } from "@/types/domain/dpr";

/**
 * Read-only manpower table for `DPRDetail` — one row per
 * `DPRManpowerCategory` in the same fixed order `DPRManpowerEditor` uses,
 * with a computed "Total" column plus a grand-total footer row.
 */
export function DPRManpowerTable({ entries }: { entries: DPRManpowerEntry[] }) {
  const byCategory = new Map(entries.map((e) => [e.category, e]));
  const grandSkilled = entries.reduce((sum, e) => sum + e.skilled, 0);
  const grandUnskilled = entries.reduce((sum, e) => sum + e.unskilled, 0);

  return (
    <div className="max-h-[70vh] overflow-auto rounded-card border border-border">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="sticky top-0 z-10 bg-surface-muted text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2 text-right">Skilled</th>
            <th className="px-3 py-2 text-right">Unskilled</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2">Agency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {DPR_MANPOWER_CATEGORIES.map((cat) => {
            const entry = byCategory.get(cat.value);
            const skilled = entry?.skilled ?? 0;
            const unskilled = entry?.unskilled ?? 0;
            return (
              <tr key={cat.value} className="even:bg-surface-muted/40">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-ink">{cat.label}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{skilled}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{unskilled}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{getTotalManpower(skilled, unskilled)}</td>
                <td className="px-3 py-2 text-ink-muted">{entry?.agency || "—"}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-surface-muted font-medium text-ink">
            <td className="px-3 py-2">Total</td>
            <td className="px-3 py-2 text-right tabular-nums">{grandSkilled}</td>
            <td className="px-3 py-2 text-right tabular-nums">{grandUnskilled}</td>
            <td className="px-3 py-2 text-right tabular-nums">{getTotalManpower(grandSkilled, grandUnskilled)}</td>
            <td className="px-3 py-2" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
