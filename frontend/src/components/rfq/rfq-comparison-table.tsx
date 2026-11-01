"use client";

import { CheckCircle2, Paperclip, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils/format";
import { computeAmount, computeLandedCost, computeSavingsPercent, pickReferenceQuote, sortQuotesByLandedCost } from "@/components/rfq/rfq-comparison";
import type { RFQ, RFQLine, RFQVendorQuote } from "@/types/domain/rfq";
import type { Vendor } from "@/types/domain/vendor";

const VENDOR_SLOTS = 3;

/**
 * The required comparison table (owner spec §5C): material description,
 * UOM, quantity, ACE rate, up to 3 vendors' rate + amount, % savings over
 * ACE, tax, total, vendor code reference — with L1 highlighting and a
 * vendor-selection action per line. All monetary values are demo/mock,
 * per the owner's explicit instruction not to hardcode real client
 * figures — see the banner above this table on the detail page.
 *
 * Document 2 correction: each vendor's quote now shows a small
 * attachment indicator (Paperclip + file name) when an offer/quotation
 * was attached — `getQuotePreviewUrl` resolves it to a clickable
 * in-session preview when a real file is behind it (never for seeded
 * demo quotes, which carry no file bytes).
 *
 * **FRONTEND IMPLEMENTATION DECISION, docs/OPEN_QUESTIONS.md #87(a):** L1
 * and vendor-slot order are now decided by landed cost (rate × qty ×
 * (1+tax) + freight + loading + other), not raw quoted rate — a vendor
 * with the lowest rate but high delivery charges can correctly lose L1 to
 * one with a slightly higher rate and cheaper/no delivery. A quote with no
 * freight/loading/other on file behaves exactly as before (its landed cost
 * is just its tax-inclusive total), so this never changes the displayed
 * order for a quote that doesn't use the new fields.
 */
export function RFQComparisonTable({
  rfq,
  lines,
  quotesByLine,
  vendorsById,
  canEdit,
  onAddQuoteClick,
  onRemoveQuote,
  onSelectVendor,
  getQuotePreviewUrl,
  busy,
}: {
  rfq: RFQ;
  lines: RFQLine[];
  quotesByLine: Record<string, RFQVendorQuote[]>;
  vendorsById: Record<string, Vendor>;
  canEdit: boolean;
  onAddQuoteClick: (lineId: string) => void;
  onRemoveQuote: (lineId: string, vendorId: string) => void;
  onSelectVendor: (lineId: string, vendorId: string | null) => void;
  getQuotePreviewUrl?: (quoteId: string) => string | null;
  busy?: boolean;
}) {
  return (
    <div className="max-h-[70vh] overflow-auto rounded-card border border-border">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-border bg-surface-muted">
          <tr>
            <th className="px-4 py-3 font-medium text-ink-muted">Material</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">UOM</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Qty</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">ACE Rate</th>
            {Array.from({ length: VENDOR_SLOTS }).map((_, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">
                Vendor {i + 1}
              </th>
            ))}
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Savings vs ACE</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Tax</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const quotes = sortQuotesByLandedCost(quotesByLine[line.id] ?? [], line.quantity, rfq.taxPercent);
            const l1VendorId = quotes[0]?.vendorId ?? null;
            const referenceQuote = pickReferenceQuote(quotes, line.selectedVendorId, line.quantity, rfq.taxPercent);
            const savings = computeSavingsPercent(line.aceRate, referenceQuote?.rate ?? null);
            const total = referenceQuote ? computeLandedCost(referenceQuote, line.quantity, rfq.taxPercent) : null;
            const firstEmptySlot = quotes.length < VENDOR_SLOTS ? quotes.length : -1;

            return (
              <tr key={line.id} className="border-b border-border align-top last:border-0 even:bg-surface-muted/40">
                <td className="px-4 py-3 text-ink">{line.description}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{line.uom}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">{line.quantity.toLocaleString("en-IN")}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">{line.aceRate !== null ? formatINR(line.aceRate) : "—"}</td>

                {Array.from({ length: VENDOR_SLOTS }).map((_, slotIndex) => {
                  const quote = quotes[slotIndex];
                  if (!quote) {
                    return (
                      <td key={slotIndex} className="whitespace-nowrap px-4 py-3">
                        {canEdit && slotIndex === firstEmptySlot ? (
                          <Button variant="outline" size="sm" onClick={() => onAddQuoteClick(line.id)} disabled={busy}>
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                            Add Quote
                          </Button>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                    );
                  }
                  const vendor = vendorsById[quote.vendorId];
                  const isL1 = quote.vendorId === l1VendorId;
                  const isSelected = line.selectedVendorId === quote.vendorId;
                  const previewUrl = quote.attachmentFileName ? getQuotePreviewUrl?.(quote.id) ?? null : null;
                  const hasCharges = !!(quote.freight || quote.loadingCharges || quote.otherCharges);
                  return (
                    <td key={slotIndex} className="min-w-[10rem] px-4 py-3">
                      <p className="font-medium text-ink">{vendor?.tradeName ?? "Unknown vendor"}</p>
                      <p className="text-xs text-ink-muted">Code {vendor?.vendorCode ?? "—"}</p>
                      <p className="mt-1 text-ink">{formatINR(quote.rate)}</p>
                      <p className="text-xs text-ink-muted">Amt {formatINR(computeAmount(quote.rate, line.quantity))}</p>
                      {hasCharges && (
                        <p className="text-xs text-ink-muted" title="Freight + loading + other charges, in addition to the quoted rate">
                          +{formatINR((quote.freight ?? 0) + (quote.loadingCharges ?? 0) + (quote.otherCharges ?? 0))} delivery
                        </p>
                      )}
                      <p className="mt-0.5 text-xs font-medium text-ink" title="Landed cost: rate × qty × (1+tax) + freight + loading + other">
                        Landed {formatINR(computeLandedCost(quote, line.quantity, rfq.taxPercent))}
                      </p>
                      {quote.attachmentFileName && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                          <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
                          {previewUrl ? (
                            <a href={previewUrl} target="_blank" rel="noreferrer" className="truncate text-brand-red underline-offset-2 hover:underline">
                              {quote.attachmentFileName}
                            </a>
                          ) : (
                            <span className="truncate">{quote.attachmentFileName}</span>
                          )}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {isL1 && <Badge variant="success">L1</Badge>}
                        {isSelected && (
                          <Badge variant="brand">
                            <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden />
                            Selected
                          </Badge>
                        )}
                      </div>
                      {canEdit && (
                        <div className="mt-2 flex gap-1.5">
                          <Button
                            size="sm"
                            variant={isSelected ? "primary" : "outline"}
                            onClick={() => onSelectVendor(line.id, isSelected ? null : quote.vendorId)}
                            disabled={busy}
                          >
                            {isSelected ? "Deselect" : "Select"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Remove ${vendor?.tradeName ?? "vendor"}'s quote`}
                            onClick={() => onRemoveQuote(line.id, quote.vendorId)}
                            disabled={busy}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                      )}
                    </td>
                  );
                })}

                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">
                  {savings !== null ? (
                    <span className={savings >= 0 ? "text-success" : "text-error"}>
                      {savings >= 0 ? "▼" : "▲"} {Math.abs(savings).toFixed(1)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink-muted">{referenceQuote ? `${rfq.taxPercent}%` : "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold text-ink">{total !== null ? formatINR(total) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-border bg-surface-muted px-4 py-2 text-xs text-ink-muted">
        All rates and amounts shown are demo/mock values for UI demonstration only — not real vendor pricing. Savings/Tax/Total are computed against the
        selected vendor once one is chosen, otherwise the lowest-landed-cost (L1) quote — rate × qty × (1+tax) plus any freight/loading/other charges on
        file, not just the lowest quoted rate. See docs/OPEN_QUESTIONS.md #87(a).
      </p>
    </div>
  );
}
