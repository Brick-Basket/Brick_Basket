"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Dialog } from "@/components/ui/dialog";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePermission } from "@/lib/permissions/use-permission";
import { useBoqRates, useUpdateBoqRateItem } from "@/hooks/use-boq-rates";
import type { BoqRateItem, BoqTierRates } from "@/types/domain/boq-rate-item";
import { formatINR } from "@/lib/utils/format";

/**
 * PRICING & PACKAGES CONTENT — real module, this pass (post-Part-20; still
 * carries no "Part N" badge, since it wasn't one of the original 20 parts).
 *
 * This started as a scaffolded placeholder (docs/OPEN_QUESTIONS.md #65) for
 * the *whole* package-pricing surface (rates, feature copy, comparison
 * table, estimator assumptions) — that broader question is still open and
 * still described in docs/DATA_MODELS.md / docs/API_CONTRACTS.md as
 * "proposed, not implemented".
 *
 * What changed this pass: the owner asked, against the live Cost Estimator's
 * Bill of Quantities table, "from where all these costs are coming for each
 * of the 11 fields/materials ... create a dedicated section where these
 * will be manually maintained" (see docs/OPEN_QUESTIONS.md #67 for the full
 * decision record). That's a narrower, fully-specified sub-problem — the 11
 * BOQ material/labor rates specifically — so this page now gives it a real,
 * working admin screen: a table of all 11 `BoqRateItem`s
 * (`src/types/domain/boq-rate-item.ts`) backed by a real mock adapter
 * (`boqRatesAdapter`/`useBoqRates()`), with an edit dialog gated behind the
 * new `pricing_content:manage` permission.
 *
 * BOQ VISIBILITY (owner correction, docs/OPEN_QUESTIONS.md #76): the BOQ
 * rate card was never meant for site visitors — "boq should not be visible
 * to visitors on the app/website, only the core brick basket team should
 * know this." The public Cost Estimator no longer renders any BOQ table or
 * per-line breakdown (`cost-estimator-section.tsx` now shows only a plain
 * "what this estimate includes" summary). This page — permission-gated
 * behind `pricing_content:view`/`pricing_content:manage`, internal-only —
 * remains the *only* place the 11 BOQ rates are shown or edited. They no
 * longer feed any public-facing panel; `boqRatesAdapter`/`useBoqRates()` is
 * now consumed here alone.
 *
 * Still deliberately NOT built here: editing the package ₹/sqft rates,
 * comparison-table copy, or estimator assumptions (ground coverage %,
 * timeline options) — those remain the broader #65 product decision, not
 * yet made. Only the 11 fixed BOQ rate rows are editable; there is no
 * add/remove row here on purpose (see `boq-rates-adapter.ts`'s doc comment
 * — adding a 12th material is a calculation-code change, not a content
 * edit).
 */
export default function PricingContentPage() {
  return (
    <PermissionGuard
      permission="pricing_content:view"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState
            variant="forbidden"
            title="You don't have access to Pricing & Packages Content"
            description="Ask an administrator for the pricing_content:view permission."
          />
        </div>
      }
    >
      <PricingContentPageContent />
    </PermissionGuard>
  );
}

