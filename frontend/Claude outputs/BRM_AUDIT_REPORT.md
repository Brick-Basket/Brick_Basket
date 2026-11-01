# BrickBasket — Business Requirements Audit (Phase 1 Deliverable)

**Scope:** Response to the "Complete Business Requirements Audit and Implementation" brief. This is **Phase 1 only** — inspection and reporting, no code changed. Per the brief's own sequencing ("Do not modify files during the initial inspection" / "Before making changes, provide a structured report"), Phase 3 (implementation) starts only after you confirm which gaps below to act on.

**Method:** Nearly every area this brief asks about has already been audited, in detail, across prior passes recorded in `docs/OPEN_QUESTIONS.md` (88 numbered rows) and `docs/CHANGELOG.md` (830+ lines). Rather than re-derive findings from scratch, this report cross-checks that existing record against the live source on your device (re-verified this pass via direct `grep`/file reads — e.g. `store-requisitions-adapter.ts`, `purchase-orders-adapter.ts`, `grn-adapter.ts`, `cost-to-complete-adapter.ts`, `vendor.ts`, `lead.ts`, `fixed-asset.ts`, `gstr-adapter.ts`, `contact-form.tsx`, `cost-management/page.tsx`) and gives you one consolidated compliance matrix instead of 88 scattered rows. Every "Gap identified" below is a real, currently-open gap — not a restatement of something already fixed.

---

## Deliverable 1 — Requirements Compliance Matrix

