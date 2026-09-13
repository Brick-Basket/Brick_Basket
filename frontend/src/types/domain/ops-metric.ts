/**
 * OpsMetric — the Ops Dashboard's (`/admin`) cross-module metric cards,
 * Part 19. Same "pure computed aggregate, no persisted record" pattern as
 * `CostToComplete` (Part 18) and `AppNotification` (Part 19) — a metric is
 * a live count/total over already-existing records, recomputed on every
 * call, never stored. See `OpsMetricsAdapter` in
 * `src/lib/api/adapters/ops-metrics-adapter.ts` for the full source list.
 */
export interface OpsMetric {
  /** Stable within one computed batch — not a backend-issued id. */
  id: string;
  label: string;
  /** Pre-formatted for display — a plain count ("7") or a currency string (`formatINR`'s output) depending on the metric. */
  value: string;
  /** Route to the list/report this metric summarizes. */
  href: string;
  /** Drives `MetricCard`'s accent color — "attention" metrics (something waiting on someone) render warmer than plain counts. */
  tone: "neutral" | "attention";
}
