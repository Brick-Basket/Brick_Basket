# BrickBasket — Backend Claude Handoff

Populated Part 20, the final part of the original 20-part roadmap. This is the single synthesis document a backend-focused session should read start to finish before opening any other file in this repository — it names what's confirmed, what's a frontend guess, and exactly where to look for more detail on each point, so nothing here needs to be re-derived by reading UI code line-by-line.

**Read this document's "Source-of-truth rules" (§2) before anything else.** Every claim below is labeled confirmed or invented; when the two conflict anywhere in this repo, the rules in §2 say which wins.

---

## 1. Project overview

BrickBasket is a construction-operations platform: one company runs residential/commercial construction projects end to end — lead intake, contracting, vendor sourcing and procurement, site stores, project scheduling and daily progress, cost accounting, payments, and statutory tax/GST tracking — with a customer-facing portal alongside the internal admin tool. This repository is the **frontend only**: a Next.js 15 (App Router) + React 19 + TypeScript application, built across 20 incremental parts (`docs/PART_PROMPTS.md`), currently running entirely against in-memory mock adapters with **no real backend, no database, and no server-side enforcement of anything** — see `docs/ARCHITECTURE.md` sections A–B for the full route/module map and `docs/README.md` for how to run it locally.

## 2. Scope boundary and source-of-truth rules

