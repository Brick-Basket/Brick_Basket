# API CONTRACTS

Real, non-invented contracts, populated module-by-module as each part ships (see `docs/PART_PROMPTS.md`). Every endpoint below is what the frontend adapter (`src/lib/api/adapters/*.ts`) currently mocks and expects the backend to eventually implement identically — the mock is the executable spec. Nothing here is authoritative until the Backend Claude session builds and the two sides reconcile per `docs/BACKEND_CLAUDE_HANDOFF.md` (Part 20).

Conventions used throughout this file:
- Auth: every endpoint requires a valid session unless marked **Public**. Role/permission columns reference `docs/ROLES_AND_PERMISSIONS.md` — **the frontend's permission check is UX-layer only; the backend must independently enforce every one of these server-side.**
- Pagination: `page` (1-based), `pageSize`. Response includes `total`.
- Errors: `{ "error": { "code": string, "message": string } }`, standard HTTP status per case.
- Money/date conventions: see `docs/DATA_MODELS.md`.

---

## Lead Management (Part 2 create, Part 4 full module)

Frontend files: `src/types/domain/lead.ts`, `src/types/domain/lead-activity.ts`, `src/lib/api/adapters/leads-adapter.ts` (`LeadsAdapter` interface — the contract below mirrors its methods 1:1), `src/hooks/use-create-lead.ts` / `src/hooks/use-leads.ts`.

### `POST /api/leads` — create a lead — **Public**

Used by the public Contact form (Part 2) and by staff manually logging a lead (Part 4, `LeadForm` in `"create"` mode).

Request body:
```json
{
  "name": "Ananya Rao",
  "email": "ananya.rao@example.com",
  "phone": "+91 98765 43210",
  "source": "website",
  "subject": "Luxury villa construction enquiry",
  "message": "Looking for a full design-build package..."
}
```
`source` ∈ `"website" | "social_media" | "call_whatsapp" | "personal_reference"` (confirmed, owner-specified — not configurable).

Response `201`:
```json
{
  "id": "lead_a1b2c3d4",
  "name": "Ananya Rao",
  "email": "ananya.rao@example.com",
  "phone": "+91 98765 43210",
  "source": "website",
  "subject": "Luxury villa construction enquiry",
  "message": "Looking for a full design-build package...",
  "status": "new",
  "assignedTo": null,
  "createdAt": "2026-09-11T09:00:00.000Z",
  "updatedAt": "2026-09-11T09:00:00.000Z"
}
```
Backend responsibility: assigns `id`, `status: "new"`, `assignedTo: null`, and both timestamps — the client never supplies these. When called from the **Public** contact form this endpoint must rate-limit/CAPTCHA at the backend's discretion (not modeled on the frontend).

Errors: `400` validation (missing/invalid field).

### `GET /api/leads` — list/search/filter/sort/paginate — `leads:read`

Query params, all optional (frontend type: `LeadListParams`):

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches name / email / phone / subject, case-insensitive |
| `source` | `LeadSource` | exact match |
| `status` | `LeadStatus` | exact match |
| `assignedTo` | staff user id, or literal `"unassigned"` | |
| `sortBy` | `"createdAt" \| "updatedAt" \| "name" \| "status"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` | number | default `1` |
| `pageSize` | number | default `10`; the Kanban view requests a large `pageSize` (currently `200`) to render every pipeline column at once — the frontend does not paginate the Kanban board itself |

Response `200`:
```json
{
  "items": [ /* Lead[] — see DATA_MODELS.md */ ],
  "total": 14,
  "page": 1,
  "pageSize": 10
}
```

### `GET /api/leads/:id` — lead detail — `leads:read`

Response `200`: a single `Lead`. `404` if not found — frontend shows `ErrorState`.

### `PATCH /api/leads/:id` — update fields — `leads:write`

Request body: any subset of `{ name, email, phone, subject, message, assignedTo }` (frontend type: `UpdateLeadInput`). Notably **excludes** `status` — status changes go through the transition endpoint below so a status change is always distinguishable (and loggable) from an ordinary edit.

Response `200`: the updated `Lead`.

### `POST /api/leads/:id/status` — pipeline-status transition — `leads:write`

Request body: `{ "status": "contacted" }` (any `LeadStatus`).

