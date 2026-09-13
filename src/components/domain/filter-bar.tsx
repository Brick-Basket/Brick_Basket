import { cn } from "@/lib/utils/cn";

/** Layout shell for a list screen's search + filter controls — wraps on mobile. */
export function FilterBar({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>;
}
