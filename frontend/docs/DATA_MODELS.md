# Data Model Inventory

One TypeScript interface per entity in `src/types/domain/`, one file per entity. Each entity's file-level JSDoc records: purpose, required/optional fields, relationships (by ID), status field + allowed values (or "TBD"), source module, dependent modules, backend ownership, frontend usage. This file is the index; full field-level detail is written module-by-module as each part ships (see `docs/PART_PROMPTS.md`) so field lists are never invented ahead of the screens that need them.

## Entities (owner-specified, minimum set)

`Lead`, `Contract`, `ContractLineItem`, `Customer`, `Project`, `Document`, `Vendor`, `VendorAssessment`, `ACEItem`, `MaterialRequirement` (Purchase/Material Requisition line), `PurchaseRequisition`, `RFQ`, `RFQVendorQuote`, `PurchaseOrder`, `Approval`, `GRN`, `StockEntry`, `WastageEntry`, `MRC`, `ProjectSchedule`, `ScheduleProgress`, `DPR`, `ManpowerEntry`, `WorkItem`, `CostEntry`, `Invoice`, `Payment`, `BankTransaction`, `TaxRecord`, `FixedAsset`, `GSTRRecord`, `CostToComplete`.

## Relationship spine (IDs only, never denormalized duplication)

```
Lead ──▶ Customer ──▶ Contract ──▶ ContractLineItem, ContractAuditEntry
Customer ──▶ Project ──▶ Contract
Project ──▶ Document ──▶ DocumentVersion
Vendor ──▶ VendorAssessment, VendorPastWorkEntry (past work optionally ──▶ Project)
Project ──▶ Vendors(via PO), ACE, Requisitions, RFQs, POs, GRN, MR, Stock, MRC,
            Schedule, DPR, CostEntry, Payments
Vendor ──▶ RFQVendorQuote, PurchaseOrder, GRN, Invoice, Payment, VendorAssessment
Project ──▶ ACEItem (predefined rate list, Part 8)
PurchaseRequisition ──▶ MaterialRequirement[] (each optionally ──▶ ACEItem, when source="predefined"),
                        RequisitionAuditEntry[]
PurchaseRequisition ──▶ RFQ ──▶ RFQLine[] (one per requisition line, snapshotting its ACE rate) ──▶ RFQVendorQuote[] (≤3 per line)
RFQ(finalized) ──▶ PurchaseOrder[] (one per distinct selected vendor among its lines) ──▶ PurchaseOrderLineItem[] (one per claimed RFQLine),
                    Approval[] (one per approval-level decision), PurchaseOrderAuditEntry[]
PurchaseOrder(issued) ──▶ GRN[] (one or more receipts against it) ──▶ GRNLineItem[] (one per received PurchaseOrderLineItem)
Project ──▶ StockEntry[] (daily, per material — manually maintained, not auto-linked to GRN, see OPEN_QUESTIONS.md #32)
Project ──▶ WastageEntry[] (per material)
DPR ──▶ ScheduleProgress ──▶ ProjectSchedule
MRC ──▶ Customer (acceptance)
Invoice / Payment ──▶ CostEntry ──▶ CostToComplete
GRN(purchase) ──▶ GSTRRecord(type="purchase")
Contract(accepted) ──▶ GSTRRecord(type="sales") (or a manual saleDescription, no Contract)
TaxRecord, FixedAsset — flat ledgers, optionally scoped to Project (FixedAsset also optionally to Vendor)
CostEntry ──▶ CostToComplete(A, B)  ┐
ACEItem ──▶ RFQLine ──▶ PurchaseOrderLineItem ──▶ CostToComplete(orderedTotal) ┴─▶ per-category row, no record of its own
Cost Management — no model; placeholder shell only (Part 18)
```

## Field typing conventions

- Money: `number` in minor-agnostic rupee units + `currency: "INR"` const — never a formatted string.
- Dates: ISO 8601 `string`, UI formats at render time.
- Status fields: string literal unions, defined in the owning entity's type file and marked `// CONFIGURABLE — pending confirmation` wherever the owner requirements didn't name exact states (e.g. lead pipeline stages, requisition states). Confirmed states (e.g. the two-level PO approval) are typed without that caveat. If a status vocabulary ends up shared across entities, it gets centralized into `src/lib/constants/statuses.ts` at that point — not pre-built for a single entity.
- Every entity has `id: string`, `createdAt`, `updatedAt`, and a `projectId` where project-scoped.

Full per-entity field tables are added to this file as each owning part ships.

## Lead — implemented (Part 2 create, Part 4 full module)

`src/types/domain/lead.ts` · adapter: `src/lib/api/adapters/leads-adapter.ts` (`LeadsAdapter`, mock-backed) · mock data: `src/data/mock/leads.ts` (14 seed records) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | assigned by backend/adapter |
| `name` | `string` | yes | |
| `email` | `string` | yes | |
| `phone` | `string` | yes | |
| `source` | `"website" \| "social_media" \| "call_whatsapp" \| "personal_reference"` | yes | confirmed set of lead sources per owner requirements |
| `subject` | `string` | yes | |
| `message` | `string` | yes | |
| `status` | `"new" \| "contacted" \| "qualified" \| "converted" \| "lost"` | yes | **CONFIGURABLE — pending confirmation**, see `OPEN_QUESTIONS.md` #3 and `docs/STATUS_DEFINITIONS.md` |
| `assignedTo` | staff user id \| `null` | yes | added Part 4; sourced from the demo staff directory (`src/lib/auth/mock-users.ts`) today, a real Users/Staff lookup once a backend exists |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `Lead → Customer/Project` once a lead converts (Contract Management, Part 5, owns that transition — not implemented yet). `Lead.assignedTo → staff user`. Currently written by: the public Contact form (`source: "website"`, Part 2) and the admin Lead Management module's create/edit form and status-transition action (Part 4). Read/triaged by: `/admin/leads` (table + Kanban pipeline views, Part 4).

## LeadActivity — implemented (Part 4)

`src/types/domain/lead-activity.ts` · same adapter as `Lead` (`LeadsAdapter.listActivities`/`addActivity`) · mock data: `src/data/mock/lead-activities.ts`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `leadId` | `string` | yes | → `Lead.id` |
| `type` | `"note" \| "status_change"` | yes | `status_change` entries are appended automatically by the status-transition endpoint, never authored directly |
| `message` | `string` | yes | free text for `note`; an auto-generated summary for `status_change` |
| `authorId` / `authorName` | `string` | yes | backend sets from the authenticated session, never client-supplied |
| `createdAt` | ISO `string` | yes | |

Relationships: `LeadActivity → Lead` (many-to-one), `LeadActivity.authorId → staff user`. The follow-up activity log required by the Lead Management module.

## Document — implemented (Part 6)

`src/types/domain/document.ts` · adapter: `src/lib/api/adapters/documents-adapter.ts` (`DocumentsAdapter`, mock-backed) · mock data: `src/data/mock/documents.ts` (10 records, every category, mixed visibility, one multi-version document) · full contract: `docs/API_CONTRACTS.md` · category vocabulary: `docs/FILE_UPLOADS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `title` | `string` | yes | |
| `category` | `DocumentCategory` (6-value union) | yes | **owner-confirmed, NOT configurable** — see `docs/STATUS_DEFINITIONS.md` and `docs/FILE_UPLOADS.md` |
| `projectId` | `string` | yes | → `Project.id` — every document belongs to exactly one project |
| `fileName` / `fileType` / `fileSizeBytes` | `string` / `string` / `number` | yes | metadata only; no real file bytes are ever stored on this type — see `docs/FILE_UPLOADS.md` for where the (mock-only) actual bytes live |
| `version` | `number` | yes | current version number; history lives in `DocumentVersion[]`, not on this record |
| `uploadedBy` / `uploadedByName` | `string` | yes | staff user id/name at time of the current version's upload |
| `uploadedAt` / `updatedAt` | ISO `string` | yes | |
| `visibleToCustomer` | `boolean` | yes | admin-controlled; the customer portal always additionally filters to `true` |
| `warrantyItem` | `string` | no | only meaningful for the two warranty categories |
| `warrantyExpiresAt` | ISO `string` | no | only meaningful for the two warranty categories |

Relationships: `Document → Project` (many-to-one). Read/written by: `/admin/documents` (admin, full lifecycle — upload, edit visibility, upload new version, Warranty Mapping view) and `/dashboard/documents` (customer, read-only, scoped to `visibleToCustomer: true` and the project currently selected in the global `ProjectSelector` — the first module screen to consume `ProjectContext` for real data scoping, not just display; see `docs/OPEN_QUESTIONS.md` #19).

**Frontend implementation decision:** no document-level "status" field was invented beyond `version: number` — the owner requirements don't call for one, and the plain version counter plus the (owner-required) warranty fields already cover what's needed. See `docs/OPEN_QUESTIONS.md`.

## DocumentVersion — implemented (Part 6)

`src/types/domain/document.ts` · same adapter as `Document` (`DocumentsAdapter.listVersions`/`uploadNewVersion`) · mock data: `src/data/mock/document-versions.ts`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `documentId` | `string` | yes | → `Document.id` |
| `version` | `number` | yes | |
| `fileName` / `fileType` / `fileSizeBytes` | `string` / `string` / `number` | yes | a snapshot of the metadata at that version, not a live reference |
| `uploadedBy` / `uploadedByName` | `string` | yes | |
| `uploadedAt` | ISO `string` | yes | |
| `note` | `string` | no | optional free-text note captured when uploading that version |

Relationships: `DocumentVersion → Document` (many-to-one, append-only history — the same pattern `LeadActivity` and `ContractAuditEntry` use). `uploadNewVersion` archives the version being superseded into this list before bumping `Document.version` and applying the new metadata.

## Vendor — implemented (Part 7)

`src/types/domain/vendor.ts` · adapter: `src/lib/api/adapters/vendors-adapter.ts` (`VendorsAdapter`, mock-backed) · mock data: `src/data/mock/vendors.ts` (8 records covering every code series) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `vendorCode` | `string` | yes | assigned by backend/adapter at creation, from `codeSeriesCategory`'s series — never client-supplied |
| `tradeName` | `string` | yes | |
| `gstCategory` | `"registered" \| "non_registered"` | yes | owner-confirmed verbatim |
| `gstin` | `string` | conditionally | required when `gstCategory === "registered"` |
| `address` | `string` | yes | |
| `msmeUdyamNumber` | `string` | no | |
| `contactPerson` / `contactPersonDesignation` | `string` | yes | |
| `email` / `contactNumber` | `string` | yes | |
| `nature` | `"supply" \| "service" \| "service_and_supply"` | yes | owner-confirmed verbatim, 3 values |
| `codeSeriesCategory` | 6-value union (see `docs/STATUS_DEFINITIONS.md`) | yes | **FRONTEND IMPLEMENTATION DECISION** — a separate field from `nature`, immutable after creation; see `docs/OPEN_QUESTIONS.md` #27 |
| `turnover` | `number` | yes | rupees per year |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `Vendor → VendorAssessment[]`, `Vendor → VendorPastWorkEntry[]` (both one-to-many, append-only). Read/written by `/admin/vendors` (list, filtered by `nature` and `codeSeriesCategory`) and `/admin/vendors/[id]` (detail). No customer-facing surface — the owner requirements don't call for one.

## VendorAssessment — implemented (Part 7)

`src/types/domain/vendor.ts` · same adapter as `Vendor` (`VendorsAdapter.listAssessments`/`addAssessment`) · mock data: `src/data/mock/vendor-assessments.ts`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` / `vendorId` | `string` | yes | |
| `quality` / `timelineAdherence` / `futureBusinessProbability` / `presentCapacity` | `number` (0–10) | yes | owner-specified verbatim; see `src/components/vendors/vendor-rating.ts` |
| `notes` | `string` | no | |
| `assessedBy` / `assessedByName` | `string` | yes | |
| `assessedAt` | ISO `string` | yes | |

