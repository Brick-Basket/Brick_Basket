import type { FixedAsset } from "@/types/domain/fixed-asset";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/fixed-assets-adapter.ts. Every value is above the
 * owner's stated ₹5,000 threshold (§8E); one record is `"disposed"` to
 * exercise that state.
 */
export const mockFixedAssets: FixedAsset[] = [
  {
    id: "asset_1",
    assetName: "Tata Ace Mini Truck",
    category: "vehicle",
    value: 650_000,
    purchaseDate: "2026-02-10",
    status: "active",
    notes: "Shared across sites for material transport.",
    createdAt: "2026-02-10T05:00:00.000Z",
    updatedAt: "2026-02-10T05:00:00.000Z",
  },
  {
    id: "asset_2",
    assetName: "Bosch Concrete Mixer GSM 750",
    category: "tools_machinery",
    value: 48_000,
    purchaseDate: "2026-03-05",
    vendorId: "vendor_1",
    projectId: "proj_modern_residence",
    serialNumber: "BSH-GSM750-22417",
    status: "active",
    createdAt: "2026-03-05T05:00:00.000Z",
    updatedAt: "2026-03-05T05:00:00.000Z",
  },
  {
    id: "asset_3",
    assetName: "Site Office Desktop Computers (Set of 4)",
    category: "it_computer",
    value: 180_000,
    purchaseDate: "2026-01-20",
    status: "active",
    createdAt: "2026-01-20T05:00:00.000Z",
    updatedAt: "2026-01-20T05:00:00.000Z",
  },
  {
    id: "asset_4",
    assetName: "Conference Room Furniture Set",
    category: "furniture",
    value: 95_000,
    purchaseDate: "2025-11-15",
    status: "active",
    createdAt: "2025-11-15T05:00:00.000Z",
    updatedAt: "2025-11-15T05:00:00.000Z",
  },
  {
    id: "asset_5",
    assetName: "Diesel Generator (5kVA)",
    category: "equipment",
    value: 62_000,
    purchaseDate: "2024-06-01",
    status: "disposed",
    disposedAt: "2026-05-10",
    notes: "Decommissioned and scrapped — replaced by a newer unit.",
    createdAt: "2024-06-01T05:00:00.000Z",
    updatedAt: "2026-05-10T06:00:00.000Z",
  },
];
