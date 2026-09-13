import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Standard "nothing here yet" state — every list/table screen uses this instead of hand-rolled copy. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="font-heading text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}