A vendor may be assessed more than once — never overwritten, always a new entry (same append-only-log pattern as `LeadActivity`/`ContractAuditEntry`/`DocumentVersion`). The required "rating summary" is computed from the full history (`computeAverageRating`/`computeCriteriaAverages`) — see `docs/OPEN_QUESTIONS.md` #28 on why "aggregate" rather than "latest" was chosen.

## VendorPastWorkEntry — implemented (Part 7)

`src/types/domain/vendor.ts` · same adapter as `Vendor` (`VendorsAdapter.listPastWork`/`addPastWork`) · mock data: `src/data/mock/vendor-past-work.ts`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` / `vendorId` | `string` | yes | |
| `projectId` | `string` | no | → `Project.id`, when the past work is linked to one of BrickBasket's own projects |
| `description` | `string` | yes | |
| `value` | `number` | yes | rupees |
| `completedAt` | ISO `string` | yes | |
| `createdAt` | ISO `string` | yes | when the entry was logged (may differ from `completedAt`) |

**Frontend implementation decision:** this entity's shape is invented — the owner requirements ask for a "past work section" without defining its fields. See `docs/OPEN_QUESTIONS.md` #28.

## Customer — implemented (Part 5, minimal slice)

`src/types/domain/customer.ts` · adapter: `src/lib/api/adapters/customers-adapter.ts` (`CustomersAdapter`, mock-backed) · mock data: `src/data/mock/customers.ts` (3 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | one demo customer (`"u_customer"`) intentionally shares its id with its login persona — see the type's header comment |
| `name` / `email` / `phone` | `string` | yes | |
| `leadId` | `string` | no | → the originating `Lead`, when this customer converted from one |
| `createdAt` | ISO `string` | yes | |

Same thin-slice treatment `Project` got in Part 3 — extended by whichever later part needs more (Documents, MRC, Finance/Payments), not redefined.

## Contract / ContractLineItem — implemented (Part 5)

`src/types/domain/contract.ts` · adapter: `src/lib/api/adapters/contracts-adapter.ts` (`ContractsAdapter`, mock-backed) · mock data: `src/data/mock/contracts.ts` (6 records, every status represented) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `contractNumber` | `string` | yes | backend-assigned display reference, e.g. `"BB-CNT-2026-014"` |
| `title` | `string` | yes | |
| `customerId` | `string` | yes | → `Customer.id` |
| `leadId` | `string` | no | → the originating `Lead`, when applicable |
| `projectId` | `string` | no | → `Project.id`, once one is assigned |
| `status` | `"draft" \| "sent_for_acceptance" \| "accepted" \| "declined"` | yes | **CONFIGURABLE — pending confirmation**, see `OPEN_QUESTIONS.md` #3 and `docs/STATUS_DEFINITIONS.md` |
| `lineItems` | `ContractLineItem[]` | yes | see below |
| `notes` | `string` | no | free-text terms shown alongside line items |
| `sentAt` / `respondedAt` | ISO `string \| null` | yes | |
| `declineReason` | `string \| null` | yes | only meaningful when `status === "declined"` |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

`ContractLineItem`: `id`, `category` (`ContractCategory` — **CONFIGURABLE**, see `docs/STATUS_DEFINITIONS.md`), `description`, `uom`, `quantity: number`, `rate: number` (rupees per `uom` unit). Line amount (`quantity × rate`) and the contract total are always computed at render time, never stored — see the field typing conventions above.

Relationships: `Lead → Customer → Contract` (wired by id, per the owner requirement). `Contract → Project` (optional). Read/written by: `/admin/contracts` (admin, full lifecycle) and `/dashboard/contracts` (customer, read + accept/decline only — drafts are never shown, see `docs/WORKFLOWS.md`).

## ContractAuditEntry — implemented (Part 5)

`src/types/domain/contract-audit.ts` · same adapter as `Contract` (`ContractsAdapter.listAuditHistory`) · mock data: `src/data/mock/contract-audit.ts`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `contractId` | `string` | yes | → `Contract.id` |
| `action` | `"created" \| "updated" \| "sent_for_acceptance" \| "withdrawn" \| "accepted" \| "declined"` | yes | |
| `message` | `string` | yes | system-generated, never freehand (unlike `LeadActivity`'s notes) |
| `actorId` / `actorName` | `string` | yes | a staff user or a `Customer` |
| `createdAt` | ISO `string` | yes | |

The acceptance/audit history required by Contract Management — every `ContractsAdapter` mutating method appends one entry.

## ACEItem — implemented (Part 8)

`src/types/domain/ace-item.ts` · adapter: `src/lib/api/adapters/ace-adapter.ts` (`ACEAdapter`, mock-backed) · mock data: `src/data/mock/ace-items.ts` (12 records across all 3 mock projects) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `projectId` | `string` | yes | → `Project.id` — the Accepted Cost Estimate is a per-project rate list |
| `category` | `ContractCategory` | yes | reuses the existing category union from `Contract` rather than defining a near-duplicate — see `docs/OPEN_QUESTIONS.md` #23 (now also applied here) |
| `itemDescription` | `string` | yes | |
| `uom` | `string` | yes | |
| `rate` | `number` | yes | rupees per `uom` unit — the "accepted cost estimate" rate a requisition/RFQ/PO is later checked against |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `ACEItem → Project` (many-to-one). `ACEItem ← MaterialRequirement` (optionally referenced when a requisition line is raised against a predefined item — the owner's explicit "Wire ACE → Requisition reference"). Read/written by `/admin/supply-chain/ace`, gated by `ace:read`/`ace:write`.

## PurchaseRequisition — implemented (Part 8)

`src/types/domain/requisition.ts` · adapter: `src/lib/api/adapters/requisitions-adapter.ts` (`RequisitionsAdapter`, mock-backed) · mock data: `src/data/mock/requisitions.ts` (6 records, all 4 statuses, both requester roles, all 3 projects) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `requisitionNumber` | `string` | yes | backend-assigned display reference |
| `projectId` | `string` | yes | → `Project.id` |
| `requestedBy` / `requestedByName` | `string` | yes | staff user id/name at creation |
| `status` | `"draft" \| "submitted" \| "approved" \| "rejected"` | yes | **CONFIGURABLE — pending confirmation**, see `docs/OPEN_QUESTIONS.md` #3 and #29 and `docs/STATUS_DEFINITIONS.md` |
| `notes` | `string` | no | |
| `submittedAt` / `decidedAt` | ISO `string \| null` | yes | |
| `rejectReason` | `string \| null` | yes | only meaningful when `status === "rejected"`; cleared when the requisition is revised back to draft |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `PurchaseRequisition → Project`, `PurchaseRequisition → MaterialRequirement[]` (one-to-many, the requisition's line items), `PurchaseRequisition → RequisitionAuditEntry[]` (one-to-many, append-only). Raised by staff with `requisitions:create` (`admin`, `project_manager`); reviewed (approve/reject) by staff with `requisitions:approve` (`admin`, `purchaser`) — a deliberately distinct capability, see `docs/ROLES_AND_PERMISSIONS.md`. Editing a rejected requisition resets it to `"draft"` (same pattern as `Contract`'s decline → edit → resend flow from Part 5) — see `docs/WORKFLOWS.md`. Read/written by `/admin/supply-chain/requisitions` and its `/new`, `/[id]`, `/[id]/edit` routes.

## MaterialRequirement — implemented (Part 8)

`src/types/domain/requisition.ts` · same adapter as `PurchaseRequisition` (`RequisitionsAdapter.listLines`, embedded in `create`/`update`) · mock data: `src/data/mock/material-requirements.ts` (12 records, mixed sources).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `requisitionId` | `string` | yes | → `PurchaseRequisition.id` |
| `source` | `"predefined" \| "additional"` | yes | **FRONTEND IMPLEMENTATION DECISION** — models the owner's "predefined item list + additional item entry" requirement as a discriminator; see `docs/OPEN_QUESTIONS.md` #29 |
| `aceItemId` | `string` | conditionally | → `ACEItem.id`, set when `source === "predefined"`; the explicit "ACE → Requisition reference" wiring |
| `description` | `string` | yes | copied from the `ACEItem` when predefined, free-typed when additional |
| `uom` | `string` | yes | copied from the `ACEItem` when predefined (disabled in the form), free-typed when additional |
| `quantity` | `number` | yes | |
| `brand` | `string` | no | |

Relationships: `MaterialRequirement → PurchaseRequisition` (many-to-one), `MaterialRequirement → ACEItem` (many-to-one, optional). No line amount/rate is stored on this entity — the requirement captures *what's needed*, not its cost; pricing is the RFQ/PO modules' job (Part 9–10).

## RequisitionAuditEntry — implemented (Part 8)

`src/types/domain/requisition-audit.ts` · same adapter as `PurchaseRequisition` (`RequisitionsAdapter.listAuditHistory`) · mock data: `src/data/mock/requisition-audit.ts` (14 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `requisitionId` | `string` | yes | → `PurchaseRequisition.id` |
| `action` | `"created" \| "updated" \| "submitted" \| "approved" \| "rejected"` | yes | |
| `message` | `string` | yes | system-generated, never freehand |
| `actorId` / `actorName` | `string` | yes | |
| `createdAt` | ISO `string` | yes | |

Same append-only-log pattern as `ContractAuditEntry`/`LeadActivity`/`DocumentVersion`/`VendorAssessment` — every `RequisitionsAdapter` mutating method appends one entry.

## RFQ — implemented (Part 9)

`src/types/domain/rfq.ts` · adapter: `src/lib/api/adapters/rfq-adapter.ts` (`RFQAdapter`, mock-backed — a rare cross-adapter dependency: `create` calls `requisitionsAdapter`/`aceAdapter`'s own methods to build lines, never their mock files directly) · mock data: `src/data/mock/rfqs.ts` (2 records — one `draft`, one `finalized`) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `rfqNumber` | `string` | yes | backend-assigned display reference |
| `requisitionId` | `string` | yes | → `PurchaseRequisition.id` — one RFQ per approved requisition, never many |
| `projectId` | `string` | yes | → `Project.id`, denormalized from the requisition at creation (never a live join) |
| `status` | `"draft" \| "finalized"` | yes | **CONFIGURABLE — pending confirmation**, see `docs/OPEN_QUESTIONS.md` #3 and #30 and `docs/STATUS_DEFINITIONS.md` |
| `taxPercent` | `number` | yes | "Tax as applicable" — one RFQ-level rate (e.g. GST %) applied to every line's computed total; a **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #30 |
| `preparedBy` / `preparedByName` | `string` | yes | the purchaser/admin who created this RFQ |
| `finalizedAt` | ISO `string \| null` | yes | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `RFQ → PurchaseRequisition` (one-to-one), `RFQ → RFQLine[]` (one-to-many). Can only be created from a requisition whose `status === "approved"` and that doesn't already have one (enforced by `RFQAdapter.create`). Read/written by `/admin/supply-chain/rfqs` and its `/new`/`/[id]` routes; the Requisition detail page also cross-links to the RFQ an approved requisition already has, or offers to create one — the explicit Requisition → RFQ wiring, extending the ACE → Requisition pattern from Part 8.

## RFQLine — implemented (Part 9)

`src/types/domain/rfq.ts` · same adapter as `RFQ` (`RFQAdapter.listLines`) · mock data: `src/data/mock/rfq-lines.ts` (5 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `rfqId` | `string` | yes | → `RFQ.id` |
| `materialRequirementId` | `string` | yes | → the source requisition line this row was pulled from |
| `description` / `uom` / `quantity` | `string` / `string` / `number` | yes | copied from the source `MaterialRequirement` at RFQ-creation time |
| `aceItemId` | `string` | conditionally | set when the source line was `"predefined"` |
| `aceRate` | `number \| null` | yes | a **snapshot** of `ACEItem.rate` at RFQ-creation time (never a live reference, same pattern as `DocumentVersion`); `null` when the source line was `"additional"` (no ACE baseline — "% savings over ACE" shows "—" for that row) |
| `selectedVendorId` | `string \| null` | yes | the "Vendor selection" required by the module — modeled **per line**, not once for the whole RFQ, since different lines can have different lowest bidders; not required to equal the computed L1 vendor. **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #30 |

Relationships: `RFQLine → RFQ` (many-to-one), `RFQLine → RFQVendorQuote[]` (one-to-many, up to 3). Amount/savings/tax/total are always computed at render time (`src/components/rfq/rfq-comparison.ts`), never stored, per the field typing conventions above.

## RFQVendorQuote — implemented (Part 9)

`src/types/domain/rfq.ts` · same adapter as `RFQ` (`RFQAdapter.listVendorQuotes`/`setVendorQuote`/`removeVendorQuote`) · mock data: `src/data/mock/rfq-vendor-quotes.ts` (12 records — two lines deliberately have only 2 of the possible 3, to exercise a partially-filled comparison row).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `rfqLineId` | `string` | yes | → `RFQLine.id` |
| `vendorId` | `string` | yes | → `Vendor.id` — displayed with `Vendor.vendorCode`, the required "vendor code reference" |
| `rate` | `number` | yes | demo/mock value only — never real vendor pricing, per the owner's explicit instruction (§5C) |
| `quotedAt` | ISO `string` | yes | |

Relationships: `RFQVendorQuote → RFQLine` (many-to-one), `RFQVendorQuote → Vendor` (many-to-one). Capped at 3 distinct vendors per line by `RFQAdapter.setVendorQuote` (`409`-equivalent error otherwise) — the owner's "Vendor 1/2/3" comparison columns. L1 (the lowest-rate quote per line) is always computed from this list, never stored (`computeL1Quote`, `src/components/rfq/rfq-comparison.ts`).

## PurchaseOrder — implemented (Part 10)

`src/types/domain/purchase-order.ts` · adapter: `src/lib/api/adapters/purchase-orders-adapter.ts` (`PurchaseOrdersAdapter`, mock-backed — a rare cross-adapter dependency, same pattern as `RFQAdapter`: `create` calls `rfqAdapter`'s own methods to validate the source RFQ and snapshot the vendor's quoted rates, never its mock files directly) · mock data: `src/data/mock/purchase-orders.ts` (4 records — `issued`, `rejected` at level 1, `pending_approval_l2`, and `draft`) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `poNumber` | `string` | yes | backend-assigned display reference |
| `rfqId` | `string` | yes | → `RFQ.id` — the finalized RFQ this PO's vendor group was created from |
| `requisitionId` | `string` | yes | → `PurchaseRequisition.id`, denormalized from the RFQ at creation (never a live join) |
| `projectId` | `string` | yes | → `Project.id`, denormalized from the RFQ at creation |
| `vendorId` | `string` | yes | → `Vendor.id` — every line item on this PO is that vendor's selected quote on the source RFQ |
| `status` | 7-value union — see `docs/STATUS_DEFINITIONS.md` | yes | **CONFIGURABLE — pending confirmation**, see `docs/OPEN_QUESTIONS.md` #3 and #31 |
| `rejectedAtLevel` | `1 \| 2 \| null` | yes | set only when `status === "rejected"` — which approval level rejected it |
| `termsAndConditions` | `string` | yes | "Generate PO with terms & conditions" — free text, editable while draft or rejected |
| `taxPercent` | `number` | yes | snapshot of the source RFQ's `taxPercent` at creation time, editable while draft or rejected |
| `preparedBy` / `preparedByName` | `string` | yes | the purchaser/admin who created this PO |
| `submittedAt` / `releasedAt` / `issuedAt` | ISO `string \| null` | yes | |
| `emailDispatchStatus` | `"not_sent" \| "sent" \| "failed"` | yes | "email dispatch status placeholder" — mocked as immediately `"sent"` on `issue()`; a real email service would update this field asynchronously. **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #31 |
| `emailDispatchedAt` | ISO `string \| null` | yes | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `PurchaseOrder → RFQ` (many-to-one — a finalized RFQ can have several POs, one per distinct selected vendor among its lines), `PurchaseOrder → PurchaseOrderLineItem[]` (one-to-many), `PurchaseOrder → Approval[]` (one-to-many), `PurchaseOrder → PurchaseOrderAuditEntry[]` (one-to-many, append-only). **One PO per distinct vendor within a finalized RFQ, never one PO per RFQ** — a **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #31. A given `RFQLine` can belong to at most one PO, enforced by `PurchaseOrdersAdapter.create`. Created from `/admin/supply-chain/rfqs/[id]`'s per-vendor-group "Create PO" link — the explicit RFQ → Purchase Order hand-off, extending the ACE → Requisition → RFQ pattern from Parts 8–9. Read/written by `/admin/purchase-orders` and its `/new`/`/[id]` routes.

## PurchaseOrderLineItem — implemented (Part 10)

`src/types/domain/purchase-order.ts` · same adapter as `PurchaseOrder` (`PurchaseOrdersAdapter.listLineItems`, embedded in `create`) · mock data: `src/data/mock/purchase-order-line-items.ts` (5 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `purchaseOrderId` | `string` | yes | → `PurchaseOrder.id` |
| `rfqLineId` | `string` | yes | → `RFQLine.id` — the comparison row this line item came from |
| `description` / `uom` / `quantity` | `string` / `string` / `number` | yes | copied from the source `RFQLine` at PO-creation time |
| `rate` | `number` | yes | a **snapshot** of that vendor's `RFQVendorQuote.rate` at PO-creation time (never a live reference, same pattern as `RFQLine.aceRate`) |

Relationships: `PurchaseOrderLineItem → PurchaseOrder` (many-to-one), `PurchaseOrderLineItem → RFQLine` (many-to-one). Amount/tax/total are always computed at render time (`rate × quantity`, plus `PurchaseOrder.taxPercent`), never stored, per the field typing conventions above.

## Approval — implemented (Part 10)

`src/types/domain/approval.ts` · same adapter as `PurchaseOrder` (`PurchaseOrdersAdapter.listApprovals`, appended by `decideLevel1`/`decideLevel2`) · mock data: `src/data/mock/approvals.ts` (4 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `purchaseOrderId` | `string` | yes | → `PurchaseOrder.id` |
| `level` | `1 \| 2` | yes | which approval level this decision was made at |
| `decision` | `"approved" \| "rejected"` | yes | |
| `decidedBy` / `decidedByName` | `string` | yes | staff user id/name — `po:approve:level1`/`po:approve:level2` respectively |
| `comment` | `string` | no | optional note, shown in `ApprovalTimeline`'s decision list regardless of approve/reject |
| `decidedAt` | ISO `string` | yes | |

Relationships: `Approval → PurchaseOrder` (many-to-one, append-only — a PO gathers at most one `Approval` per level per submission cycle, but a re-submission after rejection creates new ones). Kept as its own entity, separate from `PurchaseOrderAuditEntry`, because the owner requirements list "two-level approval" and "Audit trail" as two distinct required items. Feeds the required `ApprovalTimeline` component (`src/components/po/approval-timeline.tsx`).

## PurchaseOrderAuditEntry — implemented (Part 10)

`src/types/domain/purchase-order-audit.ts` · same adapter as `PurchaseOrder` (`PurchaseOrdersAdapter.listAuditHistory`) · mock data: `src/data/mock/purchase-order-audit.ts` (13 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `purchaseOrderId` | `string` | yes | → `PurchaseOrder.id` |
| `action` | `"created" \| "updated" \| "submitted" \| "approved_level1" \| "approved_level2" \| "rejected" \| "released" \| "issued"` | yes | |
| `message` | `string` | yes | system-generated, never freehand |
| `actorId` / `actorName` | `string` | yes | |
| `createdAt` | ISO `string` | yes | |

Same append-only-log pattern as `RequisitionAuditEntry`/`ContractAuditEntry`/`LeadActivity`/`DocumentVersion`/`VendorAssessment` — the "Audit trail" explicitly required by the Purchase Order module; every `PurchaseOrdersAdapter` mutating method appends one entry.

## GRN (Goods Receipt Note) — implemented (Part 11)

`src/types/domain/grn.ts` · adapter: `src/lib/api/adapters/grn-adapter.ts` (`GRNAdapter`, mock-backed — a rare cross-adapter dependency, same pattern as `RFQAdapter`/`PurchaseOrdersAdapter`: `create` calls `purchaseOrdersAdapter`'s own methods to confirm the source PO is issued and snapshot each claimed line, never its mock files directly) · mock data: `src/data/mock/grn.ts` (2 records — a PO received across two deliveries) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `grnNumber` | `string` | yes | backend-assigned display reference |
| `purchaseOrderId` | `string` | yes | → `PurchaseOrder.id` — the owner's "Purchase request" field; **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #32 |
| `projectId` | `string` | yes | → `Project.id`, denormalized from the PurchaseOrder at creation ("Project scope") |
| `vendorId` | `string` | yes | → `Vendor.id`, denormalized from the PurchaseOrder at creation |
| `receivedBy` / `receivedByName` | `string` | yes | the `store_personnel`/`admin` who recorded the receipt |
| `receivedAt` | ISO `string` | yes | the date goods were actually received |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `GRN → PurchaseOrder` (many-to-one — a PO may be received across more than one GRN, e.g. a split delivery), `GRN → GRNLineItem[]` (one-to-many). Can only be created against a `PurchaseOrder` whose `status === "issued"` (enforced by `GRNAdapter.create`). No status field and no approval workflow — the owner requirements ask only that a GRN "show" its fields, not that it be reviewed/approved. Read/written by `/admin/stores/grn` and its `/new`/`/[id]` routes (a dedicated route set, unlike ACE's single-dialog pattern, because a GRN's line items need more room than a modal — a **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #32).

## GRNLineItem — implemented (Part 11)

`src/types/domain/grn.ts` · same adapter as `GRN` (`GRNAdapter.listLineItems`, embedded in `create`/`update`) · mock data: `src/data/mock/grn.ts` (3 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `grnId` | `string` | yes | → `GRN.id` |
| `purchaseOrderLineItemId` | `string` | yes | → `PurchaseOrderLineItem.id` |
| `description` / `uom` / `orderedQuantity` / `rate` | — | yes | a **snapshot** of the source PO line item at GRN-creation time (never a live reference, same pattern as `PurchaseOrderLineItem.rate` itself) — "Materials ordered" and "Rate" per the owner requirements |
| `receivedQuantity` | `number` | yes | "Materials received" — may be less than, equal to, or (unenforced) more than `orderedQuantity` |
| `brand` | `string` | no | the owner-required "Brand" field |
| `warrantyCertificateNumber` | `string` | no | the owner-required "Warranty certificate" field — a free-text reference/number only, not an attached file; see `docs/OPEN_QUESTIONS.md` #32 |

Relationships: `GRNLineItem → GRN` (many-to-one), `GRNLineItem → PurchaseOrderLineItem` (many-to-one). Amount (`rate × receivedQuantity`) is always computed at render time, never stored.

## StockEntry — implemented (Part 11)

`src/types/domain/stock-entry.ts` · adapter: `src/lib/api/adapters/stock-adapter.ts` (`StockAdapter`, mock-backed) · mock data: `src/data/mock/stock-entries.ts` (8 records across 2 projects) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `projectId` | `string` | yes | → `Project.id` |
| `material` | `StockMaterial` (11-value union — see `docs/STATUS_DEFINITIONS.md`) | yes | owner-confirmed reference material list |
| `otherMaterialName` | `string` | conditionally | only meaningful when `material === "other"` |
| `uom` | `string` | yes | "Unit" |
| `date` | ISO date `string` | yes | the day this ledger row covers |
| `openingStock` / `receivedToday` / `consumedToday` | `number` | yes | |
| `supplierName` | `string` | no | free text, not a `Vendor.id` reference — **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #32 |
| `remarks` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `StockEntry → Project` (many-to-one). `closingStock` is always computed (`openingStock + receivedToday - consumedToday`) at render time, never stored, per the field typing conventions above. A manually-maintained daily ledger, not automatically populated from `GRN` receipts — see `docs/OPEN_QUESTIONS.md` #32 for why. Read/written by `/admin/stores/stock`, a single list-plus-dialog page (no dedicated `/new`/`/[id]` routes), matching `ACEItem`'s flat-record pattern rather than `GRN`'s.

## WastageEntry — implemented (Part 11)

`src/types/domain/wastage-entry.ts` · adapter: `src/lib/api/adapters/wastage-adapter.ts` (`WastageAdapter`, mock-backed) · mock data: `src/data/mock/wastage-entries.ts` (5 records) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `projectId` | `string` | yes | → `Project.id` |
| `material` | `StockMaterial` | yes | reuses `StockEntry`'s reference list rather than a separate wastage-category union |
| `otherMaterialName` | `string` | conditionally | only meaningful when `material === "other"` |
| `uom` | `string` | yes | |
| `quantity` | `number` | yes | |
| `value` | `number` | yes | rupees — "quantity and value" per the owner requirements |
| `reason` | `string` | no | |
| `recordedBy` / `recordedByName` | `string` | yes | |
| `recordedAt` | ISO `string` | yes | when the wastage was identified/logged |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `WastageEntry → Project` (many-to-one). No automatic "above scope" computation against ACE/Requisition quantities — an entry is logged whenever a person judges material to be over-scope; see `docs/OPEN_QUESTIONS.md` #12 (still open) on the scope-threshold definition itself. The required "summary" view (`WastageSummary`, grouped totals by material) is computed client-side from the full entry list, never stored. Read/written by `/admin/stores/wastage`, a single page with a Detail/Summary toggle (matching Document Management's Warranty Mapping toggle pattern from Part 6) plus a create/edit dialog.

## MRC (Material Receipt Certificate) — implemented (Part 12)

`src/types/domain/mrc.ts` · adapter: `src/lib/api/adapters/mrc-adapter.ts` (`MRCAdapter`, mock-backed — a cross-adapter dependency, same pattern as `GRNAdapter`/`PurchaseOrdersAdapter`: `create`/`update` call `grnAdapter`'s and `customersAdapter`'s own methods, never their mock files directly) · mock data: `src/data/mock/mrc.ts` (4 records, one per status) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `mrcNumber` | `string` | yes | backend-assigned display reference |
| `customerId` | `string` | yes | → `Customer.id`, chosen directly by whoever issues the MRC — decoupled from `projectId`, the same shape as `Contract.customerId`/`Contract.projectId` (Part 5); **not** derived from `Project.customerId` — **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #33 |
| `projectId` | `string` | no | → `Project.id` |
| `status` | `MRCStatus` (`draft`\|`issued`\|`accepted`\|`declined`) | yes | see `docs/STATUS_DEFINITIONS.md` |
| `notes` | `string` | no | |
| `issuedAt` / `respondedAt` | ISO `string` \| `null` | yes | |
| `declineReason` | `string` \| `null` | yes | only set when `status === "declined"` |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `MRC → Customer` (many-to-one), `MRC → Project` (many-to-one, optional), `MRC → MRCLineItem[]` (one-to-many). No dedicated audit-log entity — **FRONTEND IMPLEMENTATION DECISION**, same scope reduction already applied to `RFQ` and `GRN` (Parts 9/11), see `docs/OPEN_QUESTIONS.md` #33. Read/written by `/admin/stores/mrc` and its `/new`/`/[id]`/`/[id]/edit` routes, mirrored read-only (plus accept/decline) at `/dashboard/mrc`/`/dashboard/mrc/[id]`.

## MRCLineItem — implemented (Part 12)

`src/types/domain/mrc.ts` · same adapter as `MRC` (`MRCAdapter.listLineItems`, embedded in `create`/`update`) · mock data: `src/data/mock/mrc.ts` (7 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `mrcId` | `string` | yes | → `MRC.id` |
| `source` | `"grn"` \| `"manual"` | yes | reuses the predefined-vs-freeform discriminator pattern established by `MaterialRequirement.source` (Part 8) — see `docs/STATUS_DEFINITIONS.md` |
| `grnLineItemId` | `string` | conditionally | → `GRNLineItem.id` (Part 11), set only when `source === "grn"` |
| `description` / `uom` / `make` | `string` | yes | for `source === "grn"`, a **snapshot** of the referenced `GRNLineItem` at MRC-creation time (never a live reference); for `source === "manual"`, typed directly — "materials used" and "make" per the owner requirements |
| `quantity` | `number` | yes | for `source === "grn"`, capped at the referenced line's `receivedQuantity` (enforced by `MRCAdapter`) |
| `warrantyTerms` | `string` | no | free text (e.g. "12 months from installation" or a certificate reference) — no confirmed structured warranty model exists yet, mirroring `Document`'s similarly free-text warranty fields (Part 6) |

Relationships: `MRCLineItem → MRC` (many-to-one), `MRCLineItem → GRNLineItem` (many-to-one, optional). No amount/value field anywhere in this module — MRC certifies materials/make/warranty terms, not cost.

## ScheduleActivity — implemented (Part 13, extended Phase 3)

`src/types/domain/project-schedule.ts` · adapter: `src/lib/api/adapters/schedule-adapter.ts` (`ScheduleAdapter`, mock-backed) · mock data: `src/data/mock/schedule-activities.ts` (13 records across 2 projects) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `projectId` | `string` | yes | → `Project.id` |
| `activity` | `string` | yes | free text — activity/task name |
| `uom` | `string` | yes | |
| `quantity` | `number` | yes | planned total quantity for this activity |
| `plannedStart` / `plannedEnd` | ISO date `string` | yes | validated `plannedEnd >= plannedStart` in `ScheduleActivityForm` |
| `sequence` | `number` | yes | display/Gantt ordering; auto-assigned by the adapter when omitted on create — **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #34 |
| `monthlyPlan` | `ScheduleMonthlyPlanEntry[]` | yes (may be `[]`) | added post-Part-20 stabilization pass, Phase 3 — see below |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `ScheduleActivity → Project` (many-to-one), `ScheduleActivity → ScheduleProgressEntry[]` (one-to-many). No stored status field — `percentComplete`, `expectedPercent`, `delayDays`, and the `ScheduleProgressState` union are all computed at render time from the activity's dates/quantity plus its latest `ScheduleProgressEntry` (see `docs/STATUS_DEFINITIONS.md`), never persisted. Read/written by `/admin/project-management/schedule`, a single Gantt-chart-plus-table page (no dedicated `/new`/`/[id]` routes, and no `Pagination` control — every activity for the selected project loads at once), matching the flat-record pattern already used by `ACEItem`/`StockEntry`/`WastageEntry` rather than `GRN`/`MRC`'s.

### `ScheduleMonthlyPlanEntry` — added post-Part-20 stabilization pass (Phase 3)

Not a separate adapter-backed entity — an inline array field on `ScheduleActivity` (`{ month: string /* "YYYY-MM" */; plannedQuantity: number }[]`), the same "small, always-together sub-structure lives inline rather than behind its own adapter" treatment `DPRManpowerEntry`-style entities *don't* get but `MaterialRequirement`-on-`PurchaseRequisition` (Part 8) *does* — chosen here because a monthly plan is meaningless without its parent activity and is always read/written as a whole with it (never listed, filtered, or paginated on its own).

- An empty array (`[]`) means "not broken down by month yet" — the default and always-valid state; every pre-Phase-3 activity in the mock dataset stays in it unless explicitly retrofitted.
- Once any entry exists, the set of `month` keys must exactly match `getMonthKeysInRange(plannedStart, plannedEnd)` (`src/components/schedule/schedule-monthly-plan-math.ts`) — the same "computed from the activity's own dates, never hardcoded" convention `ScheduleGanttChart`'s month header already uses — and every entry's `plannedQuantity` must sum to exactly `quantity` (`validateMonthlyPlan`, small floating-point tolerance). Enforced both in `ScheduleActivityForm` (a live running total + inline error, submit disabled while invalid) and in `ScheduleAdapter.create`/`update` itself (re-validated server-side-equivalent, since a real backend must enforce this independently of whether the frontend form did).
- **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md`: the owner requirements ask for a "dynamic monthly planning" breakdown without confirming whether every activity must have one, whether a partial breakdown (fewer months filled than the range spans) is allowed, or whether monthly figures should themselves drive `expectedPercent`/`delayDays` instead of the existing straight-line pro-rata formula (Part 13) — this build keeps the monthly plan purely informational/display, deliberately not wiring it into the progress/delay math, since that would need a second, separately-confirmed formula.
- Displayed read-only in a new collapsible `ScheduleMonthlyPlanTable` (below the main Gantt/table on `/admin/project-management/schedule`, collapsed by default, only rendered when at least one visible activity has a non-empty plan) rather than as extra columns on `ScheduleTable` itself — kept separate so that table's existing column set and mobile card fallback are untouched by this addition.