### A. Lead Management

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Leads created from specified sources | `Lead.source: "website" \| "social_media" \| "call_whatsapp" \| "personal_reference"` (`lead.ts`). **Only `website` is a real, automatic integration** — the public Contact form (`contact-form.tsx`) posts directly to `leadsAdapter` with `source: "website"`. The other three are classification values a staff member *manually* picks when logging a lead in `/admin/leads` — there is no social-media API, telephony, or WhatsApp ingestion anywhere in the codebase. | Social media / call / WhatsApp "integrations" do not exist — they are manual-entry categories, not automated capture. | None safe to invent — these require real third-party integrations (Meta/WhatsApp Business API, a telephony/call-log system) that need credentials and business sign-off before any code is written. | Needs verification → **Blocked** on confirming whether automated ingestion is actually required, or manual logging with correct classification is sufficient |
| Required lead info captured, search/filter/manage | Full CRUD, Kanban pipeline, city typeahead, filters (search + city) — `leads-adapter.ts`, `lead-table.tsx`, `lead-kanban.tsx`, `lead-filters.tsx`. | None found. | — | **Complete** |
| Lead → Contract workflow | Converting a lead creates/links a `Customer`; Contract creation is separate, manual. | Matches current confirmed business rule (#6, #19) — no automatic project creation. | — | **Complete** (as scoped) |
| Lead status transitions | Any status → any status, no state machine. | No enforcement of a valid pipeline order (OPEN_QUESTIONS #21). | Needs the confirmed pipeline vocabulary (#3) before this can be built. | **Blocked** on #3 |

### B. Contract Management

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Categories, line items, required fields | `ContractCategoryType` (IHB/Large Construction/Special Services), 8-value line-item category union, contract number format (`BB/{State}/{City}/{year}/00001`, location+year-scoped counter), contract date, city, attachment field. | Contract-number counter scoping (per-location vs. global) and "package criteria" meaning are frontend readings, not owner-confirmed (#71, #72). | Confirm scoping/meaning; low-risk either way since both are additive. | **Partially complete** |
| Acceptance flow, status consistency admin/customer | `draft → sent_for_acceptance → accepted/declined`, customer portal mirrors admin status. | No internal-BrickBasket-approval step distinct from "send" (#43) — flagged, not resolved, deliberately. | Needs an explicit owner decision among 3 named readings in `docs/WORKFLOWS.md`. | **Blocked** on #43 |
| Contract → Project linkage | No automatic project creation on acceptance. | Matches confirmed behavior — not a gap. | — | **Complete** (as scoped) |

### C. Drawing and Document Management

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Finalized drawings, certificates, invoices stored; warranty linkage | `Document` is now **contract-scoped** (redesigned per owner corrections, #73): category field, warranty item + expiry mapping, version counter, preview panel. | File storage is metadata-only — no real bytes persist (in-memory object URLs, lost on reload). Document↔Project link is denormalized and can drift from Contract↔Project (#74). | Needs a real file-storage backend (#8/#9) before "stored" is literally true. | **Partially complete** — frontend workflow real, persistence is **Blocked** on backend |
| Customer access to authorized documents | `/dashboard/documents`, scoped via `ProjectContext` + visibility flag. | None found beyond the backend-persistence gap above. | — | **Complete** (frontend) |

### D. Vendor Management

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| All required fields (name, GST category, GSTIN, address, MSME/Udyam, contact person/designation/email/phone, nature of work, turnover) | Confirmed present verbatim in `vendor.ts`: `gstin`, `msmeUdyamNumber` (optional — not every vendor has one on file), `nature: VendorNature`, `turnover: number`, contact fields. | None found against this list. | — | **Complete** |
| Vendor code series (6 categories incl. the inconsistent Series 6 example) | `VENDOR_CODE_SERIES_CONFIG` — Series 6 "60001+" was flagged, not silently corrected, and the owner confirmed the literal 5-digit value is intended (#1 — **already resolved**, not an open inconsistency). | None remaining — this was exactly the flag-don't-fix behavior the brief asks for, already done. | — | **Complete** |
| 4 assessment criteria, 0–10 scale, no invented overall formula | `vendor-rating.ts`: Quality / Timeline Adherence / Future Business Probability / Present Capacity, 0–10, averaged — comment states **"Owner-specified verbatim."** No overall-rating formula was invented. | A third-party reference template (#87b) proposed a different weighted 0–5 formula — correctly **not** applied, since it would silently override the owner's verbatim model. | None — already correctly declined. Would need its own explicit owner sign-off as an *additional* feature, never a replacement. | **Complete** |
| Past work / historical value | `VendorPastWorkEntry` (description, value, completion date, status: completed/in_progress — the two-value vocabulary is **owner-confirmed verbatim**, #85c). | None found. | — | **Complete** |

### E. Accepted Cost Estimate (ACE)

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Create/maintain, items/units/qty/rate, project association | `ACEItem` (category, UOM, qty, rate), project-scoped, grouped-by-category table view + CSV export (#84). | None found in the CRUD layer itself. | — | **Complete** |
| Procurement actually consumes ACE data (not an independent estimate) | **Confirmed real, not cosmetic**: `MaterialRequirement.aceItemId → ACEItem`, `RFQLine.aceItemId → ACEItem`, and Cost-to-Complete's Original Estimate (A) derives from `Σ(ACEItem.rate × MaterialRequirement.quantity)` grouped by category (#39a). | A requisition line with `source: "additional"` (free-entry, no ACE reference) cannot be traced — summed into `unallocatedOrderedTotal` rather than dropped (documented, not hidden). | None required — this is the documented, deliberate behavior; revisit only if "additional" lines should also map to ACE somehow. | **Complete** |

### F. Purchase Requisition → RFQ → Comparison → PO

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| End-to-end real record linkage (not independent mock data) | Confirmed a real chain, not parallel mocks: Requisition line → RFQ line (`aceItemId` carried through) → `RFQVendorQuote` (real `Vendor.id` reference) → PO (one PO per vendor per finalized RFQ, #31b). | None in the linkage itself. | — | **Complete** |
| L1/L2/L3 ranking, tax, totals | `rfq-comparison.ts`: ranks by **landed cost** (`base×(1+tax) + freight + loading + other`), not base rate alone (#87a, built and verified against mock data this session). | None found — this was the one concrete gap from the owner's reference Excel packs, and it's now built. | — | **Complete** |
| Vendor Scorecard weighted formula | Investigated against the reference Excel pack's `Price 30%/Delivery 30%/Quality 25%/Service 15%` model — **deliberately not built**, since it would silently override the owner-specified-verbatim 4-criterion rating in D above (#87b). | Correctly flagged as needing its own sign-off, not a silent replacement. | Needs an explicit owner decision: additional feature, never a replacement. | **Blocked** on owner confirmation |

### G. Purchase Orders and Approvals

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Two-level approval, permission enforcement, audit history | `PurchaseOrderStatus` 7-value lifecycle, approval gated by permission, `POAuditHistory` (consolidated into shared `AuditTimeline`, #40g). | Both Release and Issue share one `po:issue` permission key — no separate `po:release` key exists (#31c). | Confirm whether these should be two distinct capabilities. | **Partially complete** |
| PO issued to vendor's email | **`emailDispatchStatus: "sent"` is mocked, confirmed live in code** (`purchase-orders-adapter.ts` line ~291: "Email dispatch is mocked as immediately 'sent' — a real email..."). No real SMTP/email-provider integration exists anywhere in this codebase. | **The app currently cannot claim a PO was actually delivered to a vendor by email.** This is a real-feature gap, not a documentation gap. | Needs a real email-dispatch backend (SES/SendGrid/etc.) plus retry/failure handling — a genuine build item once backend exists. | **Not implemented** (backend-dependent) |

### H. Store Management

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| GRN partial receipt | `GRNLineItem.orderedQuantity`/`receivedQuantity` captured per line; multiple GRNs allowed against one PO (split deliveries). | **No check** that received quantities summed across GRNs stay within what was ordered (#32b) — confirmed still true in the live adapter this pass. | Add a sum-vs-ordered guard in `GRNAdapter.create` if over-receipt should be blocked. | **Partially complete** |
| Store MR → stock ledger update | **Confirmed live this pass**: `StoreRequisitionsAdapter.issue()` only flips `status`/`issueDate` — it does **not** write a `StockEntry` row. This is the exact limitation the brief asks to investigate, and it is real, current, and already explicitly documented (#49, #54) as deliberately not auto-written, because this is a plain in-memory mock with no real stock ledger to transact against safely. | A real stock decrement on issuance does not happen anywhere in this build. `StockAdapter.getTrace` only *surfaces* GRN/MR/Wastage side-by-side as a reconciliation aid with a manual "Use these values" action — it never auto-writes, by explicit design (`StoreRequisitionsAdapter.issue`'s own doc comment: "the frontend must never become the authority for stock truth"). | A real fix requires an atomic backend transaction (8 steps specified in `docs/API_CONTRACTS.md`'s `/issue` section) — not safely buildable as a blind client-side write, since this mock has no concurrency control. The **smallest safe frontend improvement**, if you want one now: make the reconciliation view's "Use these values" prefill the default instead of requiring a click, or add a local in-memory `StockEntry` write behind an explicit confirmation — a cosmetic simulation, not a real fix. | **Not implemented** (correctly, per its own documented reasoning) — **Blocked** on real backend for a true fix |
| Stock statement (opening/receipts/issues/closing/reconciliation) | `StockEntry` ledger + `StockAdapter.getTrace` reconciliation view. | Manually-maintained ledger, not auto-populated from GRN/MR (consistent with the MR gap above). | Same backend dependency as above. | **Partially complete** |
| Wastage — "beyond scope" classification | `Wastage` entries, category-flagged by whoever logs it; no automatic ACE/Requisition quantity comparison (#12, #32f) — confirmed not auto-classified. | Correctly **not** auto-classifying every extra purchase as wastage — matches the brief's own caution. | None required unless an automatic threshold rule is confirmed. | **Complete** (as scoped) |
| MRC — material/brand/warranty/project/customer links | `MRCLineItem.source: "grn" \| "manual"`, snapshotted quantities capped at GRN receipt. | `MRC.customerId` chosen independently, not auto-derived from `Project.customerId` (#33c) — pending real Project↔Customer ownership. | Revisit once Project entity has a real adapter + confirmed ownership model (#19, #44). | **Partially complete** |

### I. Project Management

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Schedule: pro-rata progress, delay-in-days | `getExpectedPercent` computes month-by-month pro-rata from `monthlyPlan` when present, falling back to whole-activity straight-line otherwise (#50c, owner-wording-confirmed); `getDelayDays` now visibly surfaced in table/Gantt/progress sheet (#50). | Whether every activity must eventually require a monthly breakdown, and whether a partial (not-yet-summing-to-total) breakdown should be valid mid-entry, remain open (#50a/b). | Needs owner confirmation — do not invent. | **Partially complete** |
| DPR: daily quantities, manpower, no double-counting into Schedule | `DPRWorkItemEntry.todayQty` (incremental), reconciled into Schedule via `upsertProgressFromSource`/`removeProgressBySource` keyed by `(activityId, sourceKey)` — edit, delete, and re-point are all now handled without double-counting or orphaning (#35e, #55, confirmed fixed and still true in the live adapter). | The underlying "remove old entries, then push new" happens as two sequential in-memory writes, not one atomic transaction — fine for this single-user mock, not safe as-is for concurrent real users. | Needs a real `PATCH /api/dprs/:id` database transaction (contract already specified in `docs/API_CONTRACTS.md`). | **Complete** (frontend logic) — **Blocked** on backend for true atomicity |
| Cross-module date/project consistency | Schedule/DPR/Site Updates all read the same `ProjectContext` selection (see Global Project Selector section below). | None found. | — | **Complete** |

### J. Finance and Accounting

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Cost Accounting: budget vs. actual vs. invoice vs. payment vs. remaining vs. forecast | `CostEntry.budgetAmount` (manual) vs. `actualAmount` (manual, deliberately — see CTC below) vs. real `Invoice`/`Payment` chain (Part 16) vs. `CostToComplete` forecast. | `CostEntry.actualAmount` itself is still manually typed, never auto-aggregated from real Payment/Invoice totals (#36b, #51) — a deliberate choice to avoid the frontend becoming "the authority for what Finance actually typed," not an oversight. | Open product question: should it auto-derive? Not a near-term code gap. | **Partially complete** |
| Payments/Receipts, Bank & Cash required fields | `Invoice`/`Payment` (direction-discriminated payment/receipt) with PO/vendor/amount/copy/payment-detail fields; `BankTransaction` with UTR, project, tax fields. | `BankTransaction` has no confirmed relational model at all (owner's own spec is a flat field list) — correctly left as an editable flat ledger rather than inventing relations (#37e). | None required unless the owner specifies a real relational model. | **Complete** (as scoped) |
| Taxes & Statutory recordkeeping | `TaxRecord.type: "tax" \| "statutory_license_fee"` — **owner-confirmed verbatim** (§8.4, #38b). | None found against the confirmed scope. | — | **Complete** |
| Fixed Assets, ₹5,000 threshold | **Confirmed live this pass**: `fixed-asset.ts` and `fixed-asset-form.tsx` both state and enforce "must be above ₹5,000 per the owner's stated threshold" verbatim — not replaced with a different policy. | None found. | — | **Complete** |
| GSTR purchase/sales categories, source-record requirement | **Confirmed live this pass**: a `"purchase"` entry requires a real linked GRN (`grnAdapter.get` call, throws if missing — `gstr-adapter.ts` line ~101); a `"sales"` entry requires either an accepted Contract or a manual description. | None found against the owner's "after stores GRN" rule. | — | **Complete** |
| Distinguish report presentation from real statutory filing | No filing integration exists anywhere — this is presentation/export only. | Matches the brief's own expected caution; not a gap, a correct boundary. | None — flag to the owner only if actual e-filing integration is wanted later. | **Complete** (as scoped), **Blocked** if real filing is wanted |

### Cost to Complete (priority financial audit)

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Forecast Final Cost = Actual + Remaining | Implemented: (A) Original Estimate from ACE/requisition chain, (B) Completed-to-date from traced vendor **Invoices** (matching the owner's literal "derived from vendor invoices" wording, corrected in a follow-up pass from an earlier Payments-based reading, #39b), (C) Balance to complete with a `max(B, ordered)` double-count guard, (D)/Variance derived from A–C. | The owner's explicit "applies to service & composite works, not supply components" split for ordered-not-completed is **not implemented** — `ContractCategory` has no supply-vs-service/composite classification to split by (#39e). | Needs that classification added to `ContractCategory` (or a new field) before this split can be built — currently every category is treated uniformly. | **Partially complete** |
| Category-wise breakdown, no double-counting | 3-hop cross-adapter trace (PO→RFQ→ACE→category); untraceable lines go to `unallocatedOrderedTotal`/`unallocatedCompletedTotal`/`unallocatedPaidTotal` rather than being silently dropped or double-counted. | None found — this is exactly the "don't omit or double-count" requirement, already built carefully. | — | **Complete** |
| Automated tests for confirmed calculations | `cost-to-complete-adapter.test.ts` exists (part of 17 test files, #41e) — **never executed** in this sandbox (no npm registry access this entire engagement). | Tests exist but are unverified-by-execution, the same caveat that applies to all 17 test files in this codebase. | Run `npm test`/`vitest` locally — cannot be done from this session. | **Needs verification** |
| Flag inconsistent financial examples rather than silently reconcile | The owner's own figures (sample ₹77L budget, etc.) are explicitly marked illustrative, not real (#5) — not silently corrected into anything. | None found needing a new flag beyond what's already recorded. | — | **Complete** |

### Cost Management (separate Excel spec)

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Placeholder only, no invented rules, until Pushkar Tiwari's spec arrives | **Confirmed live this pass**: `/admin/cost-management/page.tsx` is `ModulePlaceholder` behind `cost_management:view`, with a comment stating verbatim "DO NOT invent this module's detailed business rules... Detailed specification pending." No `CostManagement` type, adapter, or business logic exists. | None — this is exactly the required behavior. | None — leave untouched until the Excel spec (#4) is delivered. | **Blocked on external input** (correctly, not a frontend gap) |

### Global Project Selector

| Requirement | Existing implementation | Gap identified | Required change | Priority |
|---|---|---|---|---|
| Selector in admin header; persists across navigation/refresh; switching updates module data; no stale data; real data source, not fabricated | **Re-confirmed this session** (separate audit, logged in `docs/CHANGELOG.md`/`docs/OPEN_QUESTIONS.md` #88): `ProjectProvider`/`useProjectContext` — localStorage-persisted per signed-in user, revalidated against the live role-scoped project list every render (clears/falls back on a stale or inaccessible id, never trusted for authorization — stated verbatim in the provider's own header comment). Wired into 30 files: Schedule/DPR/Site Updates (each with a "follow until the user overrides" pattern) plus the provider/selector, 2 customer-portal pages, and the admin layout. Admin topbar selector is currently shown (no `showProjectSelector={false}` override remains). | None found this pass — this was independently, thoroughly re-audited in the immediately preceding session turn. | — | **Complete** |
| Independent selectors removed only where appropriate; sidebar/routes intact | Schedule/DPR/Site Updates/etc. each still keep their own required, module-specific project filter (not removed) alongside the shared context — a deliberate, documented choice (#62), not duplication. | None found. | — | **Complete** |
| Mock vs. real project data | `ProjectsAdapter` wraps `mockProjects` — **confirmed demonstration-mode data**, not a real backend. 69+ call sites across the app still import `mockProjects` directly rather than through the adapter (#44) — migration incomplete, tracked as explicit follow-up, not risked as a blind mechanical sweep without `tsc` available. | Direct-import call sites bypass the Component→hook→adapter boundary the rest of the app follows. | A real `tsc`/build-checked mechanical migration — needs an environment where that can be verified (not this sandbox). | **Partially complete** — **Needs verification** once a real build is available |

### Backend and Data Persistence Audit

| Area | Finding |
|---|---|
| Mock vs. real backend | **Confirmed this pass**: all 29 adapters in `src/lib/api/adapters/` are in-memory mock implementations over plain arrays/`localStorage` (auth session, project selection, theme, language). Exactly one file (`http-client.ts`, #52) is a REST-client *foundation* — written ahead of any backend, imported by nothing yet. **There is no real backend anywhere in this codebase.** |
| What persists across a real session vs. what doesn't | Browser `localStorage`: selected project, theme, language, auth session token. Everything else (every business record — Leads, Contracts, POs, GRNs, DPRs, Payments, etc.) lives only in an in-memory JS array per adapter module — **a full page reload or server restart loses all of it.** This is the single biggest gap underlying nearly every "Blocked" row above. |
| Documented backend requirements | Already specified in detail: `docs/API_CONTRACTS.md` (105KB, endpoint-by-endpoint, including the Store MR `/issue` 8-step transaction and the DPR `PATCH` reconciliation contract), `docs/openapi.yaml` (290KB OpenAPI spec), `docs/DATA_MODELS.md`, `docs/BACKEND_CLAUDE_HANDOFF.md`. Nothing here needs to be re-documented — it already exists at the depth the brief asks for. |

---

## Summary counts

- **Complete:** the clear majority of named sub-requirements across Vendor Management, ACE, GSTR, Fixed Assets, Cost-to-Complete's calculation logic, and the Global Project Selector.
- **Partially complete:** Contract numbering/package-criteria readings, GRN over-receipt check, Store MR/Stock reconciliation (by design), Schedule monthly-breakdown rules, CTC's supply-vs-service split, Project adapter migration.
- **Not implemented (real gaps, not documentation gaps):** PO→vendor email dispatch (mocked), Store MR stock-ledger write (mocked), automated lead ingestion beyond the website form (all three other "sources" are manual classification, not integrations).
- **Blocked on business/owner input:** Lead pipeline vocabulary (#3), Contract internal-approval reading (#43), Vendor Scorecard weighted formula (#87b, correctly declined pending sign-off), Schedule monthly-breakdown mandate (#50a/b), CTC supply/service split taxonomy (#39e), Cost Management (#4, by explicit owner instruction).
- **Blocked on backend/infrastructure:** real file storage (Documents), real email dispatch (PO), a real atomic stock-ledger transaction (Store MR), real persistence for every business record (everything is mock/in-memory today), running any of the 17 test files (no `npm` registry access in this sandbox all engagement).

## What this report does *not* do

Per the brief's own Phase 1 instruction, **no files were changed this pass.** The three genuine, currently-open frontend-safe gaps worth prioritizing first (none require a backend to attempt safely) are:

1. **GRN over-receipt guard** — add a check in `GRNAdapter.create` that received quantities summed across all GRNs against one PO line don't exceed what was ordered, mirroring the kind of guard Requisition/RFQ/PO already have elsewhere.
2. **PO Release/Issue permission split** — decide whether `po:release` should be its own permission key, separate from `po:issue`.
3. **Contract-number counter scoping confirmation** — a documentation/confirmation task, not code, but blocks closing #71 cleanly.

Everything else genuinely needs either a business decision (owner) or backend infrastructure before more frontend code is the right next step — building further mock simulation on top of those would not move BrickBasket closer to the real requirement, it would just add more code to later discard.

**Tell me which of the above to act on and I'll move to Phase 3 (implementation) for exactly those, incrementally, with tests after each change** — per the brief's own instruction not to implement unconfirmed gaps.
