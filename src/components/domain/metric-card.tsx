import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/**
 * Generic metric tile for dashboard grids — business-vocabulary-free, same
 * spirit as `StatusBadge`: callers pass in a label/value/icon, this
 * component knows nothing about leads, POs, or tax records.
 *
 * **FRONTEND IMPLEMENTATION DECISION** — the master prompt's core
 * reusable-component list names `StatCard` and `MetricCard` separately
 * with no distinguishing description between them. Rather than build two
 * near-duplicate primitives, this app has exactly one — `MetricCard` — and
 * every dashboard tile (Ops Dashboard, Portal Home) uses it. See
 * `docs/OPEN_QUESTIONS.md` #40 and `docs/COMPONENT_GUIDE.md`.
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  href?: string;
  tone?: "neutral" | "attention";
}) {
  const content = (
    <Card className={cn("flex flex-col gap-2 p-5 transition-colors", href && "hover:border-ink-muted")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              tone === "attention" ? "bg-warning/10 text-warning" : "bg-surface-muted text-ink-muted",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
      {/* Value always renders in `text-ink`, even when `tone === "attention"`
         — `text-warning` on this card's white/ivory surfaces measures
         ~2.15:1 contrast (WCAG AA needs 4.5:1 for text this size), so the
         "needs attention" signal is carried by the icon chip's tint alone,
         not by recoloring the number itself. See docs/OPEN_QUESTIONS.md #40. */}
      <p className="font-heading text-2xl font-semibold text-ink">{value}</p>
    </Card>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}
