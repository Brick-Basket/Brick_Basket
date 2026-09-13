# Route Map

All routes exist as real files from Part 1 onward (placeholder page + correct layout + permission guard), then get real content in their owning part.

## Public site — `(public)` group, no auth

| Route | Purpose | Part |
|---|---|---|
| `/` | Home | 2 |
| `/about` | About Us | 2 |
| `/services` | Services | 2 |
| `/plans` | Construction packages (only if confirmed pricing info exists) | 2 |
| `/portfolio` | Projects/Portfolio | 2 |
| `/how-it-works` | Process explainer | 2 |
| `/why-us` | Why BrickBasket / Quality & Trust | 2 |
| `/faq` | FAQ | 2 |
| `/contact` | Contact / Enquiry (lead capture → feeds Lead Management) | 2 |
| `/login` | Portal entry | 3 |

## Customer portal — `(portal)/dashboard`, auth required, role `customer`

| Route | Purpose | Part |
|---|---|---|
| `/dashboard` | Portal home / summary | 3 |
| `/dashboard/projects` | Customer's project(s) | 3 |
| `/dashboard/contracts` | My Contracts — list | 5 |
| `/dashboard/contracts/[id]` | Contract detail — review/accept/decline | 5 |
| `/dashboard/documents` | Drawings, certificates, warranty docs | 6 |
| `/dashboard/mrc` | Material Receipt Certificates — list, drafts filtered out | 12 |
| `/dashboard/mrc/[id]` | MRC detail — review/accept/decline | 12 |
| `/dashboard/payments` | Payment status/history (read) | 16 |
| `/dashboard/notifications` | Notifications | 3 |
| `/dashboard/profile` | Profile | 3 |

## Internal operations app — `(internal)/admin`, auth required, staff roles

| Route | Purpose | Part |
|---|---|---|
| `/admin` | Ops dashboard | 3 |
| `/admin/leads` | Lead Management | 4 |
| `/admin/contracts` | Contract Management — list | 5 |
| `/admin/contracts/new` | Create contract | 5 |
| `/admin/contracts/[id]` | Contract detail | 5 |
| `/admin/contracts/[id]/edit` | Edit contract (draft/declined only) | 5 |
| `/admin/documents` | Drawing & Document Management (admin side) | 6 |
| `/admin/vendors` | Vendor Management | 7 |
| `/admin/supply-chain/ace` | Accepted Cost Estimate — list + create/edit dialog (permission-gated) | 8 |
| `/admin/supply-chain/requisitions` | Purchase/Material Requisition — list | 8 |
| `/admin/supply-chain/requisitions/new` | Create requisition | 8 |
| `/admin/supply-chain/requisitions/[id]` | Requisition detail — submit/approve/reject | 8 |
| `/admin/supply-chain/requisitions/[id]/edit` | Edit requisition (draft/rejected only) | 8 |
| `/admin/supply-chain/rfqs` | RFQ Management — list | 9 |
| `/admin/supply-chain/rfqs/new` | Create an RFQ from an approved requisition | 9 |
| `/admin/supply-chain/rfqs/[id]` | RFQ detail — quote comparison + L1 + vendor selection + finalize | 9 |
| `/admin/purchase-orders` | Purchase Orders — list | 10 |
| `/admin/purchase-orders/new` | Create a PO from a finalized RFQ's vendor group | 10 |
| `/admin/purchase-orders/[id]` | PO detail — terms/tax edit, two-level approval, release, issue | 10 |
| `/admin/stores/grn` | Goods Receipt Note — list | 11 |
| `/admin/stores/grn/new` | Record a GRN against an issued Purchase Order | 11 |
| `/admin/stores/grn/[id]` | GRN detail — inline edit of received quantities/brand/warranty | 11 |
| `/admin/stores/stock` | Stock statement — list + create/edit dialog | 11 |
| `/admin/stores/wastage` | Wastage — Detail/Summary toggle + create/edit dialog | 11 |
| `/admin/stores/mrc` | Material Receipt Certificates — list | 12 |
| `/admin/stores/mrc/new` | Create an MRC, certifying GRN-received or manually-entered materials | 12 |
| `/admin/stores/mrc/[id]` | MRC detail — issue/withdraw, mirrored in `/dashboard/mrc` | 12 |
| `/admin/stores/mrc/[id]/edit` | Edit MRC (draft/declined only) | 12 |
| `/admin/stores/requisitions` | Material Requisitions (MR, §6B) — list + create dialog | stabilization pass (Phase 2) |
| `/admin/stores/requisitions/[id]` | MR detail — inline edit (draft/rejected), submit/approve/reject/issue | stabilization pass (Phase 2) |
| `/admin/project-management/schedule` | Schedule + tracking | 13 |
| `/admin/project-management/dpr` | Daily Progress Reports — list, filterable across all projects | 14 |
| `/admin/project-management/dpr/new` | Create a DPR — manpower + work-item entry, optional Schedule-activity links | 14 |
| `/admin/project-management/dpr/[id]` | DPR detail — manpower/work-item tables, computed previous/cumulative/% complete | 14 |
| `/admin/project-management/dpr/[id]/edit` | Edit DPR (project fixed after creation) | 14 |
| `/admin/finance/project-cost` | Project Cost Accounting | 15 |
| `/admin/finance/payments` | Payments & Receipts | 16 |
| `/admin/finance/bank-cash` | Bank & Cash Management | 16 |
| `/admin/finance/taxes` | Taxes & Statutory | 17 |
| `/admin/finance/fixed-assets` | Fixed Assets | 17 |
| `/admin/finance/gstr` | GSTR Financial Reporting | 17 |
| `/admin/finance/cost-to-complete` | Cost-to-Complete | 18 |
| `/admin/cost-management` | Placeholder — pending Pushkar Tiwari Excel spec | 18 |

Route constants are centralized in `src/lib/constants/routes.ts` — no component hardcodes a path string.

## SEO — sitemap and robots (BrickBasket final hardening pass)

`src/app/sitemap.ts` lists exactly the public marketing pages above (everything under the "Public site" table except `/login`, which is crawlable but has no content of its own worth ranking). `src/app/robots.ts` disallows `/admin` and `/dashboard` (both sit behind client-side `AuthGuard` and have nothing a search engine visitor could use) and allows everything else. See each file's own header comment for the full reasoning, including why `/login` is a deliberate crawlable-but-not-listed middle case rather than an oversight either way.

## Route resilience — error/not-found/loading boundaries (BrickBasket final hardening pass)

`src/app/error.tsx` + `not-found.tsx` + `loading.tsx` are the root-level App Router boundaries; `(internal)/admin/error.tsx` + `loading.tsx` and `(portal)/dashboard/error.tsx` + `loading.tsx` are the same boundaries scoped to each protected shell, so a crash inside one admin or portal page doesn't take that shell's own layout/sidebar down with it. All reuse this app's existing `ErrorState`/`PageLoadingSkeleton` components rather than introducing new styling. No `not-found.tsx` was added under `admin`/`dashboard` specifically — the root one already covers any unmatched path, and neither shell has a distinct 404 experience worth duplicating it for.