Response `200`: the updated `Lead`. Backend responsibility: append a `LeadActivity` of `type: "status_change"` (the mock adapter does this synchronously in the same call — the real backend may do it as a DB trigger/side-effect, the frontend doesn't care which, only that a `GET .../activities` call afterward shows the entry).

Note: the frontend's pipeline vocabulary (`new → contacted → qualified → converted/lost`) is **CONFIGURABLE — pending confirmation**, see `docs/OPEN_QUESTIONS.md` #3 and `docs/STATUS_DEFINITIONS.md`. This endpoint should accept whatever the backend's authoritative status enum turns out to be; the frontend's `LeadStatus` union is the thing that needs updating to match, not this contract shape.

### `GET /api/leads/:id/activities` — follow-up activity log — `leads:read`

Response `200`: `LeadActivity[]`, newest first.

### `POST /api/leads/:id/activities` — add a follow-up note — `leads:write`

Request body: `{ "message": "Called to introduce the design-build process." }`. Backend responsibility: sets `type: "note"`, `authorId`/`authorName` from the authenticated session (never trust a client-supplied author).

Response `201`: the created `LeadActivity`.

Errors (all Lead endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown lead id, `422` validation.

---

## Contract Management (Part 5)

Frontend files: `src/types/domain/contract.ts`, `src/types/domain/contract-audit.ts`, `src/types/domain/customer.ts`, `src/lib/api/adapters/contracts-adapter.ts` (`ContractsAdapter` — the contract below mirrors its methods 1:1), `src/lib/api/adapters/customers-adapter.ts`, `src/hooks/use-contracts.ts` / `use-customers.ts`.

### `GET /api/contracts` — list/search/filter/sort/paginate — `contracts:read`

Query params (frontend type: `ContractListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches contract number / title, case-insensitive |
| `status` | `ContractStatus` | exact match |
| `customerId` | string | **the customer portal (`/dashboard/contracts`) always sends its own `session.user.id` here — the backend must independently scope a customer-role request to their own contracts regardless of what this param says, never trust the client value for authorization** |
| `sortBy` | `"createdAt" \| "updatedAt" \| "status" \| "title"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: Contract[], total, page, pageSize }`.

**Customer-facing responses must never include `status: "draft"` contracts** — a draft was never sent, so a customer should never be able to see it exists. The frontend also filters this client-side as a belt-and-suspenders safeguard (`/dashboard/contracts/page.tsx`), but that is not a substitute for server-side enforcement.

### `GET /api/contracts/:id` — detail — `contracts:read`

Response `200`: a single `Contract`. `404` if not found, or if a customer requests a contract that isn't theirs (never `403` — don't confirm existence of another customer's contract).

### `POST /api/contracts` — create — `contracts:write`

Request body (frontend type: `CreateContractInput`): `{ title, customerId, leadId?, projectId?, notes?, lineItems: Omit<ContractLineItem, "id">[] }`.

Response `201`: the created `Contract`, always `status: "draft"`. Backend responsibility: assigns `id`, `contractNumber` (display reference), line-item ids, and both timestamps.

### `PATCH /api/contracts/:id` — edit — `contracts:write`

Request body (frontend type: `UpdateContractInput`): any subset of `{ title, notes, lineItems }`. **Only valid while `status` is `"draft"` or `"declined"`** — reject otherwise (`409`). Editing a `"declined"` contract also resets it to `"draft"` and clears `respondedAt`/`declineReason` — see `docs/WORKFLOWS.md`.

Response `200`: the updated `Contract`.

### `POST /api/contracts/:id/send` — admin: send for acceptance — `contracts:send_for_acceptance`

No body. Valid only from `status: "draft"` (`409` otherwise). Response `200`: the updated `Contract` (`status: "sent_for_acceptance"`, `sentAt` set).

### `POST /api/contracts/:id/withdraw` — admin: recall to draft — `contracts:send_for_acceptance`

No body. Valid only from `status: "sent_for_acceptance"` (`409` otherwise). Response `200`: the updated `Contract` (`status: "draft"`, `sentAt` cleared).

### `POST /api/contracts/:id/respond` — customer: accept or decline — `contracts:accept`

Request body: `{ "decision": "accepted" | "declined", "declineReason"?: string }`. Valid only from `status: "sent_for_acceptance"` (`409` otherwise). Backend responsibility: sets `respondedAt`, and `actorId`/`actorName` on the resulting audit entry from the authenticated session — never trust a client-supplied actor.

Response `200`: the updated `Contract`.

### `GET /api/contracts/:id/audit` — acceptance/audit history — `contracts:read`

Response `200`: `ContractAuditEntry[]`, newest first. Every one of the endpoints above appends exactly one entry.

Errors (all Contract endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown/not-yours contract, `409` invalid status transition, `422` validation.

### Customer (minimal — Part 5)

`GET /api/customers` — `contracts:write` (only consumed by the admin `ContractForm`'s customer picker today). Response `200`: `Customer[]`. No create/edit endpoint yet — customers are backend-created (e.g. from a converted Lead) until a dedicated Customer module ships.

---

## Drawing & Document Management (Part 6)

Frontend files: `src/types/domain/document.ts`, `src/lib/api/adapters/documents-adapter.ts` (`DocumentsAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-documents.ts`.

### `GET /api/documents` — list/search/filter/sort/paginate — `documents:read`

Query params (frontend type: `DocumentListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches title / file name, case-insensitive |
| `category` | `DocumentCategory` | exact match |
| `projectId` | string | **the customer portal (`/dashboard/documents`) always sends the currently-selected project's id** |
| `visibleToCustomer` | boolean | **the customer portal always sends `true` here — the backend must independently enforce this for any customer-role request regardless of what this param says, never trust the client value for authorization** |
| `warrantyOnly` | boolean | restricts to the two warranty categories, backs the Warranty Mapping view |
| `sortBy` | `"uploadedAt" \| "updatedAt" \| "title" \| "category"` | default `uploadedAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10`; the Warranty Mapping view requests a large `pageSize` (currently `100`) to render its whole grid at once, same pattern as Part 4's Kanban |

Response `200`: `{ items: Document[], total, page, pageSize }`.

### `GET /api/documents/:id` — detail — `documents:read`

Response `200`: a single `Document`. `404` if not found, or if a customer requests a document that isn't visible to them / not in their project (never `403` — don't confirm existence).

### `POST /api/documents` — create (multipart upload) — `documents:write`

Request body (frontend type: `CreateDocumentInput` + the file itself): `{ title, category, projectId, visibleToCustomer, warrantyItem?, warrantyExpiresAt? }` plus the uploaded file. Backend responsibility: assigns `id`, `version: 1`, `fileName`/`fileType`/`fileSizeBytes` from the actual uploaded file (never trust client-supplied file metadata once real storage exists), `uploadedBy`/`uploadedByName` from the authenticated session, and both timestamps.

Response `201`: the created `Document`.

### `PATCH /api/documents/:id` — edit metadata/visibility — `documents:write`

Request body (frontend type: `UpdateDocumentInput`): any subset of `{ title, visibleToCustomer, warrantyItem, warrantyExpiresAt }`. Does **not** accept file replacement — that's the versions endpoint below, so a version change is always distinguishable from a metadata edit.

Response `200`: the updated `Document`.

### `POST /api/documents/:id/versions` — upload a new version (multipart) — `documents:write`

Request body (frontend type: `UploadNewVersionInput` + the file itself): `{ note? }` plus the uploaded file. Backend responsibility: archives the current version's metadata into `DocumentVersion` history, then bumps `Document.version` and applies the new file's metadata, `uploadedBy`/`uploadedByName`, and `updatedAt`.

Response `200`: the updated `Document`.

### `GET /api/documents/:id/versions` — version history — `documents:read`

Response `200`: `DocumentVersion[]`, newest first.

Errors (all Document endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown/not-visible document, `422` validation.

**Not part of this contract:** the mock adapter's `getPreviewUrl(documentId)` — a client-side, in-memory object-URL convenience with no backend equivalent. A real backend serves a document's file directly by URL (e.g. as part of the `Document`/`DocumentVersion` response, or a dedicated `/api/documents/:id/file` redirect) — see `docs/FILE_UPLOADS.md`.

Permissions (`documents:read`/`documents:write`) were already defined in Part 3 — no permission changes were needed for this part.

---

## Vendor Management (Part 7)

Frontend files: `src/types/domain/vendor.ts`, `src/lib/api/adapters/vendors-adapter.ts` (`VendorsAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-vendors.ts`.

### `GET /api/vendors` — list/search/filter/sort/paginate — `vendors:read`

Query params (frontend type: `VendorListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches trade name / vendor code / contact person, case-insensitive |
| `nature` | `VendorNature` | exact match |
| `codeSeriesCategory` | `VendorCodeSeriesCategory` | exact match |
| `gstCategory` | `VendorGSTCategory` | exact match |
| `sortBy` | `"tradeName" \| "vendorCode" \| "createdAt" \| "averageRating"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: VendorListItem[], total, page, pageSize }`, where each `VendorListItem` is a `Vendor` plus computed `averageRating: number | null` and `assessmentCount: number` — a joined/aggregate field, never persisted on `Vendor` itself; the mock computes it from the assessment history on every call, and a real backend should compute the equivalent via an aggregate query.

### `GET /api/vendors/:id` — detail — `vendors:read`

Response `200`: a single `Vendor`. `404` if not found.

### `POST /api/vendors` — create — `vendors:write`

Request body (frontend type: `CreateVendorInput`): every `Vendor` field except `id`/`vendorCode`/`createdAt`/`updatedAt`. Backend responsibility: assigns `id`, both timestamps, and — critically — `vendorCode`, computed as the next sequential number in `codeSeriesCategory`'s series (see `docs/STATUS_DEFINITIONS.md`). The frontend never generates or guesses a vendor code beyond this mock's `assignVendorCode` helper.

Response `201`: the created `Vendor`.

### `PATCH /api/vendors/:id` — edit — `vendors:write`

Request body (frontend type: `UpdateVendorInput`): any subset of `Vendor`'s fields **excluding `codeSeriesCategory`** — immutable after creation, since a vendor's code is a permanent identifier once assigned (see `docs/STATUS_DEFINITIONS.md`). The backend should reject a `codeSeriesCategory` in this request body (`400`) rather than silently ignoring it.

Response `200`: the updated `Vendor`.

### `GET /api/vendors/:id/assessments` — assessment history — `vendors:read`

Response `200`: `VendorAssessment[]`, newest first.

### `POST /api/vendors/:id/assessments` — add an assessment — `vendors:assess`

Request body (frontend type: `CreateVendorAssessmentInput`): `{ quality, timelineAdherence, futureBusinessProbability, presentCapacity, notes? }`, each score 0–10. Backend responsibility: sets `assessedBy`/`assessedByName` from the authenticated session and `assessedAt` — never trust a client-supplied assessor. Always creates a **new** entry — there is no "edit an assessment" endpoint, matching the append-only history model.

Response `201`: the created `VendorAssessment`.

### `GET /api/vendors/:id/past-work` — past work history — `vendors:read`

Response `200`: `VendorPastWorkEntry[]`, newest-completed first.

### `POST /api/vendors/:id/past-work` — add a past work entry — `vendors:write`

Request body (frontend type: `CreateVendorPastWorkInput`): `{ projectId?, description, value, completedAt }`.

Response `201`: the created `VendorPastWorkEntry`.

Errors (all Vendor endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown vendor, `422` validation.

Permissions (`vendors:read`/`vendors:write`/`vendors:assess`) were already defined in Part 3 — no permission changes were needed for this part.

---

## Accepted Cost Estimate (Part 8)

Frontend files: `src/types/domain/ace-item.ts`, `src/lib/api/adapters/ace-adapter.ts` (`ACEAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-ace.ts`.

### `GET /api/ace-items` — list/search/filter/sort/paginate — `ace:read`

Query params (frontend type: `ACEListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches item description, case-insensitive |
| `projectId` | string | the ACE list and the Requisition line-item picker both scope to one project — the picker requests a large `pageSize` (currently `200`) to populate its Select without its own pagination, same pattern as Part 4's Kanban |
| `category` | `ContractCategory` | exact match |
| `sortBy` | `"itemDescription" \| "category" \| "rate" \| "createdAt"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: ACEItem[], total, page, pageSize }`.

### `GET /api/ace-items/:id` — detail — `ace:read`

Response `200`: a single `ACEItem`. `404` if not found.

### `POST /api/ace-items` — create — `ace:write`

Request body (frontend type: `CreateACEItemInput`): `{ projectId, category, itemDescription, uom, rate, notes? }`. Backend responsibility: assigns `id` and both timestamps.

Response `201`: the created `ACEItem`.

### `PATCH /api/ace-items/:id` — edit — `ace:write`

Request body (frontend type: `UpdateACEItemInput`): any subset of `ACEItem`'s fields excluding `projectId` — an item doesn't move between projects, matching `Vendor.codeSeriesCategory`'s immutable-after-creation pattern for fields that anchor the record.

Response `200`: the updated `ACEItem`.

Errors (all ACE endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown item, `422` validation.

---

## Purchase / Material Requisition (Part 8)

Frontend files: `src/types/domain/requisition.ts`, `src/types/domain/requisition-audit.ts`, `src/lib/api/adapters/requisitions-adapter.ts` (`RequisitionsAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-requisitions.ts`.

### `GET /api/requisitions` — list/search/filter/sort/paginate — `requisitions:read`

Query params (frontend type: `RequisitionListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches requisition number, case-insensitive |
| `projectId` | string | exact match |
| `status` | `PurchaseRequisitionStatus` | exact match |
| `requestedBy` | staff user id | backs a "my requisitions" filter |
| `sortBy` | `"createdAt" \| "updatedAt" \| "status" \| "requisitionNumber"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: PurchaseRequisition[], total, page, pageSize }`.

### `GET /api/requisitions/:id` — detail — `requisitions:read`

Response `200`: a single `PurchaseRequisition`. `404` if not found.

### `GET /api/requisitions/:id/lines` — material requirement lines — `requisitions:read`

Response `200`: `MaterialRequirement[]`.

### `POST /api/requisitions` — create — `requisitions:create`

Request body (frontend type: `CreateRequisitionInput`): `{ projectId, notes?, lines: Omit<MaterialRequirement, "id" | "requisitionId">[] }`.

Response `201`: the created `PurchaseRequisition`, always `status: "draft"`. Backend responsibility: assigns `id`, `requisitionNumber` (display reference), line ids, and both timestamps.

### `PATCH /api/requisitions/:id` — edit — `requisitions:create`

Request body (frontend type: `UpdateRequisitionInput`): any subset of `{ notes, lines }`. **Only valid while `status` is `"draft"` or `"rejected"`** — reject otherwise (`409`). Editing a `"rejected"` requisition also resets it to `"draft"` and clears `decidedAt`/`rejectReason` — see `docs/WORKFLOWS.md`.

Response `200`: the updated `PurchaseRequisition`.

### `POST /api/requisitions/:id/submit` — submit for review — `requisitions:create`

No body. Valid only from `status: "draft"` (`409` otherwise). Response `200`: the updated `PurchaseRequisition` (`status: "submitted"`, `submittedAt` set).

### `POST /api/requisitions/:id/decide` — approve or reject — `requisitions:approve`

Request body: `{ "decision": "approved" | "rejected", "rejectReason"?: string }`. Valid only from `status: "submitted"` (`409` otherwise). Backend responsibility: sets `decidedAt`, and `actorId`/`actorName` on the resulting audit entry from the authenticated session — never trust a client-supplied actor.

Response `200`: the updated `PurchaseRequisition`.

### `GET /api/requisitions/:id/audit` — review/audit history — `requisitions:read`

Response `200`: `RequisitionAuditEntry[]`, newest first. Every one of the endpoints above appends exactly one entry.

Errors (all Requisition endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown requisition, `409` invalid status transition, `422` validation.

Permissions: `ace:read`/`ace:write`/`requisitions:approve` are new this part — see `docs/ROLES_AND_PERMISSIONS.md`. `requisitions:read`/`requisitions:create` were already defined in Part 3.

---

## RFQ Management (Part 9)

Frontend files: `src/types/domain/rfq.ts`, `src/lib/api/adapters/rfq-adapter.ts` (`RFQAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-rfq.ts`.

### `GET /api/rfqs` — list/search/filter/sort/paginate — `rfq:read`

Query params (frontend type: `RFQListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches RFQ number, case-insensitive |
| `projectId` | string | exact match |
| `status` | `RFQStatus` | exact match |
| `requisitionId` | string | backs the "does this requisition already have an RFQ?" check used by the Requisition detail page and the New RFQ form |
| `sortBy` | `"createdAt" \| "updatedAt" \| "status" \| "rfqNumber"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: RFQ[], total, page, pageSize }`.

### `GET /api/rfqs/:id` — detail — `rfq:read`

Response `200`: a single `RFQ`. `404` if not found.

### `GET /api/rfqs/:id/lines` — comparison rows — `rfq:read`

Response `200`: `RFQLine[]`.

### `GET /api/rfqs/:id/vendor-quotes` — every quote across this RFQ's lines — `rfq:read`

Response `200`: `RFQVendorQuote[]` — the frontend groups these by `rfqLineId` client-side to build the comparison table.

### `POST /api/rfqs` — create from an approved requisition — `rfq:compare`

Request body (frontend type: `CreateRFQInput`): `{ requisitionId, taxPercent? }` (`taxPercent` defaults to `18` when omitted — a demo GST rate, not an owner-confirmed default). Valid only when the requisition's `status === "approved"` and it doesn't already have an RFQ (`409` otherwise). Backend responsibility: assigns `id`, `rfqNumber` (display reference), both timestamps, and builds `RFQLine[]` from the requisition's `MaterialRequirement[]`, snapshotting each predefined line's `ACEItem.rate`.

Response `201`: the created `RFQ`, always `status: "draft"`.

### `PATCH /api/rfqs/:id` — edit the applicable tax rate — `rfq:compare`

Request body (frontend type: `UpdateRFQInput`): `{ taxPercent? }`. **Only valid while `status: "draft"`** — reject otherwise (`409`).

Response `200`: the updated `RFQ`.

### `PUT /api/rfqs/:id/lines/:lineId/quotes/:vendorId` — add or update a vendor's quote — `rfq:compare`

Request body: `{ "rate": number }`. Upserts — a second call for the same line+vendor updates the rate rather than creating a duplicate. **Only valid while the RFQ is `"draft"`**; rejects a new (non-upsert) call once a line already has 3 distinct vendor quotes (`409`, "maximum of 3 vendor quotes per line").

Response `200`: the created/updated `RFQVendorQuote`.

### `DELETE /api/rfqs/:id/lines/:lineId/quotes/:vendorId` — remove a vendor's quote — `rfq:compare`

**Only valid while the RFQ is `"draft"`.** Backend responsibility: if that line's `selectedVendorId` pointed at the removed vendor, clear it too.

Response `204`.

### `POST /api/rfqs/:id/lines/:lineId/select-vendor` — select (or clear) this line's vendor — `rfq:compare`

Request body: `{ "vendorId": string | null }`. Must be a vendor that has already quoted this line, or `null` to clear the selection. **Only valid while the RFQ is `"draft"`.**

Response `200`: the updated `RFQLine`.

### `POST /api/rfqs/:id/finalize` — lock the comparison in — `rfq:compare`

No body. Valid only from `status: "draft"`, and only once every line has a `selectedVendorId` set (`409` otherwise, naming which lines are missing a selection).

Response `200`: the updated `RFQ` (`status: "finalized"`, `finalizedAt` set).

Errors (all RFQ endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown RFQ/line/quote, `409` invalid state transition or the 3-vendor-per-line cap, `422` validation.

Permissions: `rfq:read`/`rfq:compare` were already defined in Part 3 and were already assigned to the right roles (`admin` and `purchaser` hold both; `project_manager` holds neither) — **no permission changes were needed for this part.**

---

## Purchase Orders (Part 10)

Frontend files: `src/types/domain/purchase-order.ts`, `src/types/domain/approval.ts`, `src/types/domain/purchase-order-audit.ts`, `src/lib/api/adapters/purchase-orders-adapter.ts` (`PurchaseOrdersAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-purchase-orders.ts`.

### `GET /api/purchase-orders` — list/search/filter/sort/paginate — `po:read`

Query params (frontend type: `PurchaseOrderListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches PO number, case-insensitive |
| `projectId` | string | exact match |
| `vendorId` | string | exact match |
| `rfqId` | string | backs the RFQ detail page's "does this vendor group already have a PO?" check per vendor group |
| `status` | `PurchaseOrderStatus` | exact match |
| `sortBy` | `"createdAt" \| "updatedAt" \| "status" \| "poNumber"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: PurchaseOrder[], total, page, pageSize }`.

### `GET /api/purchase-orders/:id` — detail — `po:read`

Response `200`: a single `PurchaseOrder`. `404` if not found.

### `GET /api/purchase-orders/:id/line-items` — line items — `po:read`

Response `200`: `PurchaseOrderLineItem[]`.

### `GET /api/purchase-orders/:id/approvals` — this PO's level-decisions — `po:read`

Response `200`: `Approval[]`, oldest first.

### `GET /api/purchase-orders/:id/audit` — history — `po:read`

Response `200`: `PurchaseOrderAuditEntry[]`, newest first. Every one of the mutating endpoints below appends exactly one entry.

### `POST /api/purchase-orders` — create from a finalized RFQ's vendor group — `po:create`

Request body (frontend type: `CreatePurchaseOrderInput`): `{ rfqId, vendorId, termsAndConditions? }`. Valid only when the RFQ's `status === "finalized"`, the vendor has at least one selected line on that RFQ, and none of that vendor's lines already belong to another PO on the same RFQ (`409` otherwise, naming which condition failed). Backend responsibility: assigns `id`, `poNumber` (display reference), both timestamps; builds `PurchaseOrderLineItem[]` from the vendor's selected `RFQLine[]`, snapshotting each one's quoted `RFQVendorQuote.rate`; copies `taxPercent` from the RFQ.

Response `201`: the created `PurchaseOrder`, always `status: "draft"`.

### `PATCH /api/purchase-orders/:id` — edit terms/tax — `po:create`

Request body (frontend type: `UpdatePurchaseOrderInput`): `{ termsAndConditions?, taxPercent? }`. **Only valid while `status: "draft"` or `"rejected"`** (`409` otherwise). Backend responsibility: if the PO was `rejected`, this call also resets `status` to `draft` and clears `rejectedAtLevel` — same revise-after-decline pattern as Contract (Part 5) and Requisition (Part 8).

Response `200`: the updated `PurchaseOrder`.

### `POST /api/purchase-orders/:id/submit` — submit for level 1 approval — `po:create`

No body. Valid only from `status: "draft"` (`409` otherwise).

Response `200`: the updated `PurchaseOrder` (`status: "pending_approval_l1"`, `submittedAt` set).

### `POST /api/purchase-orders/:id/decide-level1` — approve or reject at level 1 — `po:approve:level1`

Request body: `{ "decision": "approved" | "rejected", "comment"?: string }`. Valid only from `status: "pending_approval_l1"` (`409` otherwise). Backend responsibility: appends an `Approval` (`level: 1`) regardless of decision; on `"approved"` sets `status: "pending_approval_l2"`; on `"rejected"` sets `status: "rejected"` and `rejectedAtLevel: 1`. Never trust a client-supplied actor — `decidedBy`/`decidedByName` come from the authenticated session.

Response `200`: the updated `PurchaseOrder`.

### `POST /api/purchase-orders/:id/decide-level2` — approve or reject at level 2 — `po:approve:level2`

Request body: `{ "decision": "approved" | "rejected", "comment"?: string }`. Valid only from `status: "pending_approval_l2"` (`409` otherwise). Backend responsibility: appends an `Approval` (`level: 2`); on `"approved"` sets `status: "approved"`; on `"rejected"` sets `status: "rejected"` and `rejectedAtLevel: 2`.

Response `200`: the updated `PurchaseOrder`.

### `POST /api/purchase-orders/:id/release` — release an approved PO — `po:issue`

No body. Valid only from `status: "approved"` (`409` otherwise).

Response `200`: the updated `PurchaseOrder` (`status: "released"`, `releasedAt` set).

### `POST /api/purchase-orders/:id/issue` — issue a released PO — `po:issue`

No body. Valid only from `status: "released"` (`409` otherwise). Backend responsibility: dispatches the PO to the vendor by email and sets `emailDispatchStatus`/`emailDispatchedAt` — this frontend mocks the send as immediately `"sent"`; a real backend should update this field asynchronously as the actual send/retry/failure outcome becomes known (see `docs/OPEN_QUESTIONS.md` #31).

Response `200`: the updated `PurchaseOrder` (`status: "issued"`, `issuedAt` set).

Errors (all PO endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown PO/RFQ/line, `409` invalid state transition or an already-claimed RFQ line, `422` validation.

Permissions: `po:read`/`po:create`/`po:approve:level1`/`po:approve:level2`/`po:issue` were already defined in Part 3 and were already assigned to the right roles (`admin` holds all five; `purchaser` holds `po:read`/`po:create`/`po:issue` but no approval; `finance` holds `po:read`/`po:approve:level1` only; `approver` holds `po:read`/`po:approve:level1`/`po:approve:level2`) — **no permission changes were needed for this part.** There is no separate `po:release` permission key — Release is gated by `po:issue`, the same as Issue (a **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #31).

---

## Store Management — GRN (Part 11)

Frontend files: `src/types/domain/grn.ts`, `src/lib/api/adapters/grn-adapter.ts` (`GRNAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-grn.ts`.

### `GET /api/grn` — list/search/filter/sort/paginate — `grn:read`

Query params (frontend type: `GRNListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches GRN number, case-insensitive |
| `projectId` | string | exact match |
| `vendorId` | string | exact match |
| `purchaseOrderId` | string | backs the PO detail page's "GRNs already recorded against this PO" list |
| `sortBy` | `"createdAt" \| "updatedAt" \| "receivedAt" \| "grnNumber"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: GRN[], total, page, pageSize }`.

### `GET /api/grn/:id` — detail — `grn:read`

Response `200`: a single `GRN`. `404` if not found.

### `GET /api/grn/:id/line-items` — line items — `grn:read`

Response `200`: `GRNLineItem[]`.

### `POST /api/grn` — record a receipt against an issued Purchase Order — `grn:create`

Request body (frontend type: `CreateGRNInput`): `{ purchaseOrderId, receivedAt, notes?, lines: { purchaseOrderLineItemId, receivedQuantity, brand?, warrantyCertificateNumber? }[] }`. Valid only when the PO's `status === "issued"` (`409` otherwise). Backend responsibility: assigns `id`, `grnNumber` (display reference), both timestamps; snapshots each named line's description/UOM/ordered quantity/rate from the source `PurchaseOrderLineItem`; copies `projectId`/`vendorId` from the PO.

Response `201`: the created `GRN`. More than one GRN may be created against the same PO (split deliveries) — this endpoint does not reject a `receivedQuantity` that, summed across a line's GRNs, exceeds its ordered quantity; see `docs/OPEN_QUESTIONS.md` #32.

### `PATCH /api/grn/:id` — edit received quantities/brand/warranty/notes — `grn:create`

Request body (frontend type: `UpdateGRNInput`): any subset of `{ receivedAt, notes, lines }`, where each `lines` entry matches an existing `purchaseOrderLineItemId` on this GRN — a line can't be added via this endpoint (create a separate GRN instead). No status gate — a GRN has no lifecycle.

Response `200`: the updated `GRN`.

Errors (all GRN endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown GRN/PO/line, `409` PO not issued, `422` validation.

Permissions: `grn:read`/`grn:create` were already defined in Part 3 and were already assigned to the right roles (`store_personnel` and `admin` hold both; no other role does) — **no permission changes were needed for this part.**

## Store Management — Stock Statement (Part 11)

Frontend files: `src/types/domain/stock-entry.ts`, `src/lib/api/adapters/stock-adapter.ts` (`StockAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-stock.ts`.

### `GET /api/stock-entries` — list/search/filter/sort/paginate — `stock:read`

Query params (frontend type: `StockListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches material name (or `otherMaterialName`) / supplier, case-insensitive |
| `projectId` | string | exact match |
| `material` | `StockMaterial` | exact match |
| `dateFrom` / `dateTo` | ISO date string | inclusive range over `date` |
| `sortBy` | `"date" \| "createdAt" \| "material"` | default `date` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: StockEntry[], total, page, pageSize }`.

### `GET /api/stock-entries/:id` — detail — `stock:read`

Response `200`: a single `StockEntry`. `404` if not found.

### `POST /api/stock-entries` — create — `stock:write`

Request body (frontend type: `CreateStockEntryInput`): every `StockEntry` field except `id`/`createdAt`/`updatedAt`. Backend responsibility: assigns `id` and both timestamps.

Response `201`: the created `StockEntry`.

### `PATCH /api/stock-entries/:id` — edit — `stock:write`

Request body (frontend type: `UpdateStockEntryInput`): any subset of `StockEntry`'s fields **excluding `projectId`/`material`** — both immutable after creation, matching `ACEItem.projectId`'s convention.

Response `200`: the updated `StockEntry`.

Errors (all Stock endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown entry, `422` validation.

Permissions: `stock:read`/`stock:write` were already defined in Part 3 and were already assigned correctly (`store_personnel`/`admin` only) — **no permission changes were needed for this part.**

## Store Management — Wastage (Part 11)

Frontend files: `src/types/domain/wastage-entry.ts`, `src/lib/api/adapters/wastage-adapter.ts` (`WastageAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-wastage.ts`.

### `GET /api/wastage-entries` — list/search/filter/sort/paginate — `wastage:read`

Query params (frontend type: `WastageListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches material name (or `otherMaterialName`) / reason, case-insensitive |
| `projectId` | string | exact match |
| `material` | `StockMaterial` | exact match |
| `sortBy` | `"recordedAt" \| "createdAt" \| "value" \| "quantity"` | default `recordedAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10`; the Summary view requests a large `pageSize` (currently `200`) to aggregate the whole result client-side, same pattern as Part 4's Kanban and Part 6's Warranty Mapping |

Response `200`: `{ items: WastageEntry[], total, page, pageSize }`. There is no separate aggregate/summary endpoint — the frontend computes totals-by-material from this same list; a backend serving a large dataset should add a dedicated aggregate endpoint rather than requiring a full-list fetch (see `docs/OPEN_QUESTIONS.md` #32).

### `GET /api/wastage-entries/:id` — detail — `wastage:read`

Response `200`: a single `WastageEntry`. `404` if not found.

### `POST /api/wastage-entries` — create — `wastage:write`

Request body (frontend type: `CreateWastageEntryInput`): `{ projectId, material, otherMaterialName?, uom, quantity, value, recordedAt, reason? }`. Backend responsibility: assigns `id`, `recordedBy`/`recordedByName` from the authenticated session (never trust a client-supplied recorder), and both timestamps.

Response `201`: the created `WastageEntry`.

### `PATCH /api/wastage-entries/:id` — edit — `wastage:write`

Request body (frontend type: `UpdateWastageEntryInput`): any subset of `WastageEntry`'s fields **excluding `projectId`**.

Response `200`: the updated `WastageEntry`.

Errors (all Wastage endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown entry, `422` validation.

Permissions: `wastage:read`/`wastage:write` were already defined in Part 3 and were already assigned correctly (`store_personnel`/`admin` only) — **no permission changes were needed for this part.**

## MRC — Material Receipt Certificate (Part 12)

Frontend files: `src/types/domain/mrc.ts`, `src/lib/api/adapters/mrc-adapter.ts` (`MRCAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-mrc.ts`. Two small additive methods were also added to `GRNAdapter`/`grn-adapter.ts` for this part — see the note at the end of this section.

### `GET /api/mrc` — list/search/filter/sort/paginate — `mrc:read`

Query params (frontend type: `MRCListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches MRC number, case-insensitive |
| `status` | `MRCStatus` | exact match |
| `customerId` | string | exact match — the portal's `/dashboard/mrc` always passes the signed-in customer's own id |
| `projectId` | string | exact match |
| `sortBy` | `"createdAt" \| "updatedAt" \| "status" \| "mrcNumber"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: MRC[], total, page, pageSize }`. The customer-facing endpoint must never return a `draft` MRC — the frontend also filters this client-side as a safeguard (see `docs/WORKFLOWS.md`), but that is not a substitute for server-side enforcement.

### `GET /api/mrc/:id` — detail — `mrc:read`

Response `200`: a single `MRC`. `404` if not found.

### `GET /api/mrc/:id/line-items` — line items — `mrc:read`

Response `200`: `MRCLineItem[]`.

### `POST /api/mrc` — create — `mrc:issue`

Request body (frontend type: `CreateMRCInput`): `{ customerId, projectId?, notes?, lines: CreateMRCLineInput[] }`, where each line is `{ source: "grn", grnLineItemId, quantity, warrantyTerms? }` or `{ source: "manual", description, uom, quantity, make, warrantyTerms? }`. Always starts at `status: "draft"`. Valid only when `customerId` resolves to an existing `Customer` (`422` otherwise) and, for every `"grn"` line, `grnLineItemId` resolves to an existing `GRNLineItem` with `quantity` at or below its `receivedQuantity` (`422` otherwise). Backend responsibility: assigns `id`, `mrcNumber` (display reference), both timestamps; for each `"grn"` line, snapshots `description`/`uom`/`make` from the referenced `GRNLineItem`.

Response `201`: the created `MRC`.

### `PATCH /api/mrc/:id` — edit — `mrc:issue`

Request body (frontend type: `UpdateMRCInput`): any subset of `{ notes, lines }` — `lines`, if present, fully replaces the existing set (same re-snapshot/validation rules as create). Valid only while `status` is `draft` or `declined` (`409` otherwise). Editing a `declined` MRC resets it to `draft`, clearing `declineReason`/`respondedAt`.

Response `200`: the updated `MRC`.

### `POST /api/mrc/:id/issue` — admin/store: issue for customer acceptance — `mrc:issue`

Valid only from `status: "draft"` (`409` otherwise). Sets `status: "issued"`, `issuedAt`.

Response `200`: the updated `MRC`.

### `POST /api/mrc/:id/withdraw` — admin/store: recall to draft — `mrc:issue`

Valid only from `status: "issued"` (`409` otherwise). Sets `status: "draft"`, clears `issuedAt`.

Response `200`: the updated `MRC`.

### `POST /api/mrc/:id/respond` — customer: accept or decline — `mrc:accept`

Request body: `{ decision: "accepted" | "declined", declineReason?: string }`. Valid only from `status: "issued"` (`409` otherwise). Sets `status` to the decision, `respondedAt`, and `declineReason` (only when declining).

Response `200`: the updated `MRC`.

Errors (all MRC endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown MRC/customer/GRN line, `409` invalid status transition, `422` validation.

Permissions: `mrc:read`/`mrc:issue`/`mrc:accept` were already defined in Part 3 and were already assigned to the right roles (`admin`/`store_personnel` hold `mrc:issue`, `customer` holds `mrc:accept`) — **no permission changes were needed for this part.** A single `mrc:issue` key gates create/edit/issue/withdraw, the same reuse already applied to PO's Release/Issue split (`docs/OPEN_QUESTIONS.md` #31c) — there is no separate `mrc:create`/`mrc:withdraw` key.

No dedicated audit-log/history endpoint exists for this module — the same scope reduction already applied to RFQ (Part 9) and GRN (Part 11); see `docs/OPEN_QUESTIONS.md` #33.

**Additive change to `GET /api/grn` (Part 11's contract)** — two read-only lookups were added to support MRC's "certify a received line" picker, neither of which changes any existing GRN endpoint: `GET /api/grn/line-items/:id` (single `GRNLineItem` lookup by its own id, across every GRN — frontend method `GRNAdapter.getLineItem`) and `GET /api/grn/line-items` (every `GRNLineItem` across every GRN, flattened — frontend method `GRNAdapter.listAllLineItems`), both `grn:read`.

---

## Project Schedule + Tracking (Part 13, extended Phase 3)

Frontend files: `src/types/domain/project-schedule.ts`, `src/lib/api/adapters/schedule-adapter.ts` (`ScheduleAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-schedule.ts`.

### `GET /api/schedule-activities` — list/search/filter/sort/paginate — `schedule:read`

Query params (frontend type: `ScheduleListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches `activity`, case-insensitive |
| `projectId` | string | exact match — the admin page always passes exactly one selected project, never omitted in practice (no "All projects" option in the UI) |
| `sortBy` | `"sequence" \| "plannedStart" \| "plannedEnd" \| "activity" \| "createdAt"` | default `sequence` — **not** `createdAt`, unlike every other list endpoint in this app, so the Gantt/table default to the owner's intended construction-sequence order |
| `sortDir` | `"asc" \| "desc"` | default `asc` |
| `page` / `pageSize` | number | default `1` / `10` — the admin page itself always requests a large fixed `pageSize` (200) and renders no `Pagination` control, since the Gantt chart needs every activity for the project visible at once |

Response `200`: `{ items: ScheduleActivity[], total, page, pageSize }`.

### `GET /api/schedule-activities/:id` — detail — `schedule:read`

Response `200`: a single `ScheduleActivity`. `404` if not found.

### `POST /api/schedule-activities` — create — `schedule:write`

Request body (frontend type: `CreateScheduleActivityInput`): `{ projectId, activity, uom, quantity, plannedStart, plannedEnd, sequence?, monthlyPlan?, notes? }`. Valid only when `plannedEnd >= plannedStart` (`422` otherwise). `monthlyPlan` (`{ month: "YYYY-MM", plannedQuantity: number }[]`, added Phase 3) defaults to `[]` when omitted; once non-empty, its entries must sum to exactly `quantity` (`422` otherwise — `validateMonthlyPlan`, see `docs/DATA_MODELS.md`). Backend responsibility: assigns `id`, both timestamps, and — when `sequence` is omitted — the next integer sequence value for that `projectId` (frontend mirrors this in `MockScheduleAdapter.nextSequence`).

Response `201`: the created `ScheduleActivity`.

### `PATCH /api/schedule-activities/:id` — edit — `schedule:write`

Request body (frontend type: `UpdateScheduleActivityInput`): any subset of `{ activity, uom, quantity, plannedStart, plannedEnd, sequence, monthlyPlan, notes }` (never `projectId` — the form disables that field in edit mode). Same `plannedEnd >= plannedStart` validation as create, and the same `monthlyPlan`-sums-to-`quantity` re-validation, evaluated against whichever `quantity`/`monthlyPlan` pair results after the patch is applied (so patching just one of the two, while the other stays at its prior value, is still caught). No status gate — a `ScheduleActivity` has no lifecycle to protect, matching `GRN`'s always-editable rule (Part 11).

Response `200`: the updated `ScheduleActivity`.

### `GET /api/schedule-activities/:id/progress` — progress history — `schedule:read`

Response `200`: `ScheduleProgressEntry[]`, for that activity, newest first.

### `GET /api/schedule-activities/progress-summary` — bulk progress history — `schedule:read`

**Added post-Part-20 stabilization pass (Phase 3)**, after finding the schedule page's own `useScheduleProgressMap` hook called the single-activity endpoint above once per visible activity (`Promise.all`) — an N+1 pattern. Query params: `activityIds` (comma-separated, or repeated `activityIds=` per the backend's own convention). Response `200`: the same data every one of those individual calls would return, grouped — e.g. `{ [activityId: string]: ScheduleProgressEntry[] }` or an equivalent array-of-groups shape, backend's choice; the frontend adapter method (`listProgressForActivities`) normalizes whatever shape into a `Map<activityId, ScheduleProgressEntry[]>` either way. An id with no progress yet still gets an entry (an empty array), not an omission.

### `POST /api/schedule-activities/:id/progress` — record progress — `schedule:write`

Request body (frontend type: `CreateScheduleProgressInput`): `{ recordedAt, executedQuantity, remarks? }`. `executedQuantity` is the **cumulative** total as of `recordedAt`, not an incremental delta. Valid only when `executedQuantity >= 0` (`422` otherwise) — no upper-bound check against the activity's planned `quantity`; over-execution is accepted and left for the backend to police once the client's real policy is confirmed (`docs/OPEN_QUESTIONS.md` #34). Append-only via this endpoint — there is no update/delete endpoint for a progress entry a person types in directly. (A narrow exception exists for entries a *module* pushes on a person's behalf — see DPR's `upsertProgressFromSource`, Part 14/Phase 4, which corrects its own previously-pushed entry rather than duplicating it, and `removeProgressBySource` (BrickBasket final hardening pass), which removes a DPR-sourced entry that no longer applies once its DPR line is deleted or repointed. Both are exercised only by the DPR module internally, never exposed as separate public endpoints here — a real backend can implement the same reconciliation entirely inside its `PATCH /api/dprs/:id` handler, see that endpoint's own section below. Neither can ever touch an entry with no `source` — a manually-typed entry stays strictly append-only.) Backend responsibility: assigns `id`, `createdAt`, and `recordedBy`/`recordedByName` from the authenticated actor.

Response `201`: the created `ScheduleProgressEntry`.

Errors (all Schedule endpoints): `401` unauthenticated, `403` missing permission, `404` unknown activity, `422` validation.

Permissions: `schedule:read`/`schedule:write` were already defined in Part 3 and were already assigned to the right roles — **no permission changes were needed for this part.**

No dedicated audit-log/history endpoint beyond the progress log itself — `ScheduleProgressEntry` already serves as the append-only trail for what changed and when (mirroring `VendorAssessment`/`LeadActivity`, Parts 4/7), so no separate `ScheduleActivityAuditEntry` was added.

---

## Daily Progress Report (DPR) (Part 14)

Frontend files: `src/types/domain/dpr.ts`, `src/lib/api/adapters/dpr-adapter.ts` (`DPRAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-dpr.ts`, static master list: `src/lib/constants/dpr-work-items.ts`.

### `GET /api/dprs` — list/search/filter/sort/paginate — `dpr:read`

Query params (frontend type: `DPRListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches `dprNumber`, case-insensitive |
| `projectId` | string | exact match — unlike Schedule, the admin list has an "All projects" option, so this is genuinely optional |
| `dateFrom` / `dateTo` | ISO date string | inclusive range filter on `reportDate` |
| `sortBy` | `"reportDate" \| "createdAt" \| "dprNumber"` | default `reportDate` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: DPR[], total, page, pageSize }`.

### `GET /api/dprs/:id` — detail — `dpr:read`

Response `200`: a single `DPR`. `404` if not found.

### `GET /api/dprs/:id/manpower` — this DPR's manpower rows — `dpr:read`

Response `200`: `DPRManpowerEntry[]` for that DPR (up to 8, one per category).

### `GET /api/dprs/:id/work-items` — this DPR's work-item lines — `dpr:read`

Response `200`: `DPRWorkItemEntry[]` for that DPR.

### `GET /api/dprs/work-item-history` — every work-item line for a project, across every DPR — `dpr:read`

Query params: `projectId` (required). Backs the "previous qty"/"cumulative qty"/"% complete" computation and the create/edit form's per-line defaults — never precomputed server-side in this build.

Response `200`: `{ dpr: DPR, line: DPRWorkItemEntry }[]`, oldest report date first.

### `POST /api/dprs` — create — `dpr:write`

Request body (frontend type: `CreateDPRInput`): `{ projectId, reportDate, notes?, manpower: CreateDPRManpowerInput[], workItems: CreateDPRWorkItemInput[] }`. `manpower` must contain exactly 8 entries, one per `DPRManpowerCategory` (`422` otherwise — validated client-side by `dprFormSchema`). Every `workItems[].workItemMasterId` must resolve against the static master list (`422` otherwise); the four "Other ___ work" catch-all rows additionally require non-empty `otherDescription`/`otherUom`. Backend responsibility: assigns `id`, `dprNumber` (next sequential `DPR-####`), both timestamps, and `preparedBy`/`preparedByName` from the authenticated actor.

**Side effect**: for every work-item line carrying a `scheduleActivityId`, the backend must also record a new `ScheduleProgressEntry` on that activity — `executedQuantity = (that activity's own latest executedQuantity) + this line's todayQty`, `recordedAt = reportDate`, `remarks` auto-noting the source DPR. A stale/cross-project `scheduleActivityId` is skipped (the line still saves) rather than failing the request. See `docs/WORKFLOWS.md` and `docs/OPEN_QUESTIONS.md` #35 for why this figure, not the DPR's own cumulative, is what gets pushed.

Response `201`: the created `DPR` (manpower/work-item lines fetched separately via the endpoints above).

### `PATCH /api/dprs/:id` — edit — `dpr:write`

Request body (frontend type: `UpdateDPRInput`): any subset of `{ reportDate, notes, manpower, workItems }` (never `projectId` — the form disables that field in edit mode). Same validation as create when `manpower`/`workItems` are included; when included, `workItems` fully replaces the DPR's existing lines (frontend does not diff/patch individual lines).

**Side effect — full reconciliation, not just a re-push (BrickBasket final hardening pass; this replaces an earlier, stale version of this paragraph that described the Phase-4 fix's own known remaining gaps as unfixed).** Saving a DPR must reconcile *every* Schedule contribution this DPR itself owns, not merely push the new set of linked lines:

1. Determine the DPR's *previous* set of linked `(scheduleActivityId, workItemMasterId, location)` triples (i.e., before this edit's `workItems` replaces them).
2. Determine the *new* set of linked triples from the request body's `workItems`.
3. For every previous triple that has no matching triple in the new set — because the line was deleted from the DPR entirely, its `scheduleActivityId` was repointed at a different activity, or its `workItemMasterId`/`location` changed — **remove** the `ScheduleProgressEntry` that triple previously caused to be created on its (old) activity. It must not be left behind as an orphan still counting toward that activity's cumulative progress.
4. For every triple in the new set, **create or update** (not append) the one `ScheduleProgressEntry` on its activity attributable to that triple — `executedQuantity = (that activity's own latest executedQuantity, excluding this DPR's own prior contribution under this same triple) + this line's todayQty`, `recordedAt = reportDate`, `remarks` auto-noting the source DPR — the same figure/rationale as the `POST /api/dprs` side effect above, corrected in place rather than duplicated (this is the Phase-4 fix, still in effect and still correct for the triples that persist unchanged).
5. Steps 1–4 together are one reconciliation and must commit as a single transaction alongside the `DPR`/`DPRWorkItemEntry` writes themselves — a partial application (e.g. the new entries created but the orphaned old ones not removed) leaves the Schedule ledger in a worse state than doing nothing.

A stale/cross-project `scheduleActivityId` on a *new* line is still skipped (the line still saves) rather than failing the request, same as create. This frontend's mock adapter (`src/lib/api/adapters/dpr-adapter.ts`'s `update()`, calling the new `ScheduleAdapter.removeProgressBySource` alongside the existing `upsertProgressFromSource`) now performs steps 1–4 above in-memory, non-transactionally (no real transaction primitive exists over a plain JS array) — see that file's own header comment. See `docs/WORKFLOWS.md` and `docs/OPEN_QUESTIONS.md` #35/#55 for the full reasoning and remaining open questions.

Response `200`: the updated `DPR`.

Errors (all DPR endpoints): `401` unauthenticated, `403` missing permission, `404` unknown DPR, `422` validation.

Permissions: `dpr:read`/`dpr:write` were already defined in Part 3 and were already assigned to the right roles (`project_manager`, `site_engineer`) — **no permission changes were needed for this part.**

No dedicated audit-log/history endpoint — matching `ScheduleActivity`'s reasoning (Part 13), a DPR has no lifecycle to log beyond its own edit history.

---

## Project Cost Accounting (Part 15)

Frontend files: `src/types/domain/cost-entry.ts`, `src/lib/api/adapters/cost-adapter.ts` (`CostAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-cost.ts`.

### `GET /api/cost-entries` — list/search/filter/sort/paginate — `finance:read`

Query params (frontend type: `CostListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches `category` label or `notes`, case-insensitive |
| `category` | `ContractCategory` | exact match |
| `projectId` | string | exact match — the admin list has an "All projects" option, so this is genuinely optional |
| `sortBy` | `"category" \| "budgetAmount" \| "actualAmount" \| "createdAt"` | default `category` |
| `sortDir` | `"asc" \| "desc"` | default `asc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: CostEntry[], total, page, pageSize }`.

### `GET /api/cost-entries/:id` — detail — `finance:read`

Response `200`: a single `CostEntry`. `404` if not found.

### `POST /api/cost-entries` — create — `finance:write`

Request body (frontend type: `CreateCostEntryInput`): `{ projectId, category, budgetAmount, actualAmount, notes? }`. Backend responsibility: assigns `id`, both timestamps.

Response `201`: the created `CostEntry`.

### `PATCH /api/cost-entries/:id` — edit — `finance:write`

Request body (frontend type: `UpdateCostEntryInput`): any subset of `{ budgetAmount, actualAmount, notes }` — never `projectId` or `category` (the form disables both fields in edit mode; together they identify the row).

Response `200`: the updated `CostEntry`.

Errors (all Cost Entry endpoints): `401` unauthenticated, `403` missing permission, `404` unknown cost entry, `422` validation.

Permissions: `finance:read`/`finance:write` were already defined in Part 3 and were already correctly assigned (`admin`/`finance` both; `customer` read-only, anticipating Part 16's `/dashboard/payments`) — **no permission changes were needed for this part.**

No dedicated audit-log/history endpoint — a `CostEntry` has no lifecycle to log, matching `ACEItem`'s reasoning (Part 8). No dedicated summary/variance endpoint either — the project-level Budget/Actual/Variance totals and the illustrative Contract-value/"Expected Profit" figure are computed client-side from `GET /api/cost-entries` (filtered by `projectId`) and `GET /api/contracts` (filtered by `status=accepted`, matched to the project client-side, since `ContractListParams` has no `projectId` filter) — not a backend aggregate in this build.

---

## Payments & Receipts + Bank & Cash (Part 16)

Frontend files: `src/types/domain/invoice.ts`, `src/types/domain/payment.ts`, `src/types/domain/bank-transaction.ts`, `src/lib/api/adapters/invoices-adapter.ts` / `payments-adapter.ts` / `bank-adapter.ts` (the contracts below mirror their methods 1:1), `src/hooks/use-invoices.ts` / `use-payments.ts` / `use-bank-transactions.ts`.

### Invoice

#### `GET /api/invoices` — list/search/filter/sort/paginate — `finance:read`

Query params (frontend type: `InvoiceListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches `invoiceNumber`, case-insensitive |
| `projectId` | string | exact match |
| `vendorId` | string | exact match |
| `purchaseOrderId` | string | exact match |
| `sortBy` | `"invoiceDate" \| "invoiceAmount" \| "createdAt" \| "invoiceNumber"` | default `invoiceDate` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: Invoice[], total, page, pageSize }`.

#### `GET /api/invoices/:id` — detail — `finance:read`

Response `200`: a single `Invoice`. `404` if not found.

#### `POST /api/invoices` — create — `finance:write`

Request body (frontend type: `CreateInvoiceInput`): `{ purchaseOrderId, invoiceNumber, invoiceDate, invoiceAmount, invoiceCopyFileName?, invoiceCopyFileSizeBytes?, notes? }`. Backend responsibility: rejects with `422` unless the referenced `PurchaseOrder.status === "issued"`; denormalizes `vendorId`/`projectId` from that PO onto the created `Invoice`; assigns `id`, both timestamps.

Response `201`: the created `Invoice`.

#### `PATCH /api/invoices/:id` — edit — `finance:write`

Request body (frontend type: `UpdateInvoiceInput`): any subset of `{ invoiceNumber, invoiceDate, invoiceAmount, invoiceCopyFileName, invoiceCopyFileSizeBytes, notes }` — never `purchaseOrderId` (the form disables the PO picker in edit mode; `vendorId`/`projectId` are backend-denormalized, not client-editable at all).

Response `200`: the updated `Invoice`.

Errors (all Invoice endpoints): `401` unauthenticated, `403` missing permission, `404` unknown invoice or purchase order, `422` validation (including the issued-PO rule above).

The invoice-copy fields are metadata-only (`invoiceCopyFileName`/`invoiceCopyFileSizeBytes`) — no file-upload/storage endpoint exists for this part, a scaled-down version of `Document`'s file handling (Part 6).

### Payment

#### `GET /api/payments` — list/search/filter/sort/paginate — `finance:read`

Query params (frontend type: `PaymentListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches `referenceNumber`, case-insensitive |
| `direction` | `"payment" \| "receipt"` | exact match — the admin list has an "All" option, so genuinely optional |
| `projectId` | string | exact match |
| `invoiceId` | string | exact match — used by `Invoice.paymentStatus`'s client-side computation |
| `contractId` | string | exact match |
| `customerId` | string | exact match — used by `/dashboard/payments` to scope to the signed-in customer |
| `sortBy` | `"paymentDate" \| "amount" \| "createdAt"` | default `paymentDate` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: Payment[], total, page, pageSize }`.

#### `GET /api/payments/:id` — detail — `finance:read`

Response `200`: a single `Payment`. `404` if not found.

#### `POST /api/payments` — create — `finance:write`

Request body (frontend type: `CreatePaymentInput`): `{ direction, projectId, invoiceId?, contractId?, amount, paymentDate, mode, referenceNumber?, notes? }`. Backend responsibility, branching on `direction`:
- `"payment"`: requires `invoiceId`, rejects with `422` if that `Invoice` doesn't exist, denormalizes `vendorId` from it.
- `"receipt"`: requires `contractId`, rejects with `422` unless that `Contract` exists and `status === "accepted"`, denormalizes `customerId` from it.

Assigns `id`, both timestamps either way.

Response `201`: the created `Payment`.

#### `PATCH /api/payments/:id` — edit — `finance:write`

Request body (frontend type: `UpdatePaymentInput`): any subset of `{ amount, paymentDate, mode, referenceNumber, notes }` — never `direction`, `projectId`, `invoiceId`, or `contractId` (all locked in edit mode; together they identify what the record is a payment/receipt *against*).

Response `200`: the updated `Payment`.

Errors (all Payment endpoints): `401` unauthenticated, `403` missing permission, `404` unknown payment/invoice/contract, `422` validation (including the direction-branching rules above).

No dedicated summary/aggregate endpoint — `Invoice.paymentStatus` (unpaid/partially_paid/paid) and the `/dashboard/payments` "Total Received" figure are both computed client-side from `GET /api/payments`, not a backend aggregate in this build, matching Part 15's precedent for `CostEntry` totals.

### BankTransaction

#### `GET /api/bank-transactions` — list/search/filter/sort/paginate — `finance:read`

Query params (frontend type: `BankTransactionListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches `partyOrVendorCode` or `invoiceNumber`, case-insensitive |
| `projectId` | string | exact match |
| `yearOfExecution` | string | exact match |
| `sortBy` | `"createdAt" \| "paymentAmount" \| "yearOfExecution"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: BankTransaction[], total, page, pageSize }`.

#### `GET /api/bank-transactions/:id` — detail — `finance:read`

Response `200`: a single `BankTransaction`. `404` if not found.

#### `POST /api/bank-transactions` — create — `finance:write`

Request body (frontend type: `CreateBankTransactionInput`): every field of `BankTransaction` except `id`/`createdAt`/`updatedAt`, i.e. `{ paymentId?, partyOrVendorCode, paymentAmount, invoiceNumber, accountNumber?, utrNumber?, projectId, yearOfExecution, state, city, taxAmount, tdsDetails?, gstin?, taxComponent?, itcApplicable, notes? }`. Backend responsibility: when `paymentId` is provided, rejects with `422` if that `Payment` doesn't exist; assigns `id`, both timestamps.

Response `201`: the created `BankTransaction`.

#### `PATCH /api/bank-transactions/:id` — edit — `finance:write`

Request body (frontend type: `UpdateBankTransactionInput`): any subset of the same field set as create — every field is editable, unlike `Invoice`/`Payment`, since §8C confirms no relational identity to lock.

Response `200`: the updated `BankTransaction`.

Errors (all BankTransaction endpoints): `401` unauthenticated, `403` missing permission, `404` unknown entry or (when `paymentId` given) unknown payment, `422` validation.

Permissions (all three entities above): `finance:read`/`finance:write` were already defined in Part 3 and were already correctly assigned (`admin`/`finance` both; `customer` read-only, used by `/dashboard/payments`) — **no permission changes were needed for this part.**

---

## Taxes, Fixed Assets & GSTR (Part 17)

Frontend files: `src/types/domain/tax-record.ts` / `fixed-asset.ts` / `gstr-record.ts`, `src/lib/api/adapters/tax-records-adapter.ts` / `fixed-assets-adapter.ts` / `gstr-adapter.ts` (the contracts below mirror their methods 1:1), `src/hooks/use-tax-records.ts` / `use-fixed-assets.ts` / `use-gstr.ts`.

### TaxRecord

#### `GET /api/tax-records` — list/search/filter/sort/paginate — `finance:read`

Query params (frontend type: `TaxRecordListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches `name`/`authority`, case-insensitive |
| `type` | `TaxRecordType` | exact match |
| `projectId` | string | exact match |
| `sortBy` | `"dueDate" \| "amount" \| "createdAt"` | default `dueDate` |
| `sortDir` | `"asc" \| "desc"` | default `asc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: TaxRecord[], total, page, pageSize }`. No dedicated summary/aggregate endpoint — the page's Pending/Overdue totals are computed client-side from this same list (`getTotalPending`/`getTotalOverdue`), matching `CostEntry`'s precedent (Part 15).

#### `GET /api/tax-records/:id` — detail — `finance:read`

Response `200`: a single `TaxRecord`. `404` if not found.

#### `POST /api/tax-records` — create — `finance:write`

Request body (frontend type: `CreateTaxRecordInput`): every `TaxRecord` field except `id`/`createdAt`/`updatedAt`. Backend responsibility: assigns `id`, both timestamps.

Response `201`: the created `TaxRecord`.

#### `PATCH /api/tax-records/:id` — edit — `finance:write`

Request body (frontend type: `UpdateTaxRecordInput`): any subset of `TaxRecord`'s fields — every field stays editable, since §8D confirms no relational identity to lock (same treatment as `BankTransaction`, Part 16).

Response `200`: the updated `TaxRecord`.

Errors (all TaxRecord endpoints): `401` unauthenticated, `403` missing permission, `404` unknown record, `422` validation.

### FixedAsset

#### `GET /api/fixed-assets` — list/search/filter/sort/paginate — `finance:read`

Query params (frontend type: `FixedAssetListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches `assetName`/`serialNumber`, case-insensitive |
| `category` | `FixedAssetCategory` | exact match |
| `projectId` | string | exact match |
| `sortBy` | `"purchaseDate" \| "value" \| "createdAt"` | default `purchaseDate` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: FixedAsset[], total, page, pageSize }`.

#### `GET /api/fixed-assets/:id` — detail — `finance:read`

Response `200`: a single `FixedAsset`. `404` if not found.

#### `POST /api/fixed-assets` — create — `finance:write`

Request body (frontend type: `CreateFixedAssetInput`): every `FixedAsset` field except `id`/`createdAt`/`updatedAt`. Backend responsibility: rejects with `422` if `value <= 5,000` (the owner's confirmed threshold — the frontend also validates this client-side); assigns `id`, both timestamps.

Response `201`: the created `FixedAsset`.

#### `PATCH /api/fixed-assets/:id` — edit — `finance:write`

Request body (frontend type: `UpdateFixedAssetInput`): any subset of `FixedAsset`'s fields — every field stays editable, same reasoning as `TaxRecord`. Same `value` threshold validation as create when `value` is included.

Response `200`: the updated `FixedAsset`.

Errors (all FixedAsset endpoints): `401` unauthenticated, `403` missing permission, `404` unknown asset, `422` validation (including the value-threshold rule above).

### GSTRRecord

#### `GET /api/gstr-records` — list/search/filter/sort/paginate — `finance:read`

Query params (frontend type: `GSTRListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches `invoiceReference`/`saleDescription`/`gstin`, case-insensitive |
| `type` | `GSTRRecordType` | exact match — the admin page's Purchase/Sales tabs always pin this |
| `projectId` | string | exact match |
| `period` | string | exact match, `"YYYY-MM"` |
| `sortBy` | `"period" \| "taxableValue" \| "createdAt"` | default `period` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: GSTRRecord[], total, page, pageSize }`. No dedicated summary/aggregate endpoint — the page's Taxable Value/Tax totals are computed client-side from this same list (`getTotalTaxableValue`/`getTotalTax`).

#### `GET /api/gstr-records/:id` — detail — `finance:read`

Response `200`: a single `GSTRRecord`. `404` if not found.

#### `POST /api/gstr-records` — create — `finance:write`

Request body (frontend type: `CreateGSTRRecordInput`): `{ type, period, projectId?, grnId?, contractId?, saleDescription?, gstin?, taxableValue, taxAmount, invoiceReference?, notes? }`. Backend responsibility, branching on `type`:
- `"purchase"`: requires `grnId`, rejects with `422` if that `GRN` doesn't exist, denormalizes `vendorId`/`projectId` from it.
- `"sales"`: requires either `contractId` (rejects with `422` unless that `Contract` exists and `status === "accepted"`, denormalizing `customerId`/`projectId`) or `saleDescription` (rejects with `422` if neither is given).

Assigns `id`, both timestamps either way.

Response `201`: the created `GSTRRecord`.

#### `PATCH /api/gstr-records/:id` — edit — `finance:write`

Request body (frontend type: `UpdateGSTRRecordInput`): any subset of `{ period, taxableValue, taxAmount, gstin, invoiceReference, notes }` — never `type`, `grnId`, `contractId`, or `saleDescription` (all locked in edit mode; together they identify what the record reports on).

Response `200`: the updated `GSTRRecord`.

Errors (all GSTRRecord endpoints): `401` unauthenticated, `403` missing permission, `404` unknown record/GRN/contract, `422` validation (including the direction-branching rules above).

Permissions (all three entities above): `finance:read`/`finance:write` were already defined in Part 3 and were already correctly assigned (`admin`/`finance` both) — **no permission changes were needed for this part.**

## Cost-to-Complete + Cost Management placeholder (Part 18)

### CostToComplete

#### `GET /api/cost-to-complete?projectId=:id` — the full computed report for one project — `finance:read`

**The only read endpoint in this app with no matching `POST`/`PATCH`/`DELETE`** — `CostToComplete` is a pure aggregate, never a record a person creates or edits. `projectId` is required (unlike every list endpoint elsewhere in this app, there is no "all projects" mode — see `docs/WORKFLOWS.md`).

Response `200` (frontend type: `CostToCompleteSummary`):

```
{
  projectId: string,
  rows: CostToCompleteRow[],          // one per ContractCategory with data — see docs/DATA_MODELS.md
  totalOriginalEstimate: number,      // Σ rows[].originalEstimate — "Original budget" in the owner's §8G example
  totalCompletedToDate: number,       // Σ rows[].completedToDate — "Actual cost to date"
  totalBalanceToComplete: number,     // Σ rows[].balanceToComplete — "Remaining estimated cost"
  totalEstimatedValue: number,        // Σ rows[].totalEstimatedValue — "Forecasted final cost"
  totalVariance: number,              // totalOriginalEstimate − totalEstimatedValue
  unallocatedOrderedTotal: number,    // ordered PO value that couldn't be traced to any category — see docs/DATA_MODELS.md
}
```

Backend responsibility: this build computes the full join client-side across four adapters on every call (`CostEntry`, `ACEItem`, `PurchaseOrder`+`PurchaseOrderLineItem`, `RFQ`+`RFQLine` — see `CostToCompleteAdapter`'s file-level comment for the exact calculation and `docs/OPEN_QUESTIONS.md` #39 for every frontend decision it required); a real backend should compute the equivalent join server-side (ideally as a materialized/cached aggregate, since it touches four tables per request) rather than have the frontend re-derive it from four separate list calls.

Errors: `401` unauthenticated, `403` missing permission, `400` missing/unknown `projectId`.

### Cost Management

**No endpoints.** Per the owner's explicit §8H instruction ("DO NOT invent this module's detailed business rules"), `/admin/cost-management` has no type, no adapter, and calls no API — it renders a static placeholder behind `cost_management:view` (already defined and assigned in Part 3). This section is deliberately left otherwise empty pending the separate Excel specification from Pushkar Tiwari — see `docs/OPEN_QUESTIONS.md` #4.

Permission: `finance:read` (CostToComplete) and `cost_management:view` (Cost Management) were both already defined in Part 3 and already correctly assigned — **no permission changes were needed for this part.**

## Cross-Module Polish (Part 19)

### Notifications

#### `GET /api/notifications` — the full computed notification list for the signed-in user — no permission of its own; every notification within the response is already individually gated by the `PermissionKey` its underlying report requires

**Another pure-aggregate read endpoint with no matching `POST`/`PATCH`/`DELETE`**, the same shape as Cost-to-Complete (Part 18) — a notification is never created, edited, marked read, or deleted by the frontend; it simply stops appearing in the next `GET` once its underlying record no longer qualifies.

Response `200` (frontend type: `AppNotification[]`):

```
[
  {
    id: string,               // "${category}:${entityId}[:suffix]" — not backend-issued
    category: NotificationCategory,
    severity: "info" | "warning" | "urgent",
    message: string,
    createdAt: string,        // ISO — the underlying record's own timestamp
    href: string,
  },
  ...
]
```

Backend responsibility: this build computes the full permission-gated union client-side across eight adapters on every call (`Lead`, `PurchaseRequisition`, `PurchaseOrder`, `GRN`, `TaxRecord`, `ScheduleActivity`+`ScheduleProgressEntry`, `Contract`, `MRC` — see `NotificationsAdapter`'s file-level comment for the exact rule table and `docs/OPEN_QUESTIONS.md` #40 for every frontend decision it required); a real backend should compute the equivalent per-user query server-side, ideally pushed via a real event/webhook mechanism once one exists (ties back to the still-open `docs/OPEN_QUESTIONS.md` #10 — channel/event confirmation).

Errors: `401` unauthenticated.

### Ops Dashboard Metrics

#### `GET /api/ops-metrics` — the full computed metric-card list for the signed-in user — no permission of its own; every metric is individually gated the same way notifications are

Response `200` (frontend type: `OpsMetric[]`):

```
[
  { id: string, label: string, value: string, href: string, tone: "neutral" | "attention" },
  ...
]
```

Backend responsibility: same client-side composition discipline as Notifications above, plus one additional per-project loop through the Cost-to-Complete aggregate (Part 18) for "Projects Over Original Estimate" — a real backend should precompute/cache this rather than re-run four-adapter joins per project per dashboard load.

Errors: `401` unauthenticated.

### Global Search

**No new endpoint.** The command palette (`GlobalSearch`, `Cmd/Ctrl+K`) calls seven already-existing `list({ search })` methods in parallel — `contractsAdapter`, `vendorsAdapter`, `requisitionsAdapter`, `rfqAdapter`, `purchaseOrdersAdapter`, `grnAdapter`, `mrcAdapter` (2 of the 7 for the customer persona, each additionally scoped by `customerId`) — each already documented under its own module's section above. A real backend could keep this client-composed (7 parallel requests) or add a single `/api/search?q=` aggregate endpoint later; nothing about the frontend's `GlobalSearchResult` shape (`id`, `entityLabel`, `title`, `subtitle?`, `href`) requires the latter.

### Audit Timeline

**No API change of any kind.** `AuditTimeline<Entry>` is a frontend-only render consolidation of `ContractAuditHistory`/`POAuditHistory`/`RequisitionAuditHistory`/`LeadActivityLog`'s read-only half — it reads the exact same `ContractAuditEntry[]`/`PurchaseOrderAuditEntry[]`/`RequisitionAuditEntry[]`/`LeadActivity[]` those components' existing endpoints already return.

Permissions: no new `PermissionKey` was added or reassigned for any of Part 19's four features — every gate above reuses a permission already defined and assigned since Part 3.

---

## Store Material Requisition ("MR", §6B, added post-Part-20 stabilization pass — Phase 2)

Frontend files: `src/types/domain/store-requisition.ts`, `src/lib/api/adapters/store-requisitions-adapter.ts` (`StoreRequisitionsAdapter` — the contract below mirrors its methods 1:1), `src/hooks/use-store-requisitions.ts`. See that type file's header comment for why this is a separate module from Purchase Requisition (Part 8, above) despite the similar name — this one requests material already in stock, that one requests buying material from a vendor.

### `GET /api/store-requisitions` — list/search/filter/sort/paginate — `store_requisitions:read`

Query params (frontend type: `StoreRequisitionListParams`), all optional:

| Param | Type | Notes |
|---|---|---|
| `search` | string | matches requisition number / remarks, case-insensitive |
| `projectId` | string | exact match |
| `status` | `StoreRequisitionStatus` | exact match |
| `requestedBy` | staff user id | backs a "my requests" filter |
| `sortBy` | `"createdAt" \| "updatedAt" \| "status" \| "requisitionNumber" \| "requestDate"` | default `createdAt` |
| `sortDir` | `"asc" \| "desc"` | default `desc` |
| `page` / `pageSize` | number | default `1` / `10` |

Response `200`: `{ items: StoreRequisition[], total, page, pageSize }`.

### `GET /api/store-requisitions/:id` — detail — `store_requisitions:read`

Response `200`: a single `StoreRequisition`. `404` if not found.

### `POST /api/store-requisitions` — create — `store_requisitions:create`

Request body (frontend type: `CreateStoreRequisitionInput`): `{ projectId, requestDate, material, otherMaterialName?, uom, requestedQuantity, remarks? }`. `otherMaterialName` is required when `material === "other"` (`422` otherwise — enforced both by the form's zod `.superRefine()` and the adapter's `assertOtherMaterialName`). Backend responsibility: assigns `id`, `requisitionNumber` (display reference, `MR-####`), `requestedBy`/`requestedByName` from the authenticated session, and both timestamps; always starts at `status: "draft"`.

Response `201`: the created `StoreRequisition`.

### `PATCH /api/store-requisitions/:id` — edit — `store_requisitions:create`

Request body (frontend type: `UpdateStoreRequisitionInput`): any subset of `{ requestDate, material, otherMaterialName, uom, requestedQuantity, remarks }`. **Only valid while `status` is `"draft"` or `"rejected"`** — reject otherwise (`409`). Editing a `"rejected"` request also resets it to `"draft"` and clears `storeRemarks` — same revise-after-decline pattern as Contract (Part 5) and Purchase Requisition (Part 8).

Response `200`: the updated `StoreRequisition`.

### `POST /api/store-requisitions/:id/submit` — submit for Stores review — `store_requisitions:create`

No body. Valid only from `status: "draft"` (`409` otherwise). Response `200`: the updated `StoreRequisition` (`status: "submitted"`).

### `POST /api/store-requisitions/:id/decide` — approve or reject — `store_requisitions:action`

Request body (frontend type: `StoreRequisitionDecisionInput`): `{ decision: "approved" | "rejected", approvedIssuedQuantity?: number, storeRemarks?: string }`. Valid only from `status: "submitted"` (`409` otherwise). `approvedIssuedQuantity` is required and must be `> 0` when `decision === "approved"` (`422` otherwise) — Stores may approve issuing a different quantity than requested.

Response `200`: the updated `StoreRequisition`.

### `POST /api/store-requisitions/:id/issue` — record actual issuance — `store_requisitions:action`

No body. Valid only from `status: "approved"` (`409` otherwise). **This frontend's mock adapter only flips this record's own `status`/`issueDate`** — that is a demo-data shortcut, not the real contract. A real backend implementation of this endpoint **must perform the following as a single atomic transaction** (BrickBasket final hardening pass — this was previously undocumented):

1. **Verify status.** Re-check server-side that the requisition is currently `"approved"` — never trust a client-supplied status. Reject with `409` otherwise (a concurrent decide/issue race must not be able to double-issue).
2. **Verify the approved issued quantity.** `approvedIssuedQuantity` (set during `decide`) must be present and `> 0` — reject with `422`/`409` if the record somehow reached `"approved"` without one (should be unreachable if `decide` itself is enforced correctly, but the issue step must not assume it).
3. **Verify stock availability.** Confirm the Stores module actually holds at least `approvedIssuedQuantity` of `material`/`otherMaterialName` for the relevant project/store location right now, immediately before committing — not merely that it did at approval time, since time has passed and other movements may have consumed it. Reject with `409` (e.g. `"Insufficient stock to complete this issuance"`) if not.
4. **Create the stock-consumption/movement record.** Write whatever the backend's real Stock Management (Part 11) ledger equivalent of this app's `StockEntry` is, decrementing available quantity by `approvedIssuedQuantity`, and cross-referencing this `StoreRequisition`'s `id` so the movement is traceable back to the request that caused it.
5. **Mark the `StoreRequisition` `status: "issued"`.**
6. **Set `issueDate`** (server clock, not client-supplied).
7. **Record the authenticated actor** who performed the issuance (a field this frontend's `StoreRequisition` type does not currently carry at all — see `docs/DATA_MODELS.md`'s note below; a real backend should add one, e.g. `issuedBy`/`issuedByName`, mirroring `requestedBy`/`requestedByName`).
8. **Commit the transaction.** Steps 4–7 must succeed or fail together — a real backend must never leave a `StoreRequisition` marked `"issued"` without the corresponding stock decrement having actually happened (or vice versa: a stock decrement recorded against a requisition that failed to reach `"issued"`).

Response `200`: the updated `StoreRequisition` (`status: "issued"`, terminal) on success; `409` if steps 1–3 fail (with a message identifying which check failed, per this app's existing `throw new Error(message)` convention — see `docs/ERROR_HANDLING.md`).

**The frontend is not, and must never become, the authority for stock truth.** Nothing in this app's UI should ever compute or display "would this issuance succeed against current stock" as a client-side prediction — that check belongs entirely to the backend transaction above, executed at the moment of issuance, against the backend's own real-time stock state. See `docs/WORKFLOWS.md` and `docs/OPEN_QUESTIONS.md` for the corresponding workflow and open-question entries.

Errors (all Store Requisition endpoints beyond create): `401` unauthenticated, `403` missing permission, `404` unknown requisition, `409` invalid status transition (including the two new `issue`-specific `409` cases above — status re-check and insufficient stock), `422` validation.

**No dedicated audit-log entity** — unlike Purchase Requisition (Part 8), this module keeps no `*AuditEntry[]` history; the owner's one-sentence §6B description gave no "History" requirement to build against, and `storeRemarks`/`updatedAt` are the only trail kept. A frontend scoping decision, not a gap — see `docs/DATA_MODELS.md`'s Store Material Requisition section and `docs/OPEN_QUESTIONS.md`.

**Issuing a request does not write a `StockEntry` row in this frontend's mock adapter** — `issue()` (`src/lib/api/adapters/store-requisitions-adapter.ts`) only flips this record's own status/`issueDate`; it does not call into the Stock Management (Part 11) adapter, and its `actor` parameter is currently unused (accepted but not persisted anywhere, since the mock `StoreRequisition` type has nowhere to put it). This is a deliberate mock-data shortcut, not a proposal for what the real backend should do — see the 8-step transaction above for what the real endpoint must actually do, and `docs/DATA_MODELS.md` for the data-model gap this implies.

Permissions: `store_requisitions:read`/`store_requisitions:create`/`store_requisitions:action` are new this pass — see `docs/ROLES_AND_PERMISSIONS.md`.

---

## Coverage note

Every module that exists in this app has a contract section above (Lead Management through the post-Part-20 stabilization pass's Store Material Requisition addition). Cost Management (Part 18, see the Cost-to-Complete section above) has no contract of its own because it is a deliberate placeholder shell, not because it's undocumented — see `docs/OPEN_QUESTIONS.md` #4. (BrickBasket final hardening pass — P2 documentation cleanup: this section previously read "Every other module — Not yet implemented," which had gone stale once the modules below it shipped.)
