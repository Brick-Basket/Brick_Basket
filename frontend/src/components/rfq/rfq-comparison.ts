import type { RFQVendorQuote } from "@/types/domain/rfq";

/**
 * Pure computation helpers for the RFQ comparison table — nothing here is
 * ever persisted (see `docs/DATA_MODELS.md`'s field typing conventions:
 * amounts/derived figures are always computed at render time). Mirrors
 * `src/components/vendors/vendor-rating.ts`'s role for Vendor Management.
 */

/** Quotes for one line, sorted cheapest-first — the sort order the comparison table's "Vendor 1/2/3" columns render in, so the lowest (L1) quote always lands in the first slot. */
export function sortQuotesByRate(quotes: RFQVendorQuote[]): RFQVendorQuote[] {
  return [...quotes].sort((a, b) => a.rate - b.rate);
}

/** The lowest-rate quote for a line — "L1 highlighting as a computed UI state," never stored. */
export function computeL1Quote(quotes: RFQVendorQuote[]): RFQVendorQuote | null {
  if (quotes.length === 0) return null;
  return sortQuotesByRate(quotes)[0]!;
}

/**
 * The quote a line's "% savings over ACE," "Tax" and "Total" columns are
 * computed against: the purchaser's selected vendor once one is chosen,
 * falling back to L1 (the lowest quote) before a selection is made — a
 * **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #30.
 */
export function pickReferenceQuote(quotes: RFQVendorQuote[], selectedVendorId: string | null): RFQVendorQuote | null {
  if (selectedVendorId) {
    const selected = quotes.find((q) => q.vendorId === selectedVendorId);
    if (selected) return selected;
  }
  return computeL1Quote(quotes);
}

/** `null` when there's no ACE baseline for this line (an "additional" item) or no quotes yet. */
export function computeSavingsPercent(aceRate: number | null, referenceRate: number | null): number | null {
  if (aceRate === null || aceRate === 0 || referenceRate === null) return null;
  return ((aceRate - referenceRate) / aceRate) * 100;
}

export function computeAmount(rate: number, quantity: number): number {
  return rate * quantity;
}

/** Reference amount + the RFQ's applicable tax rate. `null` until at least one vendor has quoted this line. */
export function computeLineTotal(referenceRate: number | null, quantity: number, taxPercent: number): number | null {
  if (referenceRate === null) return null;
  const amount = computeAmount(referenceRate, quantity);
  return amount + amount * (taxPercent / 100);
}
