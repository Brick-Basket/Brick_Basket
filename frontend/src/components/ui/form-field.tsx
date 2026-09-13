import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

/**
 * Label + control + error-message wrapper. Every form field in the app
 * (this contact form, and every operational form from Part 4 onward) should
 * compose through this rather than hand-rolling label/error markup, so
 * validation states stay visually and semantically consistent.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 14): `errorId`/`hintId` existed before this fix but were never actually
 * wired to the control — a screen-reader user tabbing into the field had
 * no way to know an error or hint message was there at all, since nothing
 * pointed `aria-describedby` at it. `children` is a single form control in
 * every call site in this app (`<Input>`/`<Textarea>`/`<Select>` etc.), so
 * this clones it to inject `aria-describedby` automatically rather than
 * requiring every one of those call sites to wire it up by hand. `Input`
 * (and its siblings) already set their own `aria-invalid` from their
 * `invalid` prop, so that is left alone here. See docs/OPEN_QUESTIONS.md #48.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = React.isValidElement<{ "aria-describedby"?: string }>(children)
    ? React.cloneElement(children, {
        "aria-describedby": describedBy
          ? [children.props["aria-describedby"], describedBy].filter(Boolean).join(" ")
          : children.props["aria-describedby"],
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-error"> *</span>}
      </Label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