Per `BACKEND_CLAUDE_HANDOFF_TEMPLATE.md` (this project's own handoff contract, which this document fulfills):

**Frontend Claude owns**: the UI, frontend architecture, typed contracts (`src/types/domain/*.ts`), mock adapters, and every doc in this `docs/` directory. **Backend Claude owns**: the production backend, database, server-side business logic, authentication/authorization *enforcement* (not just the UX-layer check the frontend already has), storage, integrations, and persistence.

Source-of-truth order, in case of conflict — apply top to bottom:
1. **Owner requirements** are the business/workflow source of truth.
2. **Company profile** is the source of truth for public company facts.
3. **Approved UI references** are the visual source of truth.
4. **Unknown or ambiguous business rules must be marked "Requires client confirmation"** — never invented as if confirmed. This repository's own discipline throughout all 20 parts: every frontend guess is logged in `docs/OPEN_QUESTIONS.md` (41 entries) rather than presented as settled. **Do not invent business rules where the owner requirements are silent** — resolve the open question first, or implement the frontend's already-logged interim decision *provisionally*, flagged the same way.

## 3. Owner requirements summary

The authoritative owner requirements live outside this repository's `docs/` folder, in the Claude Project's own uploaded documents (`BrickBasket_Master_Frontend_Prompt_v6.1.txt`/`.docx`, `BrickBasket_Requirements_Reconciliation_Report.txt`, `PACKAGE_MANIFEST_v6.1.txt`, `BrickBasket_Owner_Requirements_Screenshots.pdf`, and the approved UI reference screenshots `BrickBasket_*_UI.png`) — read those directly for the owner's original words; this repo's docs *summarize and implement* them, never replace them as the source of truth. In short: 8 confirmed roles (admin, customer, project_manager, site_engineer, purchaser, store_personnel, finance, approver), a public marketing site plus two authenticated shells (internal admin, customer portal), and roughly 18 functional modules spanning sales/CRM through finance/statutory reporting — see `docs/MODULES.md` for the module-by-module breakdown and `docs/ROLES_AND_PERMISSIONS.md` for the full role model.

## 4. Frontend architecture summary

Full detail in `docs/ARCHITECTURE.md` (all 10 sections, A–J) and `docs/COMPONENT_GUIDE.md`; the load-bearing fact for backend work is the **adapter boundary**: every component calls a hook in `src/hooks/`, every hook calls one method on an adapter interface in `src/lib/api/adapters/`, and no component or hook ever calls `fetch()` directly. There are 25 adapter interfaces (one per module, three of them "pure aggregate" adapters with no persisted record of their own — `CostToComplete`, `Notifications`, `OpsMetrics`). Each adapter interface, not the mock implementation behind it, **is the frontend/backend contract** — `docs/API_CONTRACTS.md` and `docs/openapi.yaml` were both written by reading these interfaces, and connecting a real backend means implementing each one identically (`docs/API_INTEGRATION_GUIDE.md` has the exact per-adapter swap procedure).

## 5. Backend responsibilities

Everything the mock adapters currently do client-side that a real system must do server-side instead, at minimum:
- **Every `id`, display-reference number (`contractNumber`, `poNumber`, `grnNumber`, etc.), and timestamp** — the frontend never generates these; every "Backend responsibility:" line across `docs/API_CONTRACTS.md` names exactly what to assign on create.
- **Every "never trust a client-supplied actor" field** (`actorId`/`actorName`, `assessedBy`, `recordedBy`, `preparedBy`, and equivalents) — always derived from the authenticated session, never from the request body, even though the mock adapters currently accept an `actor` parameter directly from the calling hook (a mock-only shortcut, not a contract to preserve).
- **All authorization enforcement** — the frontend's permission system (`docs/ROLES_AND_PERMISSIONS.md`) is explicitly UX-layer only; every `PermissionKey` gate named throughout `docs/API_CONTRACTS.md` and `docs/openapi.yaml`'s `x-required-permission` extension must be independently re-checked server-side.
- **Customer-scoping enforcement** — several list endpoints (Contracts, Documents, MRC, Payments) accept a client-supplied `customerId`/`visibleToCustomer` filter that the frontend *always* sends correctly today, but a real backend must independently scope any customer-role request to that customer's own records regardless of what the query param says (flagged individually throughout `docs/API_CONTRACTS.md`).
- **The cross-module side effect in DPR → Schedule** (a DPR work-item line linked to a `scheduleActivityId` must also record a new `ScheduleProgressEntry` — see §14) and the **adapter-level cross-reference validation** in GSTR/Payment/MRC (a referenced GRN/Contract/Invoice must actually exist and be in the right state) — both currently done in mock adapter code, both must move server-side.
- **File storage** — no real file bytes are stored anywhere in this build (see §15).
- **Rate-limiting/CAPTCHA on the one public, unauthenticated endpoint** (`POST /api/leads`) — explicitly deferred to backend discretion in `docs/API_CONTRACTS.md`, not modeled on the frontend at all.

## 6. Authentication requirements

**Entirely unconfirmed** — `docs/OPEN_QUESTIONS.md` #7, open since Part 3. The frontend's mock (`docs/AUTHENTICATION.md`) is a client-only `localStorage` session with no server verification whatsoever: anyone can forge a session by editing browser storage. A real backend needs, at minimum: server-side session/token issuance and verification (httpOnly cookie or bearer JWT — `docs/OPENAPI.md` explains why a cookie was picked as `docs/openapi.yaml`'s placeholder, without that being a confirmed decision), password storage/verification (the mock has none — 8 demo personas log in with no real password check), a password-reset flow (entirely unspecified), and session-expiry/refresh behavior (the frontend currently just logs a user out client-side after a `≤60s` poll finds an "expired" mock session, with no warning — `docs/OPEN_QUESTIONS.md` #18). See `docs/FRONTEND_BACKEND_HANDOFF.md` §3 for the concrete wiring options once a shape is chosen.

## 7. Roles and permissions

8 roles, fully defined in `docs/ROLES_AND_PERMISSIONS.md`: `admin`, `customer`, `project_manager`, `site_engineer`, `purchaser`, `store_personnel`, `finance`, `approver`. Permissions are `<module>:<action>` string keys (`PermissionKey`), with a complete `ROLE_PERMISSIONS: Record<Role, PermissionKey[]>` default map already defined in `src/lib/permissions/permissions.ts` and reproduced in that doc's table. **This map itself is only partially owner-confirmed** — `docs/OPEN_QUESTIONS.md` #2 ("full role → permission matrix, incl. who holds PO Approval Level 1 vs Level 2") has been open since Part 3; the backend should treat the shipped map as the frontend's best-effort working default, not a confirmed final answer, and re-verify it against the owner before hard-coding it into a real authorization layer.

## 8. Database entity requirements

Every entity a real database needs a table (or collection) for is listed in `docs/DATA_MODELS.md`, with the authoritative field-level shape in `src/types/domain/*.ts` (34 files) — the same ground truth `docs/openapi.yaml`'s 96 component schemas were built from this part. At a glance: `Lead`/`LeadActivity`, `Contract`/`ContractLineItem`/`ContractAuditEntry`, `Customer`, `Document`/`DocumentVersion`, `Vendor`/`VendorAssessment`/`VendorPastWorkEntry`, `ACEItem`, `PurchaseRequisition`/`MaterialRequirement`/`RequisitionAuditEntry`, `RFQ`/`RFQLine`/`RFQVendorQuote`, `PurchaseOrder`/`PurchaseOrderLineItem`/`Approval`/`PurchaseOrderAuditEntry`, `GRN`/`GRNLineItem`, `StockEntry`, `WastageEntry`, `MRC`/`MRCLineItem`, `ScheduleActivity`/`ScheduleProgressEntry`, `DPR`/`DPRManpowerEntry`/`DPRWorkItemEntry`/`DPRWorkItemMaster` (static reference data, not user-editable — see §15's sibling note), `CostEntry`, `Invoice`/`Payment`/`BankTransaction`, `TaxRecord`/`FixedAsset`/`GSTRRecord`, `Project`. **Three entities have no table at all** — `CostToCompleteSummary`, `AppNotification`, `OpsMetric` are pure computed aggregates with no persisted record; see §17.

