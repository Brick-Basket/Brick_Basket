import type { MRC, MRCLineItem } from "@/types/domain/mrc";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/mrc-adapter.ts. All four records are issued to
 * `u_customer` (the only demo login with a customer persona — see
 * src/lib/auth/mock-users.ts) so signing in to `/dashboard/mrc` exercises
 * the full list, including one of each status.
 *
 * `mrc_1`/`mrc_3` use `proj_luxury_villa` (the only mock project with a
 * matching `customerId`) with hand-typed ("manual") lines. `mrc_2`/`mrc_4`
 * demonstrate the `source: "grn"` path by certifying real received lines
 * from Part 11's `grn_1`/`grn_2` (against `proj_modern_residence`, which
 * has no `customerId` of its own — see mrc.ts's header comment on why
 * `customerId` is independent of the project's).
 */
export const mockMRCs: MRC[] = [
  {
    id: "mrc_1",
    mrcNumber: "BB-MRC-2026-001",
    customerId: "u_customer",
    projectId: "proj_luxury_villa",
    status: "accepted",
    notes: "Materials certified for the ground-floor interiors package.",
    issuedAt: "2026-08-02T07:00:00.000Z",
    respondedAt: "2026-08-04T10:15:00.000Z",
    declineReason: null,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-04T10:15:00.000Z",
  },
  {
    id: "mrc_2",
    mrcNumber: "BB-MRC-2026-002",
    customerId: "u_customer",
    projectId: "proj_modern_residence",
    status: "issued",
    notes: "Certifying the first GRN delivery — paint and sanitaryware.",
    issuedAt: "2026-08-10T06:30:00.000Z",
    respondedAt: null,
    declineReason: null,
    createdAt: "2026-08-09T08:00:00.000Z",
    updatedAt: "2026-08-10T06:30:00.000Z",
  },
  {
    id: "mrc_3",
    mrcNumber: "BB-MRC-2026-003",
    customerId: "u_customer",
    projectId: "proj_luxury_villa",
    status: "declined",
    notes: "Flooring and fixtures for the first-floor bathrooms.",
    issuedAt: "2026-08-12T05:00:00.000Z",
    respondedAt: "2026-08-13T11:40:00.000Z",
    declineReason: "Please add the warranty certificate number for the vitrified tiles before we sign off.",
    createdAt: "2026-08-11T09:30:00.000Z",
    updatedAt: "2026-08-13T11:40:00.000Z",
  },
  {
    id: "mrc_4",
    mrcNumber: "BB-MRC-2026-004",
    customerId: "u_customer",
    projectId: "proj_modern_residence",
    status: "draft",
    notes: "Draft — balance sanitaryware delivery plus a manually logged accessory.",
    issuedAt: null,
    respondedAt: null,
    declineReason: null,
    createdAt: "2026-08-23T07:00:00.000Z",
    updatedAt: "2026-08-23T07:00:00.000Z",
  },
];

export const mockMRCLineItems: MRCLineItem[] = [
  // mrc_1 — manual lines against proj_luxury_villa
  {
    id: "mrcli_1",
    mrcId: "mrc_1",
    source: "manual",
    description: "Modular Kitchen Cabinets",
    uom: "set",
    quantity: 1,
    make: "Godrej Interio",
    warrantyTerms: "5 years on hinges and hardware",
  },
  {
    id: "mrcli_2",
    mrcId: "mrc_1",
    source: "manual",
    description: "LED Downlights — Living & Dining",
    uom: "each",
    quantity: 24,
    make: "Philips",
    warrantyTerms: "2 years manufacturer warranty",
  },
  // mrc_2 — GRN-sourced lines certifying grn_1's receipts
  {
    id: "mrcli_3",
    mrcId: "mrc_2",
    source: "grn",
    grnLineItemId: "grnli_1",
    description: "Interior Emulsion Paint",
    uom: "litre",
    quantity: 180,
    make: "Asian Paints",
    warrantyTerms: undefined,
  },
  {
    id: "mrcli_4",
    mrcId: "mrc_2",
    source: "grn",
    grnLineItemId: "grnli_2",
    description: "Sanitaryware — Wall-mounted WC Set",
    uom: "each",
    quantity: 2,
    make: "Cera",
    warrantyTerms: "Certificate CERA-WC-2026-014",
  },
  // mrc_3 — manual lines against proj_luxury_villa
  {
    id: "mrcli_5",
    mrcId: "mrc_3",
    source: "manual",
    description: "Vitrified Floor Tiles — Master Bathroom",
    uom: "sq.ft",
    quantity: 140,
    make: "Kajaria",
    warrantyTerms: undefined,
  },
  // mrc_4 — draft, mixed sources
  {
    id: "mrcli_6",
    mrcId: "mrc_4",
    source: "grn",
    grnLineItemId: "grnli_3",
    description: "Sanitaryware — Wall-mounted WC Set",
    uom: "each",
    quantity: 2,
    make: "Cera",
    warrantyTerms: "Certificate CERA-WC-2026-015",
  },
  {
    id: "mrcli_7",
    mrcId: "mrc_4",
    source: "manual",
    description: "Concealed Cistern Frames",
    uom: "each",
    quantity: 2,
    make: "Grohe",
    warrantyTerms: undefined,
  },
];