function PricingContentPageContent() {
  const { status, error, items, refetch } = useBoqRates();
  const canManage = usePermission("pricing_content:manage");
  const [editing, setEditing] = useState<BoqRateItem | null>(null);

  const columns = useMemo<DataTableColumn<BoqRateItem>[]>(
    () => [
      { key: "label", header: "Item", render: (row) => <span className="font-medium text-ink">{row.label}</span> },
      {
        key: "group",
        header: "Group",
        render: (row) => (
          <Badge variant={row.group === "finish" ? "brand" : "neutral"}>
            {row.group === "finish" ? "Finish" : "Structural"}
          </Badge>
        ),
      },
      {
        key: "qtyPerSqft",
        header: "Qty / sqft",
        render: (row) => `${row.qtyPerSqft} ${row.unit}`,
        hideOnMobile: true,
      },
      {
        key: "rate",
        header: "Rate (₹ / unit)",
        render: (row) =>
          row.group === "structure" ? (
            formatINR(row.ratePerUnit.essential)
          ) : (
            <span className="whitespace-nowrap text-xs">
              {formatINR(row.ratePerUnit.essential)} · {formatINR(row.ratePerUnit.smart)} ·{" "}
              {formatINR(row.ratePerUnit.premium)} · {formatINR(row.ratePerUnit.signature)}
            </span>
          ),
      },
      {
        key: "updatedAt",
        header: "Last updated",
        render: (row) => (
          <span className="text-xs text-ink-muted">
            {new Date(row.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {row.updatedBy ? ` by ${row.updatedBy}` : ""}
          </span>
        ),
        hideOnMobile: true,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold text-ink">Pricing &amp; Packages Content</h1>
          <Badge variant="warning">Package rates &amp; comparison table still pending — see below</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          The 11 material &amp; labor rates behind the public Cost Estimator&apos;s &ldquo;Indicative Bill of
          Quantities&rdquo; table — maintained here so every visitor sees real, current numbers instead of
          hardcoded frontend estimates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill of Quantities — Material &amp; Labor Rates</CardTitle>
          <CardDescription>
            Structural items (cement, steel, bricks, sand, aggregate, labor) use one rate at every package tier.
            Finish items (flooring, paint, doors &amp; windows, plumbing, electrical) can have a different rate per
            tier — shown as Essential · Smart · Premium · Signature.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === "loading" && (
            <div className="flex flex-col gap-2">
              <LoadingSkeleton className="h-10 w-full" />
              <LoadingSkeleton className="h-64 w-full" />
            </div>
          )}

          {status === "error" && (
            <ErrorState title="Could not load material & labor rates" description={error ?? undefined} onRetry={refetch} />
          )}

          {status === "success" && (
            <DataTable
              columns={columns}
              rows={items}
              keyFor={(row) => row.id}
              rowActions={
                canManage
                  ? (row) => (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(row)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Edit
                      </Button>
                    )
                  : undefined
              }
            />
          )}

          {!canManage && status === "success" && (
            <p className="text-xs text-ink-muted">
              You have view-only access. Ask an administrator for the{" "}
              <code className="rounded bg-surface-muted px-1 py-0.5">pricing_content:manage</code> permission to
              edit these rates.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Package Rates, Comparison Table &amp; Estimator Assumptions</CardTitle>
            <Badge variant="warning">Awaiting owner/backend decision</Badge>
          </div>
          <CardDescription>
            The 4 package ₹/sqft rates, the feature comparison table, and estimator assumptions (ground coverage %,
            timeline options) are separate from the BOQ rates above and remain plain code in{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">src/lib/content/public-site.ts</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            This is the still-open part of the original scaffolded module — see{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">docs/OPEN_QUESTIONS.md</code> #65 for the
            full audit and <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">docs/DATA_MODELS.md</code>/
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">docs/API_CONTRACTS.md</code> for the
            proposed (not yet confirmed) entity shape and endpoints a backend build would use.
          </p>
        </CardContent>
      </Card>

      <BoqRateEditDialog item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
    </div>
  );
}

function BoqRateEditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: BoqRateItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={!!item} onClose={onClose} title={item ? `Edit — ${item.label}` : "Edit rate"} description="Changes apply immediately to the public Cost Estimator.">
      {item && <BoqRateEditForm item={item} onCancel={onClose} onSuccess={onSaved} />}
    </Dialog>
  );
}

function BoqRateEditForm({
  item,
  onCancel,
  onSuccess,
}: {
  item: BoqRateItem;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { submit, status, error } = useUpdateBoqRateItem();
  const [qtyPerSqft, setQtyPerSqft] = useState(String(item.qtyPerSqft));
  const [rates, setRates] = useState<BoqTierRates>(item.ratePerUnit);
  const [rationale, setRationale] = useState(item.rationale);

  const isStructure = item.group === "structure";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const qty = Number(qtyPerSqft);
    if (!Number.isFinite(qty) || qty <= 0) return;

    const ratePerUnit: BoqTierRates = isStructure
      ? { essential: rates.essential, smart: rates.essential, premium: rates.essential, signature: rates.essential }
      : rates;

    submit(item.id, { qtyPerSqft: qty, ratePerUnit, rationale }, { name: "Admin" }).then((updated) => {
      if (updated) onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label={`Quantity per sqft (${item.unit})`} htmlFor="boq-qty">
        <Input
          id="boq-qty"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          value={qtyPerSqft}
          onChange={(e) => setQtyPerSqft(e.target.value)}
        />
      </FormField>

      {isStructure ? (
        <FormField label={`Rate per ${item.unit.replace(/s$/, "")} (₹, same at every tier)`} htmlFor="boq-rate-flat">
          <Input
            id="boq-rate-flat"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={rates.essential}
            onChange={(e) => setRates((prev) => ({ ...prev, essential: Number(e.target.value) }))}
          />
        </FormField>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Essential rate (₹)" htmlFor="boq-rate-essential">
            <Input
              id="boq-rate-essential"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={rates.essential}
              onChange={(e) => setRates((prev) => ({ ...prev, essential: Number(e.target.value) }))}
            />
          </FormField>
          <FormField label="Smart rate (₹)" htmlFor="boq-rate-smart">
            <Input
              id="boq-rate-smart"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={rates.smart}
              onChange={(e) => setRates((prev) => ({ ...prev, smart: Number(e.target.value) }))}
            />
          </FormField>
          <FormField label="Premium rate (₹)" htmlFor="boq-rate-premium">
            <Input
              id="boq-rate-premium"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={rates.premium}
              onChange={(e) => setRates((prev) => ({ ...prev, premium: Number(e.target.value) }))}
            />
          </FormField>
          <FormField label="Signature rate (₹)" htmlFor="boq-rate-signature">
            <Input
              id="boq-rate-signature"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={rates.signature}
              onChange={(e) => setRates((prev) => ({ ...prev, signature: Number(e.target.value) }))}
            />
          </FormField>
        </div>
      )}

      <FormField label="Rationale / notes" htmlFor="boq-rationale" hint="Shown to site visitors in the estimator's “how these estimates are calculated” panel.">
        <textarea
          id="boq-rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
        />
      </FormField>

      {status === "error" && (
        <p className="text-sm font-medium text-error">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={status === "loading"}>
          {status === "loading" ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