## 9. Entity relationships

`docs/DATA_MODELS.md` documents every foreign-key relationship; `docs/WORKFLOWS.md` documents the ones that span multiple modules as an actual business process rather than just a pointer. The two deepest chains, worth knowing before designing joins/indexes: **Requisition → RFQ → PO → GRN → MRC/GSTR** (a `MaterialRequirement` becomes an `RFQLine`, which a vendor quotes on, which becomes a `PurchaseOrderLineItem` once a vendor is selected and a PO created, which becomes a `GRNLineItem` once received, which can then be certified on an `MRCLineItem` or reported on a `GSTRRecord`), and **Cost-to-Complete's 4-adapter join** (`CostEntry` × `ACEItem` × `PurchaseOrder`+`PurchaseOrderLineItem` × `RFQ`+`RFQLine`, traced `PurchaseOrder.rfqId → RFQLine.aceItemId → ACEItem.category` — the deepest cross-entity composition in the app, detailed in `docs/OPEN_QUESTIONS.md` #39). A real backend should strongly consider a materialized/cached aggregate for the latter rather than a live 4-table join per request, per `docs/API_CONTRACTS.md`'s own note on that endpoint.

## 10. API endpoint inventory

**83 endpoints**, fully inventoried in both `docs/API_CONTRACTS.md` (prose, with workflow context) and `docs/openapi.yaml` (machine-readable OpenAPI 3.1 — see `docs/OPENAPI.md` for how to read it). Spanning: Leads (7), Contracts (8) + Customers (1), Documents (7), Vendors (8), ACE (4), Requisitions (7), RFQ (9), Purchase Orders (10), GRN (5) + Stock (4) + Wastage (4), MRC (7), Schedule (6), DPR (6), Cost Accounting (4), Invoices (4) + Payments (4) + Bank Transactions (4), Tax Records (4) + Fixed Assets (4) + GSTR (4), Cost-to-Complete (1), Notifications (1), Ops Metrics (1).

## 11. Request schemas

Every endpoint's request body is a named frontend type (`CreateXInput`/`UpdateXInput`) from `src/types/domain/*.ts`, documented per-endpoint in `docs/API_CONTRACTS.md` and formalized as a JSON Schema in `docs/openapi.yaml`'s `components.schemas`. Field-level validation beyond "which fields exist" — required-ness, conditional requirements, cross-field checks — is in `docs/VALIDATION_RULES.md` (Part 20), which also names the two known gaps where the frontend's own validation is inconsistent (Stock/Wastage's `otherMaterialName`, Requisition's `aceItemId`) and the one form (`GRNCreateForm`) with no schema-based validation at all.

## 12. Response schemas

Every list endpoint returns `{ items: T[], total, page, pageSize }`; every detail/mutation endpoint returns the entity itself (or `204` with no body for the one `DELETE` endpoint, RFQ vendor-quote removal). Full shapes in `docs/openapi.yaml`. Two endpoints — `CostToComplete` and `Notifications`/`OpsMetrics` — return a computed aggregate with no corresponding write endpoint at all; see §17.

## 13. Error contracts

Single shared shape across every endpoint: `{ "error": { "code": string, "message": string } }`, with standard HTTP status codes per `docs/ERROR_HANDLING.md`'s table (`400`/`422` validation, `401` unauthenticated, `403` forbidden, `404` not found — **must be indistinguishable from "exists but isn't yours" for customer-scoped resources, never `403` there**, `409` invalid state transition, `500` server error). The frontend today has **no implemented handling for any of this beyond displaying a message string** — no status-code branching, no structured `422` field-attribution client, no `401`-triggers-logout wiring — all confirmed absent by direct code inspection this part (`docs/OPEN_QUESTIONS.md` #41d). Backend Claude should implement the status codes as specified; the frontend-side branching to actually use them is future REST-adapter work, not something to expect from this repo today.

