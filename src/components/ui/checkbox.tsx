import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Native checkbox with brand-styled visuals layered on top via peer
 * classes — used for boolean toggles like a document's customer
 * visibility. Native input underneath keeps keyboard/screen-reader
 * behavior free, consistent with `Select`'s approach.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => (
  <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "peer h-5 w-5 shrink-0 appearance-none rounded border border-border bg-surface",
        "checked:border-brand-red checked:bg-brand-red",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
    <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" aria-hidden />
  </span>
));
Checkbox.displayName = "Checkbox";
