"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * `Dialog` pre-wired for a destructive/consequential confirm-cancel action
 * (e.g. transitioning a lead to "Lost"). Any module needing a "are you
 * sure?" step should use this instead of a bespoke modal.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 13): added an optional `error` prop. A caller's `onConfirm` handler must
 * NOT close this dialog / refetch on a failed mutation — that made a
 * rejected action (e.g. "Send for Acceptance" on a contract the backend
 * refuses) look like it succeeded, since the dialog vanished either way.
 * Pass the mutation hook's own `error` here so the dialog stays open with
 * the failure visible, and only call `onClose()` yourself once the
 * mutation's return value confirms success. See docs/OPEN_QUESTIONS.md #45.
 */
export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "secondary" | "outline";
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </Dialog>
  );
}