## 14. Workflow / state machines

Full detail in `docs/WORKFLOWS.md` and each module's status enum in `docs/STATUS_DEFINITIONS.md`. The state machines with real gates (not just a flat status label): **Contract** (`draft → sent_for_acceptance → accepted/declined`, decline resets to `draft`), **Requisition** (`draft → submitted → approved/rejected`, reject resets to `draft`), **RFQ** (`draft → finalized`, one-way), **PurchaseOrder** (`draft → pending_approval_l1 → pending_approval_l2 → approved → released → issued`, with a `rejected` branch off either approval level carrying `rejectedAtLevel`), **MRC** (`draft → issued → accepted/declined`, decline resets to `draft`). **GRN, StockEntry, WastageEntry, ScheduleActivity, DPR, CostEntry, Invoice/Payment/BankTransaction, TaxRecord/FixedAsset/GSTRRecord have no status/lifecycle at all** — always editable, no gate to enforce (explicitly confirmed per-module in `docs/API_CONTRACTS.md`, not an oversight). The one cross-module side effect with real logic to replicate: creating/editing a **DPR** work-item line carrying a `scheduleActivityId` must also append a new `ScheduleProgressEntry` on that activity, computed as `(that activity's own latest executedQuantity) + this line's todayQty` — not the DPR line's own cumulative figure — with a stale/cross-project link skipped rather than failing the whole request (`docs/OPEN_QUESTIONS.md` #35d/e has the full reasoning and known limitation).

## 15. File / document requirements

Full detail in `docs/FILE_UPLOADS.md`. **No real file storage exists anywhere in this build** — the Documents module (Part 6) tracks metadata only (`fileName`/`fileType`/`fileSizeBytes`) with an in-memory client-side object-URL as a preview stand-in, and Invoice's `invoiceCopyFileName`/`invoiceCopyFileSizeBytes` are the same metadata-only pattern scaled down further. A real backend needs an actual storage provider (S3-compatible or equivalent — unconfirmed, `docs/OPEN_QUESTIONS.md` #8), per-category max file size and allowed MIME types (also unconfirmed, same question), and a real file-serving mechanism (`docs/API_CONTRACTS.md`'s Document section suggests either embedding a URL on the response or a dedicated `/api/documents/:id/file` redirect — an implementation choice, not a confirmed contract). Document versioning is append-only (a new version supersedes the old one, old versions kept in `DocumentVersion` history, nothing ever deleted) — no delete/archive endpoint exists or should be invented (`docs/OPEN_QUESTIONS.md` #26).

## 16. Notifications / events

Full detail in `docs/NOTIFICATIONS.md`. **In-app only, computed live, nothing persisted or pushed** — `docs/OPEN_QUESTIONS.md` #10 (channel/event confirmation) is answered for this build only, not for the real product. A notification is a pure function of other entities' current state (e.g. "this requisition is `submitted`" → a notification exists; once it's no longer `submitted`, the notification simply stops appearing on the next poll) — there is no notification *table*, no "mark as read," no dismiss action. A real backend can keep this exact computed-on-read shape or move to a real event/webhook-driven model; either is a legitimate implementation of the same `GET /api/notifications` contract (see `docs/API_INTEGRATION_GUIDE.md`'s note on the three pure-aggregate adapters for the same tradeoff, applied to `Notifications`/`OpsMetrics`/`CostToComplete` alike).

## 17. Financial and project data relationships

The Cost-to-Complete computation (§9) is the one genuinely complex derived-financial-data path in this app — read `docs/OPEN_QUESTIONS.md` #39 in full before implementing it server-side; it documents eight separate frontend decisions about exactly which fields feed which derived number, none of them owner-confirmed, all of them grounded in the owner's §8G example figures as best-effort interpretation. Every other financial total in this app (`Invoice.paymentStatus`, tax Pending/Overdue totals, GSTR taxable-value/tax totals, the Cost Accounting project summary's Contract-value cross-link and "Expected Profit" figure) is computed **client-side from list endpoints**, never as a backend aggregate — each one individually flagged in its own `docs/API_CONTRACTS.md` section as a candidate for a real backend aggregate endpoint later, not a confirmed requirement to build one now.

## 18. Audit requirements

Four modules have a dedicated append-only audit-log entity with its own endpoint: `Contract` (`ContractAuditEntry`), `PurchaseRequisition` (`RequisitionAuditEntry`), `PurchaseOrder` (`PurchaseOrderAuditEntry`), and `Lead` (`LeadActivity`, dual-purpose as both a follow-up note log and a status-change log). **RFQ, GRN, MRC, and DPR deliberately have no separate audit-log entity** — a scope reduction, not an oversight, logged individually in `docs/OPEN_QUESTIONS.md` (#30, #32, #33, and DPR's own reasoning under #35f) — since the owner's text for those modules never asked for a "History" section the way Requisition's did. `ScheduleActivity` similarly has no separate audit log; its own append-only `ScheduleProgressEntry` history already serves that purpose. A backend implementing audit logging should follow this same module-by-module distinction rather than adding a log everywhere uniformly.

## 19. Validation rules

Full detail in `docs/VALIDATION_RULES.md` (Part 20) — every create/edit form's field-level rules, module by module, plus the mechanism each uses (zod schema, or `GRNCreateForm`'s lone hand-written exception). **Only one rule across the entire app is owner-confirmed**: `FixedAsset.value` must exceed ₹5,000 (`FIXED_ASSET_MIN_VALUE`). Every other rule is a frontend-invented default, safe to loosen, tighten, or replace once the real requirement is known — re-implement all of them server-side regardless, since client-side validation here is a UX convenience with zero enforcement power today.

## 20. Open questions

`docs/OPEN_QUESTIONS.md` — **41 numbered entries**, several with multiple lettered sub-items, covering every module built across all 20 parts. **Resolve this file before treating any frontend-invented decision as final.** The backend implementation checklist item "Resolve OPEN_QUESTIONS.md" (from this project's own handoff template) is not optional busywork — it is the actual mechanism by which this handoff avoids silently cementing a frontend guess into permanent backend behavior.

## 21. Frontend integration instructions

Full mechanical procedure in `docs/API_INTEGRATION_GUIDE.md` (per-adapter REST cutover) and `docs/FRONTEND_BACKEND_HANDOFF.md` (env vars, auth wiring options, CORS, suggested order, and the completed 16-item Integration Checklist sign-off). Short version: nothing above the adapter boundary (components, hooks, types) needs to change; only the 25 adapter files' final export line each need to swap from a `Mock*Adapter` to a `Rest*Adapter` implementing the identical interface.

## 22. Acceptance checklist

Restated from `BACKEND_CLAUDE_HANDOFF_TEMPLATE.md`, in the order a backend implementation should actually tackle them:

- [ ] Review owner requirements (§3 — read the original documents, not just this summary)
- [ ] Review frontend route/module map (`docs/ROUTES.md`, `docs/MODULES.md`)
- [ ] Review roles and permissions (§7, `docs/ROLES_AND_PERMISSIONS.md`)
- [ ] Review domain models (§8, `docs/DATA_MODELS.md`)
- [ ] Review API contracts (§10–13, `docs/API_CONTRACTS.md`)
- [ ] Review the OpenAPI specification (`docs/openapi.yaml`, `docs/OPENAPI.md`)
- [ ] Review workflow/state definitions (§14, `docs/WORKFLOWS.md`, `docs/STATUS_DEFINITIONS.md`)
- [ ] Review file/document requirements (§15, `docs/FILE_UPLOADS.md`)
- [ ] Resolve `docs/OPEN_QUESTIONS.md` (§20 — with the client, before hard-coding any frontend guess as final)
- [ ] Implement the database (§8–9)
- [ ] Implement authentication (§6)
- [ ] Implement authorization (§7, §5's "every permission gate must be independently re-checked server-side")
- [ ] Implement the APIs (§10–13)
- [ ] Implement validation (§19, server-side re-implementation of every rule, not just the owner-confirmed one)
- [ ] Implement audit logging (§18, matching the existing module-by-module scope, not applied uniformly)
- [ ] Implement file/document storage (§15)
- [ ] Integrate notifications (§16, live-computed or event-driven — an implementation choice)
- [ ] Connect the frontend's REST adapters (§21, `docs/API_INTEGRATION_GUIDE.md`)
- [ ] Run end-to-end integration tests (`docs/TESTING.md` — note that **no test infrastructure exists in this repository at all**; this is the first real occasion to add one)
