import type { VendorPastWorkEntry } from "@/types/domain/vendor";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/vendors-adapter.ts. FRONTEND IMPLEMENTATION
 * DECISION — see `src/types/domain/vendor.ts`'s header comment on
 * `VendorPastWorkEntry` and docs/OPEN_QUESTIONS.md #28. Not every vendor
 * has past work on file (`vendor_5`, `vendor_6`, `vendor_8` have none),
 * to exercise the empty state.
 *
 * Document 2 correction: every entry now carries a `status` —
 * `vpast_6` is seeded as `"in_progress"` (no `completedAt`) so the
 * Vendors & Supply Chain module's "completed vs. under progress" status
 * is exercised by real demo data, not just the form's own validation.
 */
export const mockVendorPastWork: VendorPastWorkEntry[] = [
  {
    id: "vpast_1",
    vendorId: "vendor_1",
    projectId: "proj_luxury_villa",
    description: "Civil shell & core work — Luxury Villa",
    value: 18_500_000,
    status: "completed",
    completedAt: "2026-07-30T00:00:00.000Z",
    createdAt: "2026-08-01T05:00:00.000Z",
  },
  {
    id: "vpast_2",
    vendorId: "vendor_2",
    projectId: "proj_modern_residence",
    description: "Interior fit-out and finishing — Modern Residence",
    value: 9_200_000,
    status: "completed",
    completedAt: "2026-05-15T00:00:00.000Z",
    createdAt: "2026-05-20T05:00:00.000Z",
  },
  {
    id: "vpast_3",
    vendorId: "vendor_3",
    projectId: "proj_luxury_villa",
    description: "Full electrical wiring and fixture installation — Luxury Villa",
    value: 3_400_000,
    status: "completed",
    completedAt: "2026-08-10T00:00:00.000Z",
    createdAt: "2026-08-12T05:00:00.000Z",
  },
  {
    id: "vpast_4",
    vendorId: "vendor_4",
    projectId: "proj_commercial_complex",
    description: "TMT steel supply, Phase 1 — Commercial Complex",
    value: 62_000_000,
    status: "completed",
    completedAt: "2026-04-30T00:00:00.000Z",
    createdAt: "2026-05-02T05:00:00.000Z",
  },
  {
    id: "vpast_5",
    vendorId: "vendor_4",
    description: "TMT steel supply — third-party residential project (pre-BrickBasket)",
    value: 21_000_000,
    status: "completed",
    completedAt: "2025-11-20T00:00:00.000Z",
    createdAt: "2026-05-02T05:00:00.000Z",
  },
  {
    id: "vpast_6",
    vendorId: "vendor_7",
    projectId: "proj_commercial_complex",
    description: "Tower crane hire, 6 months — Commercial Complex",
    value: 4_800_000,
    status: "in_progress",
    createdAt: "2026-06-28T05:00:00.000Z",
  },
  {
    // vendor_9 added alongside the Riverside Apartments mock project.
    id: "vpast_7",
    vendorId: "vendor_9",
    projectId: "proj_riverside_apartments",
    description: "TMT steel supply, Block B Phase 1 — Riverside Apartments",
    value: 1_430_000,
    status: "completed",
    completedAt: "2026-09-02T00:00:00.000Z",
    createdAt: "2026-09-03T05:00:00.000Z",
  },
  {
    // vendor_10's only BrickBasket PO (po_7) was rejected, so this is
    // pre-BrickBasket past work — same pattern as vpast_5 for vendor_4.
    id: "vpast_8",
    vendorId: "vendor_10",
    description: "MEP installation — third-party hospitality project (pre-BrickBasket)",
    value: 6_200_000,
    status: "completed",
    completedAt: "2026-04-10T00:00:00.000Z",
    createdAt: "2026-07-25T05:00:00.000Z",
  },
  {
    // vendor_11 added alongside the Gorakhpur Business Park mock project.
    id: "vpast_9",
    vendorId: "vendor_11",
    projectId: "proj_gorakhpur_business_park",
    description: "TMT steel supply, office tower core — Gorakhpur Business Park",
    value: 2_050_000,
    status: "completed",
    completedAt: "2026-09-23T00:00:00.000Z",
    createdAt: "2026-09-24T05:00:00.000Z",
  },
];
