import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * Standard error/forbidden state. `variant="forbidden"` is used by
 * AuthGuard/RoleGuard-protected routes when a signed-in user lacks access;
 * `variant="error"` (default) is for a failed data load, with an optional
 * retry action.
 */
export function ErrorState({
  variant = "error",
  title,
  description,
  onRetry,
  className,
}: {
  variant?: "error" | "forbidden";
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const Icon = variant === "forbidden" ? ShieldAlert : AlertTriangle;
  return (
    <div className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="font-heading text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
