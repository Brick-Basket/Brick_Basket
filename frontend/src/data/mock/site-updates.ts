import type { SiteUpdate } from "@/types/domain/site-update";

/**
 * Mock/demo only — see `site-update.ts`'s header comment for why this
 * module exists and what it deliberately leaves out (no geolocation).
 * Seeded mostly against `proj_luxury_villa` (customerId: "u_customer" in
 * `mock/projects.ts`) so signing in as the demo customer shows a real,
 * populated feed rather than an empty state. Every seeded record has
 * metadata-only media (no real file bytes) — same "no file on record"
 * convention as `mock/documents.ts` — so the gallery always shows its
 * placeholder state for these, matching what a real reload would look
 * like once the mock in-memory object URLs from an upload are gone.
 */
export const mockSiteUpdates: SiteUpdate[] = [
  {
    id: "supd_001",
    projectId: "proj_luxury_villa",
    updateDate: "2026-09-26",
    remarks:
      "Plastering completed on the east and north elevations. Scaffolding relocated to the west side for tomorrow's crew.",
    media: [
      { id: "supdm_001a", type: "photo", fileName: "east-elevation-plaster.jpg", fileType: "image/jpeg", fileSizeBytes: 3_150_000, caption: "East elevation, finished plaster" },
      { id: "supdm_001b", type: "photo", fileName: "north-elevation-plaster.jpg", fileType: "image/jpeg", fileSizeBytes: 2_870_000, caption: "North elevation" },
    ],
    relatedWorkItem: "Superstructure — Plastering",
    postedBy: "u_site_engineer",
    postedByName: "Ramesh Yadav",
    visibleToCustomer: true,
    createdAt: "2026-09-26T17:40:00.000Z",
    updatedAt: "2026-09-26T17:40:00.000Z",
  },
  {
    id: "supd_002",
    projectId: "proj_luxury_villa",
    updateDate: "2026-09-24",
    remarks:
      "Electrical conduit laying in progress on the first floor. A short walkthrough video of the wiring layout for the master bedroom wing is attached.",
    media: [
      { id: "supdm_002a", type: "video", fileName: "first-floor-conduit-walkthrough.mp4", fileType: "video/mp4", fileSizeBytes: 18_400_000, caption: "First floor conduit walkthrough" },
      { id: "supdm_002b", type: "photo", fileName: "conduit-close-up.jpg", fileType: "image/jpeg", fileSizeBytes: 2_240_000 },
    ],
    relatedWorkItem: "MEP — Electrical First Fix",
    postedBy: "u_site_engineer",
    postedByName: "Ramesh Yadav",
    visibleToCustomer: true,
    createdAt: "2026-09-24T16:05:00.000Z",
    updatedAt: "2026-09-24T16:05:00.000Z",
  },
  {
    id: "supd_003",
    projectId: "proj_luxury_villa",
    updateDate: "2026-09-20",
    remarks: "Roof slab shuttering work complete and inspected. Concrete pour scheduled for tomorrow morning.",
    media: [
      { id: "supdm_003a", type: "photo", fileName: "roof-shuttering-1.jpg", fileType: "image/jpeg", fileSizeBytes: 2_980_000 },
      { id: "supdm_003b", type: "photo", fileName: "roof-shuttering-2.jpg", fileType: "image/jpeg", fileSizeBytes: 3_310_000 },
      { id: "supdm_003c", type: "photo", fileName: "roof-shuttering-3.jpg", fileType: "image/jpeg", fileSizeBytes: 2_760_000, caption: "Ready for tomorrow's pour" },
    ],
    relatedWorkItem: "Superstructure — Roof Slab",
    postedBy: "u_project_manager",
    postedByName: "Anita Sharma",
    visibleToCustomer: true,
    createdAt: "2026-09-20T18:20:00.000Z",
    updatedAt: "2026-09-20T18:20:00.000Z",
  },
  {
    id: "supd_004",
    projectId: "proj_luxury_villa",
    updateDate: "2026-09-17",
    remarks:
      "Internal quality check for the plumbing stack pressure test — noting for the file, not yet ready to show the customer until the retest on Friday clears.",
    media: [{ id: "supdm_004a", type: "photo", fileName: "plumbing-pressure-test.jpg", fileType: "image/jpeg", fileSizeBytes: 2_105_000 }],
    relatedWorkItem: "MEP — Plumbing",
    postedBy: "u_site_engineer",
    postedByName: "Ramesh Yadav",
    visibleToCustomer: false,
    createdAt: "2026-09-17T14:10:00.000Z",
    updatedAt: "2026-09-17T14:10:00.000Z",
  },
  {
    id: "supd_005",
    projectId: "proj_luxury_villa",
    updateDate: "2026-09-12",
    remarks: "Foundation excavation reached design depth and passed the soil-bearing check. Footing layout marked out.",
    media: [
      { id: "supdm_005a", type: "photo", fileName: "excavation-complete.jpg", fileType: "image/jpeg", fileSizeBytes: 2_650_000 },
      { id: "supdm_005b", type: "video", fileName: "footing-layout-walkthrough.mp4", fileType: "video/mp4", fileSizeBytes: 21_900_000 },
    ],
    relatedWorkItem: "Foundation & Plinth",
    postedBy: "u_project_manager",
    postedByName: "Anita Sharma",
    visibleToCustomer: true,
    createdAt: "2026-09-12T15:30:00.000Z",
    updatedAt: "2026-09-12T15:30:00.000Z",
  },
  {
    id: "supd_006",
    projectId: "proj_modern_residence",
    updateDate: "2026-09-25",
    remarks: "Brickwork for the boundary wall complete on all four sides.",
    media: [{ id: "supdm_006a", type: "photo", fileName: "boundary-wall-brickwork.jpg", fileType: "image/jpeg", fileSizeBytes: 2_430_000 }],
    relatedWorkItem: "Boundary Wall",
    postedBy: "u_site_engineer",
    postedByName: "Ramesh Yadav",
    visibleToCustomer: true,
    createdAt: "2026-09-25T12:00:00.000Z",
    updatedAt: "2026-09-25T12:00:00.000Z",
  },
];
