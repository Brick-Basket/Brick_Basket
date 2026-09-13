import type { VendorPastWorkEntry } from "@/types/domain/vendor";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/vendors-adapter.ts. FRONTEND IMPLEMENTATION
 * DECISION — see `src/types/domain/vendor.ts`'s header comment on
 * `VendorPastWorkEntry` and docs/OPEN_QUESTIONS.md #28. Not every vendor
 * has past work on file (`vendor_5`, `vendor_6`, `vendor_8` have none),
 * to exercise the empty state.
 */
export const mockVendorPastWork: VendorPastWorkEntry[] = [
  {
    id: "vpast_1",
    vendorId: "vendor_1",
    projectId: "proj_luxury_villa",
    description: "Civil shell & core work — Luxury Villa",
    value: 18_500_000,
    completedAt: "2026-07-30T00:00:00.000Z",
    createdAt: "2026-08-01T05:00:00.000Z",
  },
  {
    id: "vpast_2",
    vendorId: "vendor_2",
    projectId: "proj_modern_residence",
    description: "Interior fit-out and finishing — Modern Residence",
    value: 9_200_000,
    completedAt: "2026-05-15T00:00:00.000Z",
    createdAt: "2026-05-20T05:00:00.000Z",
  },
  {
    id: "vpast_3",
    vendorId: "vendor_3",
    projectId: "proj_luxury_villa",
    description: "Full electrical wiring and fixture installation — Luxury Villa",
    value: 3_400_000,
    completedAt: "2026-08-10T00:00:00.000Z",
    createdAt: "2026-08-12T05:00:00.000Z",
  },
  {
    id: "vpast_4",
    vendorId: "vendor_4",
    projectId: "proj_commercial_complex",
    description: "TMT steel supply, Phase 1 — Commercial Complex",
    value: 62_000_000,
    completedAt: "2026-04-30T00:00:00.000Z",
    createdAt: "2026-05-02T05:00:00.000Z",
  },
  {
    id: "vpast_5",
    vendorId: "vendor_4",
    description: "TMT steel supply — third-party residential project (pre-BrickBasket)",
    value: 21_000_000,
    completedAt: "2025-11-20T00:00:00.000Z",
    createdAt: "2026-05-02T05:00:00.000Z",
  },
  {
    id: "vpast_6",
    vendorId: "vendor_7",
    projectId: "proj_commercial_complex",
    description: "Tower crane hire, 6 months — Commercial Complex",
    value: 4_800_000,
    completedAt: "2026-06-25T00:00:00.000Z",
    createdAt: "2026-06-28T05:00:00.000Z",
  },
];
