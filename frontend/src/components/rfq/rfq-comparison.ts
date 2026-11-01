import type { RFQVendorQuote } from "@/types/domain/rfq";

/**
 * Pure computation helpers for the RFQ comparison table — nothing here is
 * ever persisted (see `docs/DATA_MODELS.md`'s field typing conventions:
 * amounts/derived figures are always computed at render time). Mirrors
 * `src/components/vendors/vendor-rating.ts`'s role for Vendor Management.
 */

/**
 * Quotes for one line, sorted cheapest-by-quoted-rate-first. Kept as a
 * plain, context-free sort (no quantity/tax/charges needed) — still useful
 * anywhere only the raw quoted rate matters. **Not what the comparison
 * table uses for L1 any more** — see `sortQuotesByLandedCost` below and
 * `docs/OPEN_QUESTIONS.md` #87(a).
 */
export function sortQuotesByRate(quotes: RFQVendorQuote[]): RFQVendorQuote[] {
  return [...quotes].sort((a, b) => a.rate - b.rate);
}

/** The lowest-quoted-rate quote for a line. Superseded by `computeL1QuoteByLandedCost` for the comparison table's actual L1 badge — see that function. */
export function computeL1Quote(quotes: RFQVendorQuote[]): RFQVendorQuote | null {
  if (quotes.length === 0) return null;
  return sortQuotesByRate(quotes)[0]!;
}

/**
 * Landed cost for one line's quote — what it would actually cost to get
 * this line's quantity from this vendor, delivered, not just the quoted
 * rate. `(rate × quantity) × (1 + tax%) + freight + loading + other
 * charges` — tax applies to the base value only, matching the convention
 * in the owner-supplied reference workbook this was modeled on
 * (`docs/OPEN_QUESTIONS.md` #87(a): `Landed Cost = Base Value × (1+Tax%) +
 * Freight + Loading + Other`). `freight`/`loadingCharges`/`otherCharges`
 * default to 0 when unset, so a quote that never uses the new fields has
 * `landedCost` exactly equal to the tax-inclusive total this app already
 * computed before this change — this is a strict, non-breaking extension.
 */
export function computeLandedCost(quote: RFQVendorQuote, quantity: number, taxPercent: number): number {
  const base = computeAmount(quote.rate, quantity);
  const taxed = base * (1 + taxPercent / 100);
  return taxed + (quote.freight ?? 0) + (quote.loadingCharges ?? 0) + (quote.otherCharges ?? 0);
}

/**
 * Quotes for one line, sorted cheapest-landed-cost-first — the sort order
 * the comparison table's "Vendor 1/2/3" columns actually render in. L1 is
 * decided on landed cost, not raw quoted rate, so a lower base rate with
 * high freight can correctly lose L1 to a slightly higher rate with
 * cheaper delivery — see `docs/OPEN_QUESTIONS.md` #87(a).
 */
export function sortQuotesByLandedCost(quotes: RFQVendorQuote[], quantity: number, taxPercent: number): RFQVendorQuote[] {
  return [...quotes].sort((a, b) => computeLandedCost(a, quantity, taxPercent) - computeLandedCost(b, quantity, taxPercent));
}

/** The lowest-landed-cost quote for a line — "L1 highlighting as a computed UI state," now landed-cost-based. Never stored. */
export function computeL1QuoteByLandedCost(quotes: RFQVendorQuote[], quantity: number, taxPercent: number): RFQVendorQuote | null {
  if (quotes.length === 0) return null;
  return sortQuotesByLandedCost(quotes, quantity, taxPercent)[0]!;
}

/**
 * The quote a line's "% savings over ACE," "Tax" and "Total" columns are
 * computed against: the purchaser's selected vendor once one is chosen,
 * falling back to L1 (now the lowest-*landed-cost* quote, not just lowest
 * rate — see `computeL1QuoteByLandedCost`) before a selection is made — a
 * **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #30
 * and #87(a).
 */
export function pickReferenceQuote(quotes: RFQVendorQuote[], selectedVendorId: string | null, quantity: number, taxPercent: number): RFQVendorQuote | null {
  if (selectedVendorId) {
    const selected = quotes.find((q) => q.vendorId === selectedVendorId);
    if (selected) return selected;
  }
  return computeL1QuoteByLandedCost(quotes, quantity, taxPercent);
}

/** `null` when there's no ACE baseline for this line (an "additional" item) or no quotes yet. */
export function computeSavingsPercent(aceRate: number | null, referenceRate: number | null): number | null {
  if (aceRate === null || aceRate === 0 || referenceRate === null) return null;
  return ((aceRate - referenceRate) / aceRate) * 100;
}

export function computeAmount(rate: number, quantity: number): number {
  return rate * quantity;
}

/**
 * Reference amount + the RFQ's applicable tax rate, excluding any
 * freight/loading/other charges. `null` until at least one vendor has
 * quoted this line. The comparison table's "Total" column now shows
 * `computeLandedCost` instead (the same figure plus the reference quote's
 * own charges, when set) — this function is kept for any caller that
 * specifically wants the tax-inclusive total without landed-cost charges.
 */
export function computeLineTotal(referenceRate: number | null, quantity: number, taxPercent: number): number | null {
  if (referenceRate === null) return null;
  const amount = computeAmount(referenceRate, quantity);
  return amount + amount * (taxPercent / 100);
}
