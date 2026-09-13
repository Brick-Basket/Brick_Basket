import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium " +
    "transition-colors disabled:pointer-events-none disabled:opacity-50 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-brand-red text-white hover:bg-brand-red-dark",
        secondary: "bg-brand-charcoal text-white hover:bg-brand-charcoal/90",
        outline: "border border-border bg-transparent text-ink hover:bg-surface-muted",
        ghost: "text-ink hover:bg-surface-muted",
        link: "text-brand-red underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * Core action primitive. Every mutating action in the app (send for
 * acceptance, approve, issue PO, etc.) renders through this component so
 * loading/disabled affordances stay consistent — feature modules should not
 * hand-roll <button> styling.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