## ScheduleProgressEntry — implemented (Part 13)

`src/types/domain/project-schedule.ts` · same adapter as `ScheduleActivity` (`ScheduleAdapter.listProgress`/`addProgress`) · mock data: `src/data/mock/schedule-progress.ts` (14 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `activityId` | `string` | yes | → `ScheduleActivity.id` |
| `recordedAt` | ISO date `string` | yes | the day this reading was taken |
| `executedQuantity` | `number` | yes | **cumulative** as-of-`recordedAt` total, not incremental — the latest entry by `recordedAt` is always "current progress"; no over-execution cap against `ScheduleActivity.quantity` — **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #34 |
| `recordedBy` / `recordedByName` | `string` | yes | |
| `remarks` | `string` | no | |
| `createdAt` | ISO `string` | yes | |

Relationships: `ScheduleProgressEntry → ScheduleActivity` (many-to-one). Append-only log, same pattern as `VendorAssessment`/`LeadActivity` — no update/delete operation exists, only `addProgress`. Read/written inline via `ScheduleProgressSheet`/`ScheduleProgressLog` from the schedule page's "Update Progress" action.

## DPR (Daily Progress Report) — implemented (Part 14)

`src/types/domain/dpr.ts` · adapter: `src/lib/api/adapters/dpr-adapter.ts` (`DPRAdapter`, mock-backed — a cross-adapter dependency, same pattern as `MRCAdapter`/`GRNAdapter`: `create`/`update` call `scheduleAdapter`'s own `get`/`listProgress`/`addProgress` methods, never its mock arrays directly) · mock data: `src/data/mock/dpr.ts` (4 records across 2 projects) · full contract: `docs/API_CONTRACTS.md`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `projectId` | `string` | yes | → `Project.id`, immutable after creation |
| `dprNumber` | `string` | yes | backend-assigned display reference, e.g. "DPR-0007" |
| `reportDate` | ISO date `string` | yes | the day this report covers |
| `preparedBy` / `preparedByName` | `string` | yes | |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `DPR → Project` (many-to-one), `DPR → DPRManpowerEntry[]` (one-to-many, exactly 8), `DPR → DPRWorkItemEntry[]` (one-to-many). No stored status field — see `docs/STATUS_DEFINITIONS.md`. No enforced "at most one DPR per project per day" uniqueness — backend-owned, matching the app's general looseness elsewhere (GRN allows more than one receipt against the same PO) — **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #35. Read/written by `/admin/project-management/dpr` and its `/new`/`/[id]`/`/[id]/edit` routes, the "dedicated route set" pattern (matching `MRC`/`GRN`) rather than Schedule's single-page pattern, since the work-item + manpower tables need more room than a dialog.

## DPRManpowerEntry — implemented (Part 14)

`src/types/domain/dpr.ts` · same adapter as `DPR` (`DPRAdapter.listManpowerEntries`, embedded in `create`/`update`) · mock data: `src/data/mock/dpr.ts` (32 records, 8 per DPR).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `dprId` | `string` | yes | → `DPR.id` |
| `category` | `DPRManpowerCategory` (fixed 8-value union — see `docs/STATUS_DEFINITIONS.md`) | yes | owner-confirmed manpower categories; every DPR carries exactly one row per category, zero-filled when unused, never a dynamic add/remove list |
| `skilled` / `unskilled` | `number` | yes | |
| `agency` | `string` | no | the labor contractor/agency supplying this category, per the owner's "Agency" column |
| `createdAt` | ISO `string` | yes | |

Relationships: `DPRManpowerEntry → DPR` (many-to-one). `total` (owner-named column) is always computed as `skilled + unskilled` at render time, never stored, per the field typing conventions above.

## DPRWorkItemEntry — implemented (Part 14)

`src/types/domain/dpr.ts` · same adapter as `DPR` (`DPRAdapter.listWorkItemLines`, embedded in `create`/`update`) · mock data: `src/data/mock/dpr.ts` (10 records).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `dprId` | `string` | yes | → `DPR.id` |
| `workItemMasterId` | `string` | yes | → `DPRWorkItemMaster.id` (static master list, not an adapter-backed entity) |
| `otherDescription` / `otherUom` | `string` | conditionally | only meaningful when `workItemMasterId` resolves to one of the four "Other ___ work" catch-all master rows — the master list leaves those rows' unit unspecified, so `otherUom` is free text instead of a disabled, master-derived UOM |
| `location` | `string` | no | |
| `plannedQty` | `number` | yes | re-entered/edited per line, not derived from a single authoritative planned figure — no owner-confirmed link exists |
| `todayQty` | `number` | yes | **incremental** — how much was executed *today*, a deliberate departure from `ScheduleProgressEntry.executedQuantity`'s cumulative-as-of-date model, because the owner's DPR table names "Today's Qty." and "Cumulative Qty." as two separate columns — **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #35 |
| `remarks` | `string` | no | |
| `scheduleActivityId` | `string` \| `null` | no | optional DPR → Schedule Tracking link (§7C); when set, submitting the line also auto-records a `ScheduleProgressEntry` on that activity — see below |
| `createdAt` | ISO `string` | yes | |

Relationships: `DPRWorkItemEntry → DPR` (many-to-one), `DPRWorkItemEntry → DPRWorkItemMaster` (many-to-one, static lookup, not a DB reference), `DPRWorkItemEntry → ScheduleActivity` (many-to-one, optional). `previousQty`/`cumulativeQty`/`percentComplete` are always computed at render time from the full history of this work item's lines across every earlier `DPR` in the same project (`src/components/dpr/dpr-work-item-math.ts`), never stored — a separate, DPR-only ledger from whatever a linked `ScheduleActivity` shows. When `scheduleActivityId` is set, the pushed figure to `ScheduleProgressEntry.executedQuantity` is `(that activity's own latest executedQuantity) + todayQty` — deliberately not this DPR's own computed cumulative — to avoid regressing pre-existing Schedule progress; a stale or cross-project link is skipped rather than failing the whole submission. **Fixed in the post-Part-20 stabilization pass (Phase 4)**: editing an already-submitted, Schedule-linked line used to append another auto-recorded entry on every save instead of correcting the earlier one; `ScheduleProgressEntry.source` + `ScheduleAdapter.upsertProgressFromSource` now find-and-replace that line's own contribution in place — see `ScheduleProgressEntry`'s entry above and `docs/OPEN_QUESTIONS.md` #35e. **Further fixed in the BrickBasket final hardening pass**: the Phase 4 fix corrected an in-place edit but still left a line's *previous* pushed entry orphaned whenever the line was deleted from the DPR, or its `scheduleActivityId`/`workItemMasterId`/`location` changed (any of which changes which activity or which stable `source.key` the contribution belongs to). `ScheduleAdapter.removeProgressBySource` (new, mirroring `upsertProgressFromSource`) now removes exactly that orphaned entry, and `DPRAdapter.update()` calls it for every old linked triple that doesn't survive into the new set before pushing the new set's entries — see `docs/API_CONTRACTS.md`'s `PATCH /api/dprs/:id` section for the full reconciliation contract and `docs/OPEN_QUESTIONS.md` #55.

## DPRWorkItemMaster — implemented (Part 14)

`src/types/domain/dpr.ts` · **not adapter-backed** — static configuration in `src/lib/constants/dpr-work-items.ts` (`DPR_WORK_ITEMS`, 77 records: Civil 23, Electrical 15, Plumbing & Sanitary 18, Finishing 21), the same treatment `StockMaterial` got in Part 11: "configurable" means centralized in one file, not a mutable database table in this build.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | `<category>_<slNo>`, e.g. `civil_13` |
| `category` | `DPRWorkCategory` (4-value union) | yes | Civil / Electrical / Plumbing & Sanitary / Finishing |
| `slNo` | `number` | yes | the owner list's own item number within its category |
| `description` | `string` | yes | |
| `uom` | `string` | yes | empty string for the four "Other ___ work" catch-all rows |
| `isOtherCatchAll` | `boolean` | yes | true only for the one catch-all row per category |

No relationships table entry (not adapter-backed); referenced by id from `DPRWorkItemEntry.workItemMasterId`.

## CostEntry — implemented (Part 15)

`src/types/domain/cost-entry.ts`. A flat, per-project, per-category budget-vs-actual record — no status/workflow, the same shape as `ACEItem`/`StockEntry`. `category` reuses `ContractCategory` (Part 5) rather than a new near-duplicate union — the third module to share it after `Contract`/`ACEItem`, closing the loop `docs/OPEN_QUESTIONS.md` #23 anticipated.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `projectId` | `string` | yes | immutable after creation |
| `category` | `ContractCategory` (8-value union, shared with `Contract`/`ACEItem`) | yes | immutable after creation |
| `budgetAmount` | `number` | yes | rupees |
| `actualAmount` | `number` | yes | rupees — manually entered, **FRONTEND IMPLEMENTATION DECISION** (not yet aggregated from Payments/Receipts — Part 16 doesn't exist yet); see `docs/OPEN_QUESTIONS.md` #36 |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO datetime string | yes | |

Variance (`budgetAmount − actualAmount`) and the over/under/on-budget status are always computed at render time (`src/components/cost/cost-math.ts`), never stored — the same "computed, not stored" convention as every derived money total elsewhere in this app. Relationships: `projectId` → `Project`; `category` shared with `Contract.lineItems[].category` and `ACEItem.category`; the Cost Accounting summary view also cross-links a project's accepted `Contract`s for an illustrative contract-value/expected-profit figure (not a stored relationship on `CostEntry` itself).

## Invoice — implemented (Part 16)

`src/types/domain/invoice.ts` · adapter: `src/lib/api/adapters/invoices-adapter.ts` (`InvoiceAdapter`, mock-backed — a cross-adapter dependency, same pattern as `GRNAdapter`: `create` calls `purchaseOrdersAdapter.get`, never its mock array directly) · mock data: `src/data/mock/invoices.ts` (3 records, all against the one `"issued"` mock PO) · full contract: `docs/API_CONTRACTS.md`.

The owner's "PO/vendor code/invoice details/invoice amount/invoice copy/payment details" bullet (§8B) is split across two entities — this one captures what a vendor billed; `Payment` (below) captures what was actually paid, since one invoice is often settled across more than one payment. **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #37.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `purchaseOrderId` | `string` | yes | → `PurchaseOrder.id`, must be `status: "issued"` at creation; immutable after |
| `vendorId` | `string` | yes | denormalized from the PO at creation |
| `projectId` | `string` | yes | denormalized from the PO at creation |
| `invoiceNumber` | `string` | yes | |
| `invoiceDate` | ISO date `string` | yes | |
| `invoiceAmount` | `number` | yes | rupees |
| `invoiceCopyFileName` / `invoiceCopyFileSizeBytes` | `string` / `number` | no | metadata only, no real file bytes — a scaled-down version of `Document`'s file metadata treatment (Part 6); see `docs/OPEN_QUESTIONS.md` #37 |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

No stored status field — `paymentStatus` (`"unpaid"`/`"partially_paid"`/`"paid"`) is always computed at render time from the sum of `Payment` rows referencing this invoice (`src/components/payments/payment-math.ts`), never persisted. Relationships: `Invoice → PurchaseOrder` (many-to-one), `Invoice ← Payment[]` (one-to-many, `direction: "payment"` only). Read/written by the Invoices tab of `/admin/finance/payments`.

## Payment — implemented (Part 16)

`src/types/domain/payment.ts` · adapter: `src/lib/api/adapters/payments-adapter.ts` (`PaymentAdapter`, mock-backed — a cross-adapter dependency: `create` calls `invoiceAdapter.get` or `contractsAdapter.get` depending on `direction`, never their mock arrays directly) · mock data: `src/data/mock/payments.ts` (4 records — 2 vendor payments, 2 customer receipts) · full contract: `docs/API_CONTRACTS.md`.

Models both halves of "Payments **& Receipts**" as one `direction`-discriminated entity — a **FRONTEND IMPLEMENTATION DECISION**, since the owner text names only the vendor/PO side explicitly; the customer-receipt side exists because the owner separately requires a read-only `/dashboard/payments` view with something to show. See `docs/OPEN_QUESTIONS.md` #37.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `direction` | `"payment" \| "receipt"` | yes | immutable after creation — **FRONTEND IMPLEMENTATION DECISION** |
| `projectId` | `string` | yes | independently selected, immutable after creation — not derived from `invoiceId`/`contractId` since `Contract.projectId` is optional |
| `invoiceId` | `string` | conditionally | → `Invoice.id`, set only when `direction === "payment"`; immutable after creation |
| `vendorId` | `string` | conditionally | denormalized from the `Invoice` at creation |
| `contractId` | `string` | conditionally | → `Contract.id` (must be `status: "accepted"`), set only when `direction === "receipt"`; immutable after creation |
| `customerId` | `string` | conditionally | denormalized from the `Contract` at creation |
| `amount` | `number` | yes | rupees |
| `paymentDate` | ISO date `string` | yes | |
| `mode` | `PaymentMode` (5-value union — see `docs/STATUS_DEFINITIONS.md`) | yes | **FRONTEND IMPLEMENTATION DECISION** |
| `referenceNumber` | `string` | no | cheque no., UTR, transaction id, etc. |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

No stored status field. Relationships: `Payment → Invoice` (many-to-one, optional), `Payment → Contract` (many-to-one, optional). Read/written by the Payments & Receipts tab of `/admin/finance/payments`; read-only, scoped to `direction: "receipt"` and the signed-in customer's own `customerId`, at `/dashboard/payments`.

## BankTransaction — implemented (Part 16)

`src/types/domain/bank-transaction.ts` · adapter: `src/lib/api/adapters/bank-adapter.ts` (`BankTransactionAdapter`, mock-backed — `create`/`update` validate an optional `paymentId` against `paymentAdapter.get`, never its mock array directly, only when provided) · mock data: `src/data/mock/bank-transactions.ts` (3 records — 2 cross-linked to `Payment`s, 1 standalone cash entry) · full contract: `docs/API_CONTRACTS.md`.

Transcribes the owner's §8C "prepare fields for" list directly — a flat, per-entry ledger record with no workflow, matching `ACEItem`/`StockEntry`/`CostEntry`'s "flat record" pattern.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `paymentId` | `string` | no | optional cross-link → `Payment.id` — **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #37 |
| `partyOrVendorCode` | `string` | yes | "Party/vendor code" — free text, not a `Vendor.id` reference |
| `paymentAmount` | `number` | yes | "Payment amount" |
| `invoiceNumber` | `string` | yes | "Invoice number" — free text, not an `Invoice.id` reference |
| `accountNumber` | `string` | no | "Account number" — optional, a cash entry has none |
| `utrNumber` | `string` | no | "UTR number" — optional |
| `projectId` | `string` | yes | "Project name" → `Project.id` |
| `yearOfExecution` | `number` | yes | "Year of execution" |
| `state` / `city` | `string` | yes | "State" / "City" |
| `taxAmount` | `number` | yes | "Tax amount" |
| `tdsDetails` | `string` | no | "TDS details" — free text, no structured TDS model is owner-confirmed |
| `gstin` | `string` | no | "GSTIN" |
| `taxComponent` | `string` | no | "Tax component" — free text |
| `itcApplicable` | `boolean` | yes | "ITC applicability" — modeled as a boolean, **FRONTEND IMPLEMENTATION DECISION** |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

No stored status field. Relationships: `BankTransaction → Payment` (many-to-one, optional), `BankTransaction → Project` (many-to-one). Read/written by `/admin/finance/bank-cash`, a single list-plus-Dialog page, no dedicated `/new`/`/[id]` routes.

## TaxRecord — implemented (Part 17)

`src/types/domain/tax-record.ts` · adapter: `src/lib/api/adapters/tax-records-adapter.ts` (`TaxRecordsAdapter`, mock-backed, no cross-adapter dependency) · mock data: `src/data/mock/tax-records.ts` (5 records — paid/pending/overdue mixed across both `type` values) · full contract: `docs/API_CONTRACTS.md`.

The owner's §8D text ("Government taxes and statutory license fees") names the module's scope only, with no field list — modeled as a flat, fully-editable ledger record, the same no-locked-identity shape `BankTransaction` uses (Part 16), since there's no owner-confirmed identity pairing to lock. **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #38.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `type` | `"tax" \| "statutory_license_fee"` | yes | **FRONTEND IMPLEMENTATION DECISION** — invented discriminator, see `docs/STATUS_DEFINITIONS.md` |
| `name` | `string` | yes | e.g. "GST — July 2026", "Labour License Renewal" |
| `authority` | `string` | yes | free text — the government body/authority this is paid to |
| `projectId` | `string` | no | → `Project.id`; unset for an organization-wide tax/fee |
| `amount` | `number` | yes | rupees |
| `dueDate` | ISO date `string` | yes | |
| `paidDate` | ISO date `string` \| `null` | no | set once paid |
| `referenceNumber` | `string` | no | challan/receipt reference |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

No stored status field — `TaxRecordStatus` (`"paid" \| "pending" \| "overdue"`) is always computed at render time from `dueDate`/`paidDate` (`src/components/finance/tax-record-math.ts`), never persisted, the same "computed, not stored" convention `Invoice.paymentStatus` established (Part 16). Relationships: `TaxRecord → Project` (many-to-one, optional). Read/written by `/admin/finance/taxes`, a single list-plus-Dialog page, no dedicated `/new`/`/[id]` routes.

## FixedAsset — implemented (Part 17)

`src/types/domain/fixed-asset.ts` · adapter: `src/lib/api/adapters/fixed-assets-adapter.ts` (`FixedAssetsAdapter`, mock-backed, no cross-adapter dependency) · mock data: `src/data/mock/fixed-assets.ts` (5 records — every category, one disposed) · full contract: `docs/API_CONTRACTS.md`.

The owner's §8E text confirms exactly one rule — "Assets under organization with individual value above ₹5,000" — everything else (category vocabulary, the disposed lifecycle) is a **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #38.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `assetName` | `string` | yes | |
| `category` | `FixedAssetCategory` (6-value union — see `docs/STATUS_DEFINITIONS.md`) | yes | invented vocabulary |
| `value` | `number` | yes | rupees — validated `> 5,000` (`FIXED_ASSET_MIN_VALUE`) in `FixedAssetForm`, the owner's one confirmed rule |
| `purchaseDate` | ISO date `string` | yes | |
| `vendorId` | `string` | no | → `Vendor.id`, when bought from a vendor already on file |
| `projectId` | `string` | no | → `Project.id`; unset for an organization-wide asset |
| `serialNumber` | `string` | no | |
| `status` | `"active" \| "disposed"` | yes | invented lifecycle, see `docs/STATUS_DEFINITIONS.md` |
| `disposedAt` | ISO date `string` \| `null` | no | set only when `status === "disposed"` |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

Relationships: `FixedAsset → Vendor` (many-to-one, optional), `FixedAsset → Project` (many-to-one, optional). Read/written by `/admin/finance/fixed-assets`, a single list-plus-Dialog page, no dedicated `/new`/`/[id]` routes.

## GSTRRecord — implemented (Part 17)

`src/types/domain/gstr-record.ts` · adapter: `src/lib/api/adapters/gstr-adapter.ts` (`GSTRAdapter`, mock-backed — a cross-adapter dependency, same pattern as `InvoiceAdapter`/`PaymentAdapter` (Part 16): `create` calls `grnAdapter.get` (for `type: "purchase"`) or `contractsAdapter.get` (for `type: "sales"`, when a `contractId` is given), never their mock files directly) · mock data: `src/data/mock/gstr-records.ts` (4 records — 2 purchase against `grn_1`/`grn_2`, 1 sales against the accepted `contract_2` — a "constructed house" sale, 1 sales with a manual `saleDescription` and no contract — a "materials" sale) · full contract: `docs/API_CONTRACTS.md`.

The owner's §8F text names two categories with real linking rules — "Purchase — purchases inclusive of taxes after stores GRN" and "Sales — all business sales including constructed house and materials, if any" — modeled as one `type`-discriminated entity rather than two, mirroring `Payment.direction`'s discriminator design (Part 16), since both categories share almost every field. **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #38.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | |
| `type` | `"purchase" \| "sales"` | yes | immutable after creation |
| `period` | `string` | yes | GST return period, `"YYYY-MM"` |
| `projectId` | `string` | no | denormalized from the source `GRN`/`Contract` when linked, chosen directly for a manual sales entry |
| `grnId` | `string` | conditionally | → `GRN.id` — **required** when `type === "purchase"` ("after stores GRN"), cross-adapter validated, immutable after creation |
| `vendorId` | `string` | conditionally | denormalized from the `GRN`'s Purchase Order at creation, when `type === "purchase"` |
| `contractId` | `string` | conditionally | → `Contract.id` (must be `status: "accepted"`) — optional when `type === "sales"`, the "constructed house" case; immutable after creation once set |
| `saleDescription` | `string` | conditionally | free text describing the sale when no `Contract` is behind it — the "materials, if any" case; immutable after creation |
| `customerId` | `string` | conditionally | denormalized from the `Contract` at creation, or chosen directly for a manual sale |
| `gstin` | `string` | no | |
| `taxableValue` | `number` | yes | rupees |
| `taxAmount` | `number` | yes | rupees |
| `invoiceReference` | `string` | no | free-text reference, not a foreign key |
| `notes` | `string` | no | |
| `createdAt` / `updatedAt` | ISO `string` | yes | |

No stored status field. Relationships: `GSTRRecord → GRN` (many-to-one, conditional), `GSTRRecord → Contract` (many-to-one, optional). Read/written by `/admin/finance/gstr`, a single route with Purchase/Sales tabs pinning `type` in the list params (the Payments/Receipts tabbed-page mechanic reused from Part 16), no dedicated `/new`/`/[id]` routes.

## CostToComplete — implemented (Part 18)

`src/types/domain/cost-to-complete.ts` · adapter: `src/lib/api/adapters/cost-to-complete-adapter.ts` (`CostToCompleteAdapter`, mock-backed — **owns no mock data file of its own**, the only entity in this app that doesn't; a four-way cross-adapter composition of `costAdapter` (Part 15), `aceAdapter` (Part 8), `purchaseOrdersAdapter` (Part 10) and `rfqAdapter` (Part 9), all called through their own public methods, never their mock arrays) · full contract: `docs/API_CONTRACTS.md`.

The owner's §8G text gives a real formula (`Actual Cost + Remaining Estimated Cost = Forecast Final Cost`), a real table shape (Cost Category / Original Estimate A / Completed till date B / Balance to complete C / Total Estimated Value D=B+C / Variance), and real derivation rules ("Original estimate derives from Supply Chain → Accepted Cost Estimate," "Completed till date derives from vendor invoices/project cost accounting," "Balance to complete includes (1) ordered but yet to be completed … (2) balance to be ordered …") — unlike Cost Management (§8H, below), this is **not** a "no invented business logic" placeholder. But `ACEItem` (Part 8) carries no quantity, only a rate, so a literal ACE-derived money total isn't computable from stored data, and `PurchaseOrderLineItem`/`Invoice` carry no `category` field directly — every specific number below is therefore a **FRONTEND IMPLEMENTATION DECISION** grounded in the owner's derivation rules but not owner-confirmed itself. See `docs/OPEN_QUESTIONS.md` #39 for the full list, and `CostToCompleteAdapter`'s own file-level comment for the step-by-step calculation.

There is no `CostToComplete` persisted record and no create/update input types — this is a pure, render-time report, one `CostToCompleteRow` per `ContractCategory` a project has data for:

| Field | Type | Notes |
|---|---|---|
| `projectId` | `string` | → `Project.id` |
| `category` | `ContractCategory` | the shared 8-value union (Contract/ACEItem/CostEntry/GSTRRecord's category-bearing siblings) |
| `originalEstimate` (A) | `number` | = that project+category's `CostEntry.budgetAmount`, 0 if none — see the adapter comment for why this substitutes for a direct ACE calculation |
| `completedToDate` (B) | `number` | = that project+category's `CostEntry.actualAmount`, 0 if none |
| `orderedTotal` | `number` | Σ `quantity × rate` of this project's non-`draft`/non-`rejected` `PurchaseOrder` line items traced to this category via `PurchaseOrder.rfqId → RFQLine.aceItemId → ACEItem.category` — shown for transparency, not one of the owner's five named columns |
| `orderedNotCompleted` | `number` | `max(0, orderedTotal − completedToDate)` — component 1 of C |
| `balanceToBeOrdered` | `number` | `max(0, originalEstimate − max(completedToDate, orderedTotal))` — component 2 of C |
| `balanceToComplete` (C) | `number` | `orderedNotCompleted + balanceToBeOrdered` |
| `totalEstimatedValue` (D) | `number` | `completedToDate + balanceToComplete`, exactly the owner's `D = B + C` |
| `variance` | `number` | `originalEstimate − totalEstimatedValue` — same sign convention as `CostEntry`'s Budget−Actual variance |

A `PurchaseOrder` line item whose source requisition line was `"additional"` (free-entry, no `ACEItem` reference) can't be traced to any category — its value is summed into `CostToCompleteSummary.unallocatedOrderedTotal` instead of a row, rather than silently dropped or force-assigned. The owner's "applies to service & composite works, not supply components" split for ordered-not-completed is **not implemented** — `ContractCategory` has no confirmed supply-vs-service/composite classification to split by.

No stored status field, no relationships table entry of its own (it reads four others). Read (never written) by `/admin/finance/cost-to-complete`, a single project-scoped report page with no "All projects" option (the Schedule/Part 13 precedent — a report mixing several projects' category budgets wouldn't read as anyone's Cost-to-Complete) and no create/edit form of any kind.

## Cost Management — placeholder shell only (Part 18)

No type, no adapter, no mock data — deliberately, per the owner's explicit §8H instruction: "detailed Cost Management requirements will come in a separate Excel sheet from Pushkar Tiwari. DO NOT invent this module's detailed business rules. Create a scalable placeholder module shell." `/admin/cost-management` renders `ModulePlaceholder` behind a `PermissionGuard` for `cost_management:view` (already existed, already held only by `admin`, Part 3) — the one change from its Part 1–17 scaffold. See `docs/OPEN_QUESTIONS.md` #4.

## AppNotification — implemented (Part 19)

`src/types/domain/notification.ts` · adapter: `src/lib/api/adapters/notifications-adapter.ts` (`NotificationsAdapter`, mock-backed — **owns no mock data file of its own**, the second entity in this app that doesn't, after `CostToComplete` (Part 18) — a composition of eight other adapters' own public methods, never their mock arrays) · full contract: `docs/API_CONTRACTS.md`.

There is no `CreateAppNotificationInput` and no persisted record — same "pure, render-time aggregate" pattern as `CostToComplete`. A notification is a live derivation of "does this already-existing record need this signed-in user's attention right now," recomputed on every `NotificationsAdapter.getForUser(user)` call. There is nothing to mark as read; a notification simply stops appearing once the underlying record no longer qualifies (a Requisition is no longer `"submitted"` once someone decides it).

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | `${category}:${entityId}[:suffix]` — stable within one computed batch, not backend-issued |
| `category` | `NotificationCategory` | `"lead" \| "requisition" \| "purchase_order" \| "grn" \| "tax" \| "schedule" \| "contract" \| "mrc"` |
| `severity` | `NotificationSeverity` | `"info" \| "warning" \| "urgent"` — drives `NotificationList`/`NotificationsMenu`'s badge tone |
| `message` | `string` | human-readable, references the record by its own number (e.g. "Requisition REQ-0004 is awaiting your approval") |
| `createdAt` | ISO `string` | the underlying record's own timestamp (`updatedAt`, `submittedAt`, `dueDate`, …) — never "now," the moment the batch was computed |
| `href` | `string` | route to the record, or — for Lead and Schedule, which have no per-record detail route — the owning list |

No relationships table entry — a notification isn't a record, it reads ten others (`Lead`, `PurchaseRequisition`, `PurchaseOrder`, `GRN`, `TaxRecord`, `ScheduleActivity`+`ScheduleProgressEntry`, `Contract`, `MRC`). See `NotificationsAdapter`'s file-level comment for the full permission → condition → message rule table, and `docs/OPEN_QUESTIONS.md` #40 for every decision this required.

## OpsMetric — implemented (Part 19)

`src/types/domain/ops-metric.ts` · adapter: `src/lib/api/adapters/ops-metrics-adapter.ts` (`OpsMetricsAdapter`, mock-backed — same no-mock-file, composed-aggregate pattern as `AppNotification`; also imports `mockProjects` directly for the one metric that loops over every project, since Projects have no adapter of their own anywhere in this app — see `docs/OPEN_QUESTIONS.md` #40).

Also a pure computed aggregate with no persisted record — one `OpsMetric` per metric card the signed-in user's permissions unlock on `/admin`.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | e.g. `"new-leads"`, `"overdue-tax-count"` — stable within one computed batch |
| `label` | `string` | the card's heading |
| `value` | `string` | pre-formatted for display — a plain count or a `formatINR` currency string |
| `href` | `string` | the list/report this metric summarizes |
| `tone` | `"neutral" \| "attention"` | drives `MetricCard`'s icon-chip tint only, never the value text's color — see `docs/OPEN_QUESTIONS.md` #40 for why |

No relationships table entry — reads nine other adapters (the same set `AppNotification` reads, plus `CostToCompleteAdapter` looped per-project for "Projects Over Original Estimate," the explicit Part 18 callback this part's build plan named). See `OpsMetricsAdapter`'s file-level comment for the full metric list.

---

## Store Material Requisition ("MR") — §6B, added post-Part-20 stabilization pass (Phase 2)

`src/types/domain/store-requisition.ts` · adapter: `src/lib/api/adapters/store-requisitions-adapter.ts` (`StoreRequisitionsAdapter`, mock-backed, no cross-adapter dependency). §6B's owner text is one sentence — *"MR — Site Project Manager. MR flows to stores for material issuance."* — and had no dedicated route anywhere in the original 20-part roadmap until now (tracked as a gap in `docs/OPEN_QUESTIONS.md` #32). **Deliberately a separate entity/adapter/route set from `PurchaseRequisition` (§5B, Part 8)** despite the similar name — see this file's own header comment for the full reasoning (buy-from-a-vendor vs. issue-from-existing-stock).

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | |
| `projectId` | `string` | immutable after creation |
| `requisitionNumber` | `string` | backend-assigned display reference, e.g. `"MR-0004"` |
| `requestedBy` / `requestedByName` | `string` | the Site Engineer/Project Manager who raised it |
| `requestDate` | `string` (ISO date) | |
| `material` | `StockMaterial` | reused from Stock Statement (Part 11) — the one place two modules' material vocabularies are *confirmed* to line up, unlike GRN↔Stock (`docs/OPEN_QUESTIONS.md` #32d) |
| `otherMaterialName` | `string?` | required when `material === "other"`, enforced via `.superRefine()` — this module got the Phase-12 conditional-required fix from the start, rather than repeating the gap Stock/Wastage originally shipped with |
| `uom` | `string` | |
| `requestedQuantity` | `number` | |
| `approvedIssuedQuantity` | `number?` | set once Stores approves/issues — may be less than requested |
| `status` | `StoreRequisitionStatus` | `draft \| submitted \| approved \| rejected \| issued` — frontend-invented vocabulary, §6B names no states; see `docs/STATUS_DEFINITIONS.md` |
| `remarks` | `string?` | the requester's own note |
| `storeRemarks` | `string?` | Stores' own note on their decision — distinct from `remarks` |
| `issueDate` | `string? (ISO date)` | set only once `status === "issued"` |
| `createdAt` / `updatedAt` | `string` | |

No dedicated audit-log entity — the same scope reduction already applied to RFQ/GRN/MRC (`docs/OPEN_QUESTIONS.md` #30/#32/#33), since §6B's text gives no "History" requirement. **Issuing a request does not auto-write a `StockEntry` row** — `approvedIssuedQuantity`/`issueDate` are this entity's own durable record of what left stock; reconciling that against `StockEntry.consumedToday` for the same day is left to Stores staff or a real backend, the same no-automatic-link gap already flagged for GRN → Stock (#32d). See `src/types/domain/store-requisition.ts`'s header comment for the full reasoning.

**BrickBasket final hardening pass — data-model gap this model doesn't cover.** This type has no field recording *who actually performed the issuance* — `requestedBy`/`requestedByName` name the requester, and `storeRemarks` is whoever decided (approve/reject), but nothing on `StoreRequisition` itself identifies the specific authenticated actor who clicked "Issue." A real backend's implementation of `POST /api/store-requisitions/:id/issue` (see `docs/API_CONTRACTS.md`'s full 8-step atomic-transaction contract for that endpoint) needs to record that actor somewhere — either add `issuedBy`/`issuedByName` fields to this entity (mirroring `requestedBy`/`requestedByName`), or capture it purely in the backend's own stock-movement/audit record if one is added. This frontend's mock `issue()` method already accepts an `actor` parameter (`StoreRequisitionsAdapter.issue(id, actor)`) but has nowhere to persist it against an in-memory record with no such field — not a bug in the mock, just evidence of the gap this note names. Not owner-confirmed either way; tracked in `docs/OPEN_QUESTIONS.md`.
