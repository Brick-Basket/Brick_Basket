# WORKFLOWS

State machines and multi-step business processes, populated module-by-module as each part ships (see `docs/PART_PROMPTS.md`).

## Lead pipeline (Part 4)

**CONFIGURABLE — pending confirmation, see `docs/OPEN_QUESTIONS.md` #3.** The owner requirements confirm lead *sources* (website, social media, calls/WhatsApp, personal reference) but not a finished pipeline vocabulary. The frontend implements a 5-stage demo pipeline so the module is fully exercisable end to end; the backend owns the authoritative status enum, and `src/types/domain/lead.ts`'s `LeadStatus` union is what changes to match it once confirmed.

```
new ──▶ contacted ──▶ qualified ──┬──▶ converted
                                    └──▶ lost
```

Rules implemented today:
- Any status is reachable from any other status via the table row's Kanban-card `Select` or the detail drawer's status control — the frontend does not currently restrict transitions (e.g. it does not block moving a `converted` lead back to `new`). This is a frontend scoping decision, not an owner-confirmed rule; tighten it here once the backend defines which transitions are actually valid.
- Every status change is confirmed via `ConfirmationDialog` before it's committed, and automatically appends a `LeadActivity` of `type: "status_change"` to that lead's follow-up log (`POST /api/leads/:id/status`, see `docs/API_CONTRACTS.md`) — so the pipeline history is always reconstructable from the activity log even though `Lead` itself only stores the current status.
- `converted` is where a lead becomes a `Customer`/`Project` — that transition itself (creating the downstream Customer/Project/Contract records) is **not implemented yet**; it belongs to Contract Management (Part 5). Today, marking a lead `converted` only changes its own status.

## Lead assignment (Part 4)

Any staff user (not `customer`) can be assigned to a lead via the create/edit form (`assignedTo`, `UpdateLeadInput`) or left unassigned (`null`). Assignment has no workflow of its own today (no notification, no "my leads" auto-filter beyond the `assignedTo` list filter) — see `docs/OPEN_QUESTIONS.md` #10 for notification-channel scope.

## Contract acceptance state machine (Part 5)

**Partially CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #3 and #21 (new).** The owner requirements confirm: a predefined line-item category dropdown, editable quantities, admin "send for acceptance," customer "review/accept," acceptance/audit history, and a read-only state after final acceptance. They do **not** define a decline/revision path — `"declined"` and the admin `withdraw` action below are FRONTEND IMPLEMENTATION DECISIONS, needed for the module to be a usable end-to-end demo, not owner-confirmed business rules.

```
                 ┌──────────────────────────┐
                 │                          │
                 ▼                          │
   draft ──send──▶ sent_for_acceptance ──accept──▶ accepted  (read-only, final)
     ▲                    │  │
     │                    │  └──decline──▶ declined
     └───withdraw─────────┘                   │
     └───────────────revise (edit)────────────┘
```

Rules implemented today:
- `create` always starts a contract at `draft`. Only `draft` and `declined` contracts can be edited (`ContractsAdapter.update`) — `sent_for_acceptance` and `accepted` are locked to protect what the customer is looking at (or already agreed to).
- Admin `sendForAcceptance`: `draft → sent_for_acceptance` only. Admin `withdraw`: `sent_for_acceptance → draft` only — lets admin correct a mistake before the customer responds, without needing to delete and recreate anything.
- Customer `respond`: `sent_for_acceptance → accepted` or `sent_for_acceptance → declined` only; `declined` optionally carries a free-text `declineReason`.
- **Revising a declined contract resets its status to `draft`** (`ContractsAdapter.update`, when called against a `declined` contract) — a frontend decision so a revised contract has a normal path back through "Send for Acceptance" rather than a dead end. `declineReason` and `respondedAt` are cleared at that point.
- `accepted` is genuinely terminal in this frontend — no UI path reopens it, matching "read-only state after final acceptance unless backend allows revision." If the backend does allow post-acceptance revision, that needs a new transition here, not a client-side workaround.
- Every transition appends a `ContractAuditEntry` (`docs/DATA_MODELS.md`) — the acceptance/audit history is always reconstructable from that log, the same pattern Lead status changes use.
- The customer portal (`/dashboard/contracts`) filters out `draft` contracts client-side before rendering, since a draft was never sent — **this is a frontend safeguard only**; the real backend's customer-facing list/detail endpoints must never return a draft contract to a customer in the first place (see `docs/API_CONTRACTS.md`).

### Does admin "send" count as BrickBasket's own acceptance? (Phase 5, post-Part-20 stabilization pass — TBD, do not silently resolve)

The owner's own wording is: *"BrickBasket sends contract. Customer accepts. Once both accept, it is stored in admin/customer modules."* That names **two** acceptances — BrickBasket's and the customer's — but the owner requirements never define what a distinct "BrickBasket accepts" action looks like, separate from sending.

This build's `ContractStatus` vocabulary above has no separate `brickbasket_accepted`/`company_accepted` state — it reads `sendForAcceptance` itself as satisfying BrickBasket's half of "both accept" (an admin only sends a contract once its own terms are finalized and approved internally, so the act of sending already represents BrickBasket's commitment to those terms), leaving `respond("accepted")` as the customer's half. **This interpretation is a frontend assumption, not an owner-confirmed one** — it was never made explicit anywhere in this app's docs until now, despite already being baked into the implemented state machine since Part 5.

Two ways this could be wrong, left open rather than silently picked:
1. A distinct internal "BrickBasket accepted this contract" step might be required **before** `sendForAcceptance` even becomes available — e.g., someone senior signs off, then it sends. Nothing here currently gates sending on a separate internal approval.
2. "Both accept" might instead mean BrickBasket must take a **second, explicit acceptance action after** the customer accepts (e.g., a final countersign) before the contract is genuinely final — today, `accepted` is immediately terminal the moment the customer responds, with no BrickBasket-side step afterward.

Nothing here is irreversible in a way that would block adding either interpretation later: `sent_for_acceptance` and `declined` both already have a documented revision path back to `draft` above, and `accepted` is the only hard-terminal state. If the backend's real workflow needs a distinct BrickBasket-acceptance state (before or after the customer's), it is a new `ContractStatus` value plus one new transition on `ContractsAdapter` — not a restructuring of what's here. Confirm with the client which of the three readings (send-is-acceptance, pre-send internal approval, or post-customer countersign) is correct; until then, treat `docs/openapi.yaml`'s `ContractStatus` enum and `POST /api/contracts/:id/send-for-acceptance` as this frontend's best guess, not a locked contract.

## Document versioning + visibility (Part 6)

No formal state machine — `Document` has no status field beyond `version: number` (see `docs/OPEN_QUESTIONS.md` for why none was invented). Two simple, always-available admin actions instead of transitions:

- **Upload new version** (`documents:write`): `DocumentsAdapter.uploadNewVersion` archives the current version's metadata into `DocumentVersion[]`, then bumps `Document.version` by 1 and applies the new file metadata (and a new object URL, if a real file was chosen — see `docs/FILE_UPLOADS.md`). Available on every document, at any time, to any admin holding `documents:write`; there is no draft/review step around a version upload.
- **Toggle customer visibility** (`documents:write`): flips `Document.visibleToCustomer`, taking effect immediately — there is no approval step and no notification to the customer when a document becomes visible (see `docs/OPEN_QUESTIONS.md` #10 for notification-channel scope generally).

The customer portal (`/dashboard/documents`) enforces two read-only scoping rules client-side, as a frontend safeguard only — **the real backend's customer-facing endpoint must enforce both server-side regardless** (see `docs/API_CONTRACTS.md`):

1. Always queries with `visibleToCustomer: true` — a customer never sees an internal-only document, no matter what.
2. Always scoped to the project currently selected in the global `ProjectSelector` (`ProjectContext`) — the first module screen to actually filter data by "current project" rather than just display it (see `docs/OPEN_QUESTIONS.md` #19, which still applies: the underlying project↔customer ownership is mock/placeholder until a real Project entity exists).

## Requisition review workflow (Part 8)

**CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #3 and #29.** The owner requirements say only that a requisition "flows to admin/purchaser" for review and that draft/submitted/approved/rejected-style states apply "only if configurable" — neither the exact vocabulary nor a single- vs. two-level approval model is owner-confirmed. This frontend implements a single-step approval, deliberately mirroring the shape of the Contract acceptance state machine (Part 5) above rather than inventing a different pattern:

```
                 ┌──────────────────────────┐
                 │                          │
                 ▼                          │
   draft ──submit──▶ submitted ──approve──▶ approved  (terminal — RFQ Management, Part 9, picks up from here)
                          │
                          └──reject──▶ rejected
                              │
                              └───revise (edit) — resets to draft
```

Rules implemented today:
- `create` always starts a requisition at `draft`. Only `draft` and `rejected` requisitions can be edited (`RequisitionsAdapter.update`) — `submitted` and `approved` are locked.
- **Who does what**: raising a requisition (`create`, `submit`) requires `requisitions:create`, held by `admin` and `project_manager`. Deciding it (`decide` → `approved`/`rejected`) requires `requisitions:approve`, held by `admin` and `purchaser` — a deliberately distinct capability from `requisitions:create`, since the owner text names a review step separate from raising the request (see `docs/ROLES_AND_PERMISSIONS.md`). Neither role can review its own submission on the frontend today by way of `purchaser` never holding `requisitions:create` — but `admin` holds both, so this is a UI-level convenience, not a real segregation-of-duties control; the backend should decide whether self-review needs blocking.
- `submit`: `draft → submitted` only.
- `decide`: `submitted → approved` or `submitted → rejected` only; `rejected` optionally carries a free-text `rejectReason`.
- **Revising a rejected requisition resets its status to `draft`** (`RequisitionsAdapter.update`, when called against a `rejected` requisition) — the same frontend decision Contract Management made for declined contracts (Part 5). `rejectReason` and `decidedAt` are cleared at that point.
- `approved` is terminal in this frontend — RFQ Management (Part 9) picks up from an approved requisition's `MaterialRequirement[]`, per the roadmap. **Implemented**: the Requisition detail page now shows a "Create RFQ" link (gated by `rfq:compare`) once a requisition is `approved`, or a "View RFQ" link (gated by `rfq:read`) once one exists — see below.
- Every transition appends a `RequisitionAuditEntry` (`docs/DATA_MODELS.md`) — the review history is always reconstructable from that log, the same pattern `ContractAuditEntry`/`LeadActivity` use.

## RFQ comparison & finalization (Part 9)

**CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #3 and #30.** The owner requirements name "Approval/readiness state" for this module without a vocabulary, and "Vendor selection" without saying whether it's one choice for the whole RFQ or per line. This frontend implements a two-state readiness flag and per-line vendor selection:

```
   draft (comparison in progress) ──finalize──▶ finalized  (terminal — Purchase Orders, Part 10, picks up from here)
        │        ▲
        │        │
        └── add/update/remove vendor quotes, select/deselect a vendor per line, edit the applicable tax rate ──┘
```

Rules implemented today:
- `create` (`rfq:compare`) can only be called against a requisition whose `status === "approved"` and that doesn't already have an RFQ (`RFQAdapter.create` rejects both cases) — pulls that requisition's `MaterialRequirement[]` into `RFQLine[]`, snapshotting each predefined line's `ACEItem.rate` at that moment (a cross-adapter call to `requisitionsAdapter`/`aceAdapter`, never a direct mock-data import — see `docs/DATA_MODELS.md`'s RFQ section).
- While `status === "draft"`: vendor quotes can be added (`setVendorQuote`, capped at 3 distinct vendors per line), updated (same method, upserts), or removed (`removeVendorQuote`) for any line; a vendor can be selected or deselected per line (`selectVendor`) from among that line's quoted vendors only; the RFQ's `taxPercent` can be edited (`update`).
- **L1 is a computed highlight, not an enforced choice** — the purchaser may select any quoted vendor for a line, not only the lowest-rate one (`computeL1Quote` vs. `RFQLine.selectedVendorId` are independent). "% savings over ACE," "Tax" and "Total" are computed against the **selected** vendor once one is chosen, falling back to L1 beforehand (`pickReferenceQuote`) — a **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #30.
- `finalize` (`rfq:compare`) requires every line to have a `selectedVendorId` set, and only succeeds from `status: "draft"` (`409`-equivalent otherwise). Once `finalized`, quotes, selections and the tax rate are all locked — no UI path reopens it, matching the "terminal, ready for the next module" framing every other terminal status in this app uses (Contract's `accepted`, e.g.).
- No dedicated audit-log entity was added for RFQ (unlike every other module so far) — the owner's Part 9 bullet list doesn't ask for a "History" section the way Requisition's does (§5B); `createdAt`/`updatedAt`/`finalizedAt` are the only trail kept. A **frontend scoping decision**, not a gap — revisit if the client asks for one.
- All rates, amounts, savings and totals shown are demo/mock values — never real vendor pricing — per the owner's explicit instruction not to hardcode sample monetary values as real client data (§5C); every RFQ screen carries a visible disclaimer to that effect.

## Purchase Order lifecycle (Part 10)

**CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #3 and #31.** The owner requirements confirm three named milestones for this module — "two-level approval workflow," "Release state," "Issue state" — plus "Generate PO with terms & conditions," an "email dispatch status placeholder," and an "Audit trail." They do **not** confirm the exact status vocabulary between those milestones, who decides Release vs. who decides Issue, or how many Purchase Orders come out of one RFQ. This frontend implements the full state machine below:

```
                                  ┌────────────────────────────────────────────┐
                                  │                                            │
                                  ▼                                            │
   draft ──submit──▶ pending_approval_l1 ──approve(L1)──▶ pending_approval_l2 │
     ▲                        │                                    │          │
     │                        └──reject(L1)──▶ rejected ◀──reject(L2)──┘      │
     │                                            │                           │
     └───────────────revise (edit terms/tax)──────┘                           │
                                                                               │
                                                   approve(L2)                 │
                                                       │                      │
                                                       ▼                      │
                                                   approved ──release──▶ released ──issue──▶ issued
                                                                                                (terminal)
```

Rules implemented today:
- `create` (`po:create`) can only be called against an RFQ whose `status === "finalized"`, targeting one vendor's selected lines among that RFQ's `RFQLine[]` (`PurchaseOrdersAdapter.create` rejects a non-finalized RFQ, a vendor with no selected lines, and any line already claimed by another PO on that RFQ) — snapshots each claimed line's description/UOM/quantity and that vendor's quoted rate into `PurchaseOrderLineItem[]` (a cross-adapter call to `rfqAdapter`, never a direct mock-data import — see `docs/DATA_MODELS.md`'s PurchaseOrder section).
- **One PO per distinct vendor within a finalized RFQ, never one PO per RFQ** — a **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #31. RFQ Management (Part 9) already models vendor selection per line, so a single finalized RFQ can have several different selected vendors across its lines; the RFQ detail page shows one "Create PO" / "View PO" action per distinct vendor group.
- While `status === "draft"` or `"rejected"`: terms & conditions and the tax rate can be edited (`update`) — editing a `rejected` PO resets it to `draft` (`rejectedAtLevel` cleared), the same frontend decision Contract Management (Part 5) and Purchase/Material Requisition (Part 8) made for their own decline/reject-then-revise paths.
- `submit` (`po:create`): `draft → pending_approval_l1` only.
- `decideLevel1` (`po:approve:level1`, held by `finance`/`approver`/`admin`): `pending_approval_l1 → pending_approval_l2` (approved) or `pending_approval_l1 → rejected` with `rejectedAtLevel: 1` (rejected), optionally with a free-text comment either way — recorded as an `Approval` entry (`docs/DATA_MODELS.md`), never inline on the PO itself.
- `decideLevel2` (`po:approve:level2`, held by `approver`/`admin`): `pending_approval_l2 → approved` or `pending_approval_l2 → rejected` with `rejectedAtLevel: 2` (rejected), same comment/`Approval`-entry treatment. **Level 1 and level 2 are deliberately distinct capabilities** — `finance` holds only level 1, `approver` holds both, `admin` holds both — see `docs/ROLES_AND_PERMISSIONS.md`.
- `release` (`po:issue`, held by `purchaser`/`admin`): `approved → released` only. `issue` (`po:issue`): `released → issued` only, and also sets `emailDispatchStatus: "sent"` / `emailDispatchedAt` — the owner's "email dispatch status placeholder," mocked as sent immediately rather than modeling an async send/retry/failure flow. **FRONTEND IMPLEMENTATION DECISION** — there is no separate `po:release` permission key, so both Release and Issue are gated by the same `po:issue` capability; revisit if the client wants them split across two roles. See `docs/OPEN_QUESTIONS.md` #31.
- `issued` is genuinely terminal — no UI path reopens it, matching every other terminal status in this app (RFQ's `finalized`, Contract's `accepted`, e.g.).
- Every transition appends a `PurchaseOrderAuditEntry` (`docs/DATA_MODELS.md`) — the "Audit trail" explicitly required by this module, reconstructable independently of the `Approval` records (which capture only the two approval decisions, with their comments).
- The required `ApprovalTimeline` component (`src/components/po/approval-timeline.tsx`) renders this whole lifecycle as 6 sequential steps (Draft → Submitted → Level 1 → Level 2 → Released → Issued), with a rejection at either level shown as its own terminal step rather than a dead position on the happy path.
- Terms & conditions editing was kept **inline** on the PO detail page (matching RFQ's inline tax-edit pattern from Part 9), rather than a dedicated `/[id]/edit` route like Contract/Requisition use — a **FRONTEND IMPLEMENTATION DECISION** reflecting that a PO's editable-while-draft/rejected surface is just two fields (terms, tax), the same scale as RFQ's single-field case rather than Contract/Requisition's multi-field forms. See `docs/OPEN_QUESTIONS.md` #31.

## Store Management: GRN receipt (Part 11)

**CONFIGURABLE in the sense of open scope questions — see `docs/OPEN_QUESTIONS.md` #11, #32.** The owner requirements (§6A) name the fields a GRN must show but not a workflow around it — this frontend implements GRN as a simple capture-and-view record with one rule:

```
   PurchaseOrder(issued) ──record GRN──▶ GRN + GRNLineItem[]   (no status of its own; editable any time via GRNAdapter.update)
```

Rules implemented today:
- `create` (`grn:create`) can only be called against a `PurchaseOrder` whose `status === "issued"` (`GRNAdapter.create` rejects any other status) — a cross-adapter call into `purchaseOrdersAdapter` to confirm this and to snapshot each targeted line's description/UOM/ordered quantity/rate into `GRNLineItem[]` (see `docs/DATA_MODELS.md`'s GRN section).
- **More than one GRN may be recorded against the same PO** — a real delivery is often split across trucks/dates. This build does **not** validate that the sum of `receivedQuantity` across a line's GRNs stays within its `orderedQuantity`; that check is left for the backend once the client's real over-receipt policy is confirmed (`docs/OPEN_QUESTIONS.md` #32).
- `update` (`grn:create`) edits received quantities/brand/warranty-certificate-number per line, plus the received date and notes — always available, with no status gate, since a GRN has no lifecycle to protect (unlike Contract/Requisition/PO's draft-only-editable rule). A line can't be added to or removed from an existing GRN via `update` — record a separate GRN instead.
- No audit-log entity was added for GRN (unlike Requisition/Contract/PO) — the owner's Part 11 requirements don't ask for a "History" section the way those modules' do. A **frontend scoping decision**, not a gap.
- The RFQ→PO cross-link pattern (Parts 9–10) extends here: once a PO is `issued`, its detail page shows a "Goods Receipt Notes" card listing any GRNs already recorded against it plus a "Record GRN" action (`grn:create`); a GRN's detail page links back to its source PO.

## Store Management: Stock Statement + Wastage (Part 11)

Both `StockEntry` and `WastageEntry` are plain, manually-maintained log records with no status field and no workflow — the owner requirements (§6C, §6D) ask for tracking/capture, not a review process. Both follow `ACEItem`'s Part 8 "flat record" pattern: a single list page with filters plus a create/edit `Dialog` (`stock:write`/`wastage:write`), no dedicated `/new` or `/[id]` routes.

- **Stock is not automatically populated from GRN.** `GRNLineItem` snapshots a free-text description/UOM from its source `PurchaseOrderLineItem`, which doesn't reference the closed `StockMaterial` union `StockEntry` uses — without a confirmed mapping between "a PO line's material" and "which `StockMaterial` bucket it falls into," this build keeps Stock as a manually-entered daily ledger rather than guessing at an automatic link. See `docs/OPEN_QUESTIONS.md` #32. `closingStock` is always computed (`openingStock + receivedToday - consumedToday`), never stored.
- **Wastage has no automatic "above scope" detection.** The owner's threshold rule ("materials procured above defined scope") is not defined (`docs/OPEN_QUESTIONS.md` #12, still open) — a wastage entry is logged whenever a person (`wastage:write`) judges material to be over-scope; nothing here compares against ACE/Requisition quantities automatically. The required "summary" view (`WastageSummary`) aggregates the full entry list by material — total quantity, total value, entry count — computed client-side, never stored; the required "detail" view is the plain paginated entry table. A toggle between the two, on one page, mirrors Document Management's Warranty Mapping/All Documents toggle (Part 6).
- Neither module has a customer-facing surface — the owner requirements don't call for one.

## MRC acceptance state machine (Part 12)

**Partially CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #6 and #33.** The owner requirements confirm materials-used/make/warranty-terms fields, a customer-acceptance state, and a link back to the Customer module. They do **not** confirm where acceptance happens, or a decline/revision path — this frontend deliberately mirrors Contract Management's Part 5 state machine rather than inventing a different shape:

```
                 ┌──────────────────────────┐
                 │                          │
                 ▼                          │
   draft ──issue──▶ issued ──accept──▶ accepted  (read-only, final)
     ▲                    │  │
     │                    │  └──decline──▶ declined
     └───withdraw─────────┘                   │
     └───────────────revise (edit)────────────┘
```

Rules implemented today:
- `create` (`mrc:issue`) always starts an MRC at `draft`, and validates the target `customerId` exists (a cross-adapter call into `customersAdapter`, never its mock file directly). Only `draft` and `declined` MRCs can be edited (`MRCAdapter.update`) — `issued` and `accepted` are locked, the same protection Contract gives an in-flight/accepted contract.
- Each line is built (in `create`/`update`) by a shared `buildLineItems` step: a `source: "grn"` line calls `grnAdapter.getLineItem` (a cross-adapter call, never its mock file directly) to snapshot description/UOM/make and reject a quantity greater than what was actually received; a `source: "manual"` line is taken as typed.
- Admin `issue` (`mrc:issue`): `draft → issued` only. Admin `withdraw` (`mrc:issue`): `issued → draft` only — same "fix a mistake before the customer responds" escape hatch Contract's `withdraw` gives.
- Customer `respond` (`mrc:accept`): `issued → accepted` or `issued → declined` only; `declined` optionally carries a free-text `declineReason`.
- **Revising a declined MRC resets its status to `draft`** (`MRCAdapter.update`, when called against a `declined` MRC) — the same frontend decision Contract (Part 5) and Requisition (Part 8) made for their own decline/reject-then-revise paths. `declineReason` and `respondedAt` are cleared at that point.
- `accepted` is genuinely terminal — no UI path reopens it, matching every other terminal status in this app (Contract's `accepted`, RFQ's `finalized`, PO's `issued`).
- **No dedicated audit-log entity** — the same scope reduction already applied to RFQ (Part 9) and GRN (Part 11); the owner's Part 12 bullet list doesn't ask for a "History" section. `createdAt`/`updatedAt`/`issuedAt`/`respondedAt` are the only trail kept.
- **Resolving `docs/OPEN_QUESTIONS.md` #6 for this build**: acceptance happens in the customer portal only (`/dashboard/mrc/[id]`, gated by `mrc:accept`) — there is no admin-side accept/decline action, mirroring Contract's admin-issues/customer-responds split. Not an owner-confirmed answer; revisit if the client wants a concurrent or admin-side path.
- The customer portal (`/dashboard/mrc`) filters out `draft` MRCs client-side before rendering, the same frontend safeguard `/dashboard/contracts` uses — the real backend's customer-facing endpoints must never return a draft MRC to a customer in the first place.
- The GRN→PO→…→MRC cross-link pattern (Parts 8–11) extends here in one direction only: `GRNDetail` shows a "Record MRC" action (`mrc:issue`) linking to `/admin/stores/mrc/new`. Unlike every earlier hand-off in this chain, it does **not** pre-seed the new MRC's lines from that specific GRN, and there is no reverse "which MRCs already certify this GRN's lines" lookup — both **frontend scoping decisions**, see `docs/OPEN_QUESTIONS.md` #33.

## Project Schedule tracking (Part 13)

**Fully CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #34.** The owner requirements name the fields an activity must show (activity, UOM, quantity, planned start/end) and ask for a Gantt-style visual with "pro-rata progress-to-green" and delay tracking, but confirm no formula for either computed value and no activity lifecycle. This frontend implements two plain record types plus a set of pure, render-time computations — no workflow/state machine, unlike Contract/Requisition/PO/MRC:

```
   ScheduleActivity (plannedStart/plannedEnd/quantity, no status)
        │
        └──record progress──▶ ScheduleProgressEntry[]  (append-only, cumulative executedQuantity as-of recordedAt)
                │
                └──render time──▶ percentComplete, expectedPercent, delayDays, ScheduleProgressState
                                   (computed only — never stored, per docs/STATUS_DEFINITIONS.md)
```

Rules implemented today:
- `create`/`update` (`schedule:write`) manage a `ScheduleActivity`'s own fields; `sequence` is auto-assigned by the adapter (next integer for that project) when omitted, so a newly-added activity always lands at the end of the Gantt/table ordering unless the caller sets it explicitly.
- `addProgress` (`schedule:write`) appends a `ScheduleProgressEntry` — the reading is the **cumulative executed quantity as of that date**, not an incremental delta; the latest entry by `recordedAt` is always "current progress" (`getExecutedQuantity`). There is no update/delete on a progress entry and no cap against the activity's planned `quantity` — a person can record over-execution, and this build does not flag it.
- `getExpectedPercent` computes a straight-line, elapsed-time pro-rata expectation between `plannedStart` and `plannedEnd` as of today; `getPercentComplete` divides the latest `executedQuantity` by the activity's planned `quantity` (clamped 0–100). Neither formula is owner-confirmed — a more sophisticated "projected finish date from current execution rate" approach was explicitly considered and rejected as needing a formula the owner hasn't confirmed.
- `getDelayDays` is simply `today − plannedEnd` in days, and only counts once `percentComplete < 100` and `today` is past `plannedEnd` — otherwise `0`.
- `getProgressState` derives one of `not_started`/`behind`/`on_track`/`overdue`/`completed` from the above (see `docs/STATUS_DEFINITIONS.md`) for the table's status badge and the Gantt bar's fill color.
- The Gantt chart's date range is computed dynamically from `min(plannedStart)`/`max(plannedEnd)` across whichever activities are currently loaded — never a hardcoded date window — per the owner's explicit "dynamic range" requirement.
- No `Pagination` control and no "All projects" option on the project filter — a Gantt needs every activity for one project visible together, so the page always loads a large fixed page size for exactly one selected project at a time; both **frontend scoping decisions**, see `docs/OPEN_QUESTIONS.md` #34.
- No customer-facing surface — the owner requirements place this under Project Management (admin-only); there is no `/dashboard/schedule`.
- **Monthly planned-quantity breakdown, added post-Part-20 stabilization pass (Phase 3)**: an activity may optionally carry a `monthlyPlan` — one planned quantity per "YYYY-MM" month across its own `plannedStart`–`plannedEnd` range, validated to sum to exactly `quantity` once any month is filled in (`validateMonthlyPlan`), both in `ScheduleActivityForm` (live total + inline error, blocks submit) and in `ScheduleAdapter.create`/`update` (the same check re-run, since a real backend must enforce it independently). An empty breakdown remains fully valid — this is opt-in per activity, not a new requirement on every existing one. Shown read-only in a new collapsible `ScheduleMonthlyPlanTable` below the Gantt/table, not as extra columns on the main table — see `docs/DATA_MODELS.md`'s `ScheduleMonthlyPlanEntry` section and `docs/OPEN_QUESTIONS.md`.
- **Visible delay-in-days display, added post-Part-20 stabilization pass (Phase 3)**: `getDelayDays` (Part 13) was always computed but never actually shown anywhere — the table and Gantt only ever conveyed "overdue" via bar/badge color. Now surfaced as a "Delay" column in `ScheduleTable`, a small "+Nd" badge next to the activity name in `ScheduleGanttChart` (title-attribute tooltip spells it out), and a "N days delayed" line next to the status badge in `ScheduleProgressSheet` — all reading the same `getDelayDays` computation, so the three views can never disagree about an activity's delay.
- **Bulk progress fetch, added post-Part-20 stabilization pass (Phase 3)**: `useScheduleProgressMap` used to call `ScheduleAdapter.listProgress` once per visible activity via `Promise.all` — an N+1 pattern, harmless against this in-memory mock but N real HTTP round-trips against a backend. Replaced with one call to a new `ScheduleAdapter.listProgressForActivities(activityIds)`, returning the identical `Map<activityId, ScheduleProgressEntry[]>` shape in a single round trip — no change needed in `ScheduleTable`/`ScheduleGanttChart`, which only ever consumed the resulting map.

## Daily Progress Report (DPR) capture + Schedule push (Part 14)

**CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #35.** The owner requirements (§7C) name the DPR's two tables (manpower; work items with Sl. No./Work Item/Location/Unit/Planned/Previous/Today's/Cumulative/% Complete/Remarks) and say it "is linked to schedule tracking so quantity ... updates affect progress and delays," but confirm no data model, no formula for previous/cumulative, and no exact rule for how a DPR update should move `ScheduleProgressEntry`. This build implements:

```
   DPR (projectId, reportDate, notes — no status)
        ├──▶ DPRManpowerEntry[]  (exactly 8, one per DPRManpowerCategory, zero-filled when unused)
        └──▶ DPRWorkItemEntry[]  (dynamic rows; todayQty is an INCREMENTAL delta, unlike Schedule's cumulative model)
                │
                ├──render time──▶ previousQty, cumulativeQty, percentComplete
                │                  (computed from every earlier DPRWorkItemEntry for the same work item
                │                   in the same project — a DPR-only ledger, never stored)
                │
                └──optional scheduleActivityId──▶ pushes a new ScheduleProgressEntry on submit:
                                   executedQuantity = (that activity's own latest executedQuantity) + todayQty
```

Rules implemented today:
- `create`/`update` (`dpr:write`) save a `DPR` plus its full manpower (always exactly 8 rows) and work-item line sets in one call — matching the "form + editors, submit together" shape of `MRCForm`/`ContractForm`, not a separately-saved sub-resource.
- `projectId` is immutable after creation (`UpdateDPRInput` excludes it), matching every other project-scoped entity's edit rules. No enforced "one DPR per project per day" uniqueness — backend-owned, and this build allows more than one, the same looseness `GRN` already has against a single `PurchaseOrder`.
- `todayQty` on a work-item line is a **incremental delta** — how much was executed *that day* — a deliberate departure from `ScheduleProgressEntry.executedQuantity`'s cumulative-as-of-date model (Part 13), because the owner's table names "Today's Qty." and "Cumulative Qty." as two separate columns. `getPreviousQty`/`getCumulativeQty`/`getPercentComplete` (`dpr-work-item-math.ts`) compute the other two columns at render/preview time from every other DPR's lines for the same work item in the same project, excluding the DPR currently open (so re-editing today's own report never double-counts itself).
- **DPR → Schedule Tracking link**: a work-item line may optionally carry a `scheduleActivityId`. On `create`/`update`, `dprAdapter` calls `scheduleAdapter.get`/`listProgress`/`addProgress` (its own public methods, never its mock arrays) to push `executedQuantity = (that activity's own latest executedQuantity) + todayQty` as a new `ScheduleProgressEntry`, dated `dpr.reportDate`. This is deliberately **not** the DPR line's own computed cumulative — pushing the activity's own prior figure plus today's delta avoids overwriting/regressing progress that activity already had before any DPR was linked to it. A stale or cross-project `scheduleActivityId` is skipped (the work-item line itself still saves) rather than failing the whole submission.
- **Fixed in the post-Part-20 stabilization pass (Phase 4, resolving `docs/OPEN_QUESTIONS.md` #35e)**: editing an already-submitted, Schedule-linked DPR line used to append *another* auto-recorded progress entry on every save, compounding the activity's cumulative executed quantity rather than correcting the earlier one. `ScheduleProgressEntry` gained an optional `source: { type: "dpr", key }` marker and a narrow `upsertProgressFromSource` adapter method that finds-and-replaces by that marker instead of always appending; every other, manually-typed `ScheduleProgressEntry` remains fully append-only, unaffected by this exception. The stable `key` is `workItemMasterId + location`, not the DPR line's own `id` (which is regenerated on every edit) — see `src/lib/api/adapters/dpr-adapter.ts`'s header comment for the full mechanism.
- **Further fixed in the BrickBasket final hardening pass** (the edge cases the Phase 4 fix above left flagged as known gaps): saving a DPR now *reconciles* its Schedule contributions rather than only pushing the new set. Four cases are all handled by the same mechanism: (1) a linked line **deleted** from the DPR on a later edit, (2) its `scheduleActivityId` **repointed at a different activity**, (3) its `workItemMasterId` **changed**, (4) its `location` **changed** — any of (2)-(4) changes which activity or which stable `source.key` a line's contribution belongs to, and in every one of these four cases the *previous* pairing's pushed entry is removed rather than left behind as an orphan. `ScheduleAdapter` gained a new `removeProgressBySource` method (mirroring `upsertProgressFromSource` — it can only ever match and remove an entry that carries a `source.type`/`source.key`, so a manually-typed entry is structurally unreachable and remains fully append-only), and `DPRAdapter.update()` computes the DPR's old vs. new linked `(activityId, sourceKey)` pairings and calls it for every old pairing that doesn't survive into the new set, before pushing the new set's entries via the existing `upsertProgressFromSource`. **The corresponding backend contract**: `PATCH /api/dprs/:id` must, as one transaction, save the DPR → determine its old vs. new set of DPR-owned Schedule contributions → create/update the new set's entries in place → remove any old-set entry that has no surviving match — see `docs/API_CONTRACTS.md`'s full step-by-step version of this contract. **Manually entered Schedule progress is never touched by any of this** — reconciliation only ever matches entries carrying this DPR's own `source` marker.
- The work-item picker cascades Category → Work Item from the static 77-item master list (`src/lib/constants/dpr-work-items.ts`); the four "Other ___ work" catch-all rows per category require a free-text `otherDescription` + `otherUom` instead of the master-derived, disabled UOM every other row gets.
- Read/written by `/admin/project-management/dpr` and its `/new`/`/[id]`/`/[id]/edit` routes — the "dedicated route set" pattern (matching MRC/GRN) rather than Schedule's single-page pattern, since the work-item + manpower tables need more room than a `Dialog`. No customer-facing surface — the owner requirements place this under Project Management (admin-only), same as Schedule.

## Project Cost Accounting (Part 15)

**CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #36.** The owner requirements (§8A) name the cost categories and a "budget/actual/variance view with over/under indicators," using clearly-labeled illustrative figures rather than the owner's own example numbers, and confirm no data model. This build implements:

```
   CostEntry (projectId, category, budgetAmount, actualAmount — no status)
        │
        ├──render time──▶ variance = budgetAmount − actualAmount
        │                  status = over | under | on_budget
        │                  (src/components/cost/cost-math.ts — never stored)
        │
        └──project summary──▶ Total Budget / Total Actual / Total Variance
                               + (when the project has ≥1 accepted Contract)
                               Contract Value + illustrative "Expected Profit"
                               (contract value − total actual, not owner-confirmed)
```

Rules implemented today:
- A flat, per-project, per-category record — no workflow/status, the same shape as `ACEItem`/`StockEntry`. `projectId` and `category` are both immutable after creation (`UpdateCostEntryInput` excludes both) — together they identify the row.
- `category` reuses `ContractCategory` (Part 5) rather than a new near-duplicate union — the third module to share it, after `Contract` and `ACEItem` (Part 8).
- `actualAmount` is manually entered on the form, not auto-aggregated from Payments/Receipts, since that module (Part 16) doesn't exist yet — **FRONTEND IMPLEMENTATION DECISION**.
- Variance and its over/under/on-budget status are always computed at render time from `budgetAmount`/`actualAmount` (`getVariance`/`getVarianceStatus` in `cost-math.ts`), never stored — the same "computed, not stored" convention as every derived money total elsewhere in this app.
- **Cost ↔ Contract cross-link**: the project summary (`CostSummary`) composes `useContracts()` (Part 5) directly — a render-time display aggregate, not a write-side side effect — to sum the `lineItems.quantity × rate` total of that project's accepted contracts (inlined per the existing convention; no shared contract-total helper exists) and show an illustrative "Expected Profit" (contract value minus total actual spend). This is a **FRONTEND IMPLEMENTATION DECISION** with no owner-confirmed formula, clearly labeled as such in the UI.
- Mock data uses illustrative, not the owner's example, figures, and deliberately covers all three variance states across two mock projects, plus a third project with zero entries to exercise the empty state.
- Read/written by a single `/admin/finance/project-cost` list-plus-Dialog page — the ACE/Stock/Wastage pattern (Part 8/11), not MRC/GRN/DPR's dedicated-route-set pattern, since a budget/actual/notes form fits comfortably in a Dialog. No customer-facing surface in this part (a read-only `/dashboard/payments` view is Part 16's job, per the `finance:read`-only `customer` permission already assigned in Part 3).

## Payments & Receipts + Bank & Cash (Part 16)

**CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #37.** The owner requirements (§8B) name "PO/vendor code/invoice details/invoice amount/invoice copy/payment details" and (§8C) a flat field list for Bank & Cash Management, confirming no data model and no workflow for either. This build implements:

```
   PurchaseOrder(issued) ──record invoice──▶ Invoice (vendorId/projectId denormalized, no status)
        │
        └──record payment──▶ Payment (direction: "payment", → Invoice)
                │
                └──render time──▶ Invoice.paymentStatus = unpaid | partially_paid | paid
                                   (sum of Payments referencing this invoice, never stored)

   Contract(accepted) ──record receipt──▶ Payment (direction: "receipt", → Contract)
                                            (shown read-only at /dashboard/payments)

   BankTransaction — flat ledger, optional paymentId cross-link, no workflow
```

Rules implemented today:
- `Invoice` can only be created against a `PurchaseOrder` whose `status === "issued"` — the same rule GRN applies to the same field (Part 11) — and denormalizes `vendorId`/`projectId` from it at creation, never a live join.
- The owner's single "payment details" bullet is modeled as its own entity (`Payment`), not a field on `Invoice`, so one invoice can be settled across more than one payment (the same "split delivery" reasoning GRN applied to POs). **FRONTEND IMPLEMENTATION DECISION.**
- `Payment` is `direction`-discriminated (`"payment"` vs `"receipt"`) rather than two separate entities, so the module can be named "Payments **& Receipts**" and the customer-facing `/dashboard/payments` view has something to show — the owner text only confirms the vendor/PO side. **FRONTEND IMPLEMENTATION DECISION.** A `"payment"` requires an `invoiceId` (denormalizing `vendorId`); a `"receipt"` requires a `contractId` whose `status === "accepted"` (denormalizing `customerId`) — enforced by `PaymentsAdapter.create`, a cross-adapter call into `invoiceAdapter`/`contractsAdapter`, never their mock files directly.
- `direction`, `projectId`, and the linked `invoiceId`/`contractId` are all immutable after creation (`UpdatePaymentInput` excludes them) — together they identify what the record is a payment/receipt *against*; only `amount`/`paymentDate`/`mode`/`referenceNumber`/`notes` can be edited afterward.
- `Invoice.paymentStatus` (unpaid/partially paid/paid) is never stored — always computed at render time from the sum of `"payment"`-direction `Payment` rows referencing that invoice (`getInvoicePaymentStatus`/`getTotalPaidForInvoice` in `src/components/payments/payment-math.ts`), the same "computed, not stored" convention `CostEntry`'s variance established (Part 15).
- **Bank & Cash Management has no confirmed relational model at all** — the owner's §8C bullet list is a flat set of field names to "prepare," not a workflow. This build keeps `BankTransaction` as its own flat, per-entry ledger record (no status), with an *optional* `paymentId` cross-link added as a **FRONTEND IMPLEMENTATION DECISION** for entries that do correspond to a modeled `Payment` — the mock data deliberately includes one standalone cash entry with no such link, no GSTIN, and `itcApplicable: false`, to keep the field list genuinely optional-by-default rather than implying every bank/cash movement traces back to a Payment.
- The invoice-copy field is metadata-only (`invoiceCopyFileName`/`invoiceCopyFileSizeBytes`) — no real file bytes are stored, a scaled-down version of `Document`'s file-metadata treatment (Part 6) without its versioning/preview machinery, since this module doesn't need either.
- Read/written by `/admin/finance/payments` (two tabs on one route — Invoices, then Payments & Receipts — the same toggle mechanic Wastage's Detail/Summary view used in Part 11, repurposed here to switch between two sibling record types) and `/admin/finance/bank-cash` (a single list-plus-Dialog page, the ACE/Stock/CostEntry pattern). The customer-facing `/dashboard/payments` is read-only, scoped to `direction: "receipt"` and the signed-in customer's own `customerId` — mirroring `/dashboard/mrc`'s read-only framing (Part 12), gated by the `finance:read`-only `customer` permission already assigned in Part 3.

## Taxes, Fixed Assets & GSTR (Part 17)

**CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #38.** The owner requirements (§8D/§8E/§8F) name three modules with very different levels of confirmed detail: Taxes & Statutory Accounting and Fixed Assets are named only by scope (plus, for Fixed Assets, the ₹5,000 threshold); GSTR names two categories with real linking rules. This build implements:

```
   TaxRecord — flat ledger (type, name, authority, amount, dueDate, paidDate?)
        └──render time──▶ TaxRecordStatus = paid | pending | overdue
                           (src/components/finance/tax-record-math.ts — never stored)

   FixedAsset — flat ledger (assetName, category, value > ₹5,000, status: active | disposed)

   GRN(purchase) ──record GSTR entry──▶ GSTRRecord (type: "purchase", grnId required)
   Contract(accepted) ──record GSTR entry──▶ GSTRRecord (type: "sales", contractId)
   (no contract) ──record GSTR entry──▶ GSTRRecord (type: "sales", saleDescription — materials sale)
        └──render time──▶ getTotalValue/getTotalTaxableValue/getTotalTax
                           (src/components/finance/gstr-math.ts — never stored)
```

Rules implemented today:
- `TaxRecord` and `FixedAsset` are both flat, fully-editable ledger records with no locked identity fields — the same no-confirmed-identity shape `BankTransaction` uses (Part 16), since neither module's owner text gives a pairing of fields to protect. `TaxRecordStatus` is always computed from `dueDate`/`paidDate`, never stored.
- `FixedAsset.value` is validated `> 5,000` (`FIXED_ASSET_MIN_VALUE`) client-side in `FixedAssetForm` — the one genuinely owner-confirmed business rule across all three of this part's modules. `status: "disposed"` reveals a "Disposed On" date field (`useWatch`); every other field, including `status` itself, stays editable after creation.
- `GSTRRecord.create` (`finance:write`) branches on `type`, both branches a **cross-adapter call**, never a direct mock-data import: for `"purchase"`, `grnId` is required and validated against `grnAdapter.get` (rejecting an unknown GRN), denormalizing `vendorId`/`projectId` from it; for `"sales"`, either `contractId` is given and validated against `contractsAdapter.get` (rejecting unless `status === "accepted"`, denormalizing `customerId`/`projectId`) or a free-text `saleDescription` is required instead (rejected if neither is given) — the owner's two named sales cases, "constructed house" (linked contract) and "materials, if any" (manual entry).
- `type`, `grnId`, and `contractId`/`saleDescription` are all immutable after creation — together they identify what the record reports on; only `period`/`taxableValue`/`taxAmount`/`gstin`/`invoiceReference`/`notes` can be edited afterward, mirroring `Payment`'s locked-identity convention (Part 16).
- `GSTRForm` takes a **locked `type` prop** rather than a switchable field like `PaymentForm`'s watched `direction` — the page's Purchase/Sales tab, not an in-form control, is what commits a new entry to a category. A **FRONTEND IMPLEMENTATION DECISION**, a deliberate simplification versus Part 16's `PaymentForm`.
- Read/written by `/admin/finance/taxes` and `/admin/finance/fixed-assets` (both single list-plus-Dialog pages, the ACE/Stock/CostEntry pattern) and `/admin/finance/gstr` (one route with Purchase/Sales tabs pinning `type` in the list params, reusing the Payments/Receipts tabbed-page mechanic from Part 16). No customer-facing surface for any of the three — the owner requirements place them under Finance (admin-only), same as Project Cost Accounting and Bank & Cash.
- **Cross-module wiring**: `GRNDetail` now also shows a "Record GSTR Entry" action (`finance:write`) alongside its existing "Record MRC" link — a one-way navigational link to `/admin/finance/gstr`, extending the ACE → Requisition → RFQ → PO → GRN → MRC pattern from Parts 8–12. It does **not** pre-seed the GSTR entry from that specific GRN, mirroring MRC's Part 12 precedent (`docs/OPEN_QUESTIONS.md` #33f) rather than RFQ/PO's pre-seeded query-param hand-offs.

## Cost-to-Complete + Cost Management placeholder (Part 18)

**Real business rules for one route, an explicit non-rule for the other — see `docs/OPEN_QUESTIONS.md` #39 and #4.** The owner's §8G text gives an actual formula and derivation rules for Cost-to-Complete; §8H explicitly forbids inventing anything for Cost Management pending a separate Excel spec from Pushkar Tiwari. This build implements:

```
   CostEntry.budgetAmount  ──▶ Original Estimate (A)
   CostEntry.actualAmount  ──▶ Completed till date (B)

   PurchaseOrder(status ≠ draft/rejected) ──▶ PurchaseOrderLineItem[]
        │  rfqLineId
        ▼
   RFQLine.aceItemId ──▶ ACEItem.category ──▶ orderedTotal (per category)
        │ (no aceItemId — free-entry line)
        ▼
   unallocatedOrderedTotal (shown separately, never dropped or force-assigned)

   orderedNotCompleted = max(0, orderedTotal − B)          ┐
   balanceToBeOrdered  = max(0, A − max(B, orderedTotal))  ┴─▶ Balance to complete (C)
   Total Estimated Value (D) = B + C
   Variance = A − D

   /admin/cost-management  ──▶  ModulePlaceholder("Detailed specification pending")
                                  no type · no adapter · no business logic
```

Rules implemented today:
- **Cost-to-Complete has no persisted record and no mock data file of its own** — `CostToCompleteAdapter.getSummary(projectId)` composes `costAdapter`/`aceAdapter`/`purchaseOrdersAdapter`/`rfqAdapter`'s own public methods on every call, the deepest cross-adapter composition in this app so far (three hops: PO → its RFQ's lines → an ACE item), still never reaching into another module's mock arrays directly.
- **Original Estimate (A) is sourced from `CostEntry.budgetAmount`**, not a fresh `ACEItem.rate × quantity` calculation — `ACEItem` (Part 8) carries no quantity at all, so a literal ACE total isn't computable from stored data. The owner's own §8G example figure (₹77L) is identical to §8A's own example (₹77L), strong evidence both name the same figure. **FRONTEND IMPLEMENTATION DECISION.**
- **Balance to complete (C)** is computed as `max(0, orderedTotal − B) + max(0, A − max(B, orderedTotal))` rather than the simpler `max(0, orderedTotal − B) + max(0, A − orderedTotal)` — the `max(B, orderedTotal)` guard avoids double-counting a category where real spend already exceeds anything this build can trace through the optional, two-hop ACE/RFQ/PO chain (the common case in this mock dataset — most `CostEntry.actualAmount` has no traced PO at all). This formula gracefully reduces to exactly `CostEntry`'s own Budget−Actual variance whenever a category has no traceable PO activity.
- The owner's "ordered but yet to be completed … applies to service & composite works, not supply components" split is **not implemented** — `ContractCategory` (the only category vocabulary this app has) has no confirmed supply-vs-service/composite classification to split by. Every category is treated uniformly; flagged, not silently assumed.
- `/admin/finance/cost-to-complete` is a project-scoped report page with no "All projects" option (the Schedule/Part 13 precedent) and **no form of any kind** — nothing here is created, edited, or deleted, only computed and displayed. Clicking a category row opens a `Sheet` (the `ScheduleProgressSheet`/Part 13 interaction pattern, reused for a computed row instead of a mutable one) showing that row's full calculation lineage, per the owner's explicit "frontend must show the calculation lineage/explanation where practical."
- **Cost Management is untouched business-logic-wise** — `/admin/cost-management` still renders `ModulePlaceholder`, now behind a `PermissionGuard` for `cost_management:view` (already existed, already held only by `admin`, Part 3) for consistency with every other route in this app, and nothing else. No type, no adapter, no mock data, no form — per the owner's explicit "DO NOT invent this module's detailed business rules" instruction.

## Cross-Module Polish: Notifications + Ops Dashboard + Global Search + Audit Timeline (Part 19)

```
   Lead(status="new") ─────────────────────────┐
   PurchaseRequisition(status="submitted") ────┤
   PurchaseOrder(status="pending_approval_l1")─┤
   PurchaseOrder(status="pending_approval_l2")─┤
   PurchaseOrder(status="approved"|"released")─┼──▶ NotificationsAdapter.getForUser(user)
   PurchaseOrder(status="issued") minus GRN ────┤        │  gated per-rule by user.permissions
   TaxRecord: getTaxRecordStatus()="overdue" ───┤        ▼
   ScheduleActivity: getProgressState()="overdue"┤   AppNotification[] (never stored, never "read")
   Contract(customerId, "sent_for_acceptance") ─┤        │
   MRC(customerId, "issued") ───────────────────┘        ├──▶ Topbar NotificationsMenu (compact dropdown)
                                                          ├──▶ /dashboard/notifications, /admin (full NotificationList)
                                                          └──▶ /dashboard (top 5, "See all" link)

   (same 8 sources, minus Lead/Contract/MRC, plus
    CostToCompleteAdapter.getSummary looped per mockProjects) ──▶ OpsMetricsAdapter.getForUser(user) ──▶ MetricCard grid on /admin

   Cmd/Ctrl+K ──▶ GlobalSearch ──▶ runGlobalSearch(query, user)
                     │  staff: Contract/Vendor/Requisition/RFQ/PurchaseOrder/GRN/MRC .list({search})
                     └  customer: Contract/MRC .list({search, customerId})
                  ──▶ top 5 results per entity, arrow-key nav, Enter navigates to the record's own [id] route

   ContractAuditEntry ┐
   PurchaseOrderAuditEntry ├──▶ AuditTimeline<Entry>({entries, getIcon, emptyTitle, emptyDescription})
   RequisitionAuditEntry ┤        (one shared renderer — was 3 byte-for-byte-identical components)
   LeadActivity (read-only half) ┘
```

Rules implemented today:
- **Notifications and Ops Dashboard metrics are pure computed aggregates, exactly like `CostToComplete` (Part 18)** — `NotificationsAdapter`/`OpsMetricsAdapter` own no mock data file, compose eight/nine other adapters' own public methods on every call, and are never marked read/dismissed: an item simply stops appearing once its underlying record no longer qualifies (a Requisition leaving `"submitted"`, a PO leaving `"pending_approval_l1"`, etc.).
- **Every rule is gated on the exact `PermissionKey` its target list view requires** — a user never sees a metric or notification for a report they can't open. The rule table was sized so all 8 demo personas (`src/lib/auth/mock-users.ts`) see at least one real, live notification: `leads:read` (new leads) covers `admin`/`project_manager`; `requisitions:approve` (submitted requisitions) and `po:issue` (release/issue reminders) cover `purchaser`; `po:approve:level1`/`po:approve:level2` cover `finance`/`approver`; `grn:create` (issued-PO-without-GRN) covers `store_personnel`; `finance:read` (overdue tax) covers `finance`; `schedule:read` (behind-schedule activities) covers `project_manager`/`site_engineer`; `contracts:accept`/`mrc:accept` cover the `customer` persona.
- **Notifications channel is in-app only, computed live, never persisted** — this answers `docs/OPEN_QUESTIONS.md` #10 for the frontend build: there is no backend event bus to build against, so every notification/metric is derived at render time from already-existing cross-module data, matching `docs/ARCHITECTURE.md`'s cross-module data-flow list.
- `useNotifications()`/`useOpsMetrics()` are each called from exactly the surfaces named above — `useNotifications` has 4 consumers (`NotificationsMenu`, `/dashboard/notifications`, `/dashboard`, `/admin`'s "Needs your attention"), so the badge count, the full list, and the dashboard summary never disagree.
- **Global Search covers exactly the entities with a real `[id]` detail route to land on** — 7 for staff (Contract, Vendor, Requisition, RFQ, PurchaseOrder, GRN, MRC), 2 for the customer persona (Contract, MRC, each already scoped to `customerId === session.user.id`). Lead and Project are deliberately excluded — neither has a dedicated single-record detail route, so a result for either would link to a list, a weaker result than every other entity. Each entity reuses its own adapter's existing `search` param — no new search index or backend endpoint.
- **`AuditTimeline<Entry>` consolidates 4 duplicated read-only log renderers** — `ContractAuditHistory`/`POAuditHistory`/`RequisitionAuditHistory` were byte-for-byte-identical markup (icon circle + message + actorName · date, `border-l-2 pl-4`), differing only in entry type/icon map/empty-state copy; `LeadActivityLog`'s read-only half matched the same shape. All four are now thin wrappers passing their own entries + an icon-resolver into one shared component. `VendorAssessmentHistory` (ratings-grid cards) and `DocumentVersionHistory` (file-metadata version cards) were checked and are genuinely different shapes — not folded in.
- **Accessibility/responsive/performance pass** — `globals.css` already had a global `prefers-reduced-motion` rule and `:focus-visible` ring from Part 1; this part added a skip-to-content link in `AppShell` (target `#main-content` already existed), audited every icon-only `<button>` for a missing `aria-label` (none found), ran a WCAG contrast spot-check against the confirmed brand palette (flagged, not silently changed — see `docs/OPEN_QUESTIONS.md` #40), confirmed every Part 15–18 dense table already renders through `DataTable` (inheriting its mobile-card fallback), and documented (rather than re-engineered) performance: `framer-motion` remains an installed-but-unused dependency, and Next.js's App Router already code-splits per route.
- `StatCard`/`MetricCard` (named separately in the master prompt's core-component list with no distinguishing description) were consolidated into one `MetricCard` primitive, used by both `/admin`'s metric grid and nothing else yet — a deliberate non-duplication, not a missed requirement.

## Store Material Requisition ("MR", §6B, added post-Part-20 stabilization pass — Phase 2)

The owner's requirement for this module is a single sentence: a Site/Project Manager requests material already in stock, and it flows to Stores for issuance. No status vocabulary, approval model, or audit-log expectation is given. This frontend implements the same shape as Purchase Requisition (Part 8) — single-step approval — with one addition, a terminal issuance step:

```
                 ┌──────────────────────────┐
                 │                          │
                 ▼                          │
   draft ──submit──▶ submitted ──approve──▶ approved ──issue──▶ issued  (terminal)
                          │
                          └──reject──▶ rejected
                              │
                              └───revise (edit) — resets to draft
```

Rules implemented today:
- `create` always starts a request at `draft`. Only `draft` and `rejected` requests can be edited (`StoreRequisitionsAdapter.update`) — `submitted`, `approved`, and `issued` are locked.
- **Who does what**: raising a request (`create`, `submit`, and revising it) requires `store_requisitions:create`, held by `admin`, `project_manager`, and `site_engineer` — the two roles the owner names ("Site/Project Manager"). Deciding it (`decide` → `approved`/`rejected`) and recording issuance (`issue`) both require `store_requisitions:action`, held by `admin` and `store_personnel` — see `docs/ROLES_AND_PERMISSIONS.md`.
- `submit`: `draft → submitted` only.
- `decide`: `submitted → approved` or `submitted → rejected` only. Approving requires `approvedIssuedQuantity` (Stores may approve a different quantity than requested); rejecting optionally carries free-text `storeRemarks`.
- **Revising a rejected request resets its status to `draft`** (`StoreRequisitionsAdapter.update`, when called against a `rejected` request) — the same frontend decision Contract (Part 5) and Purchase Requisition (Part 8) made for their own decline/reject states. `storeRemarks` is cleared at that point.
- `issue`: `approved → issued` only — terminal. Sets `issueDate`. **Does not write a `StockEntry` row** — this frontend does not simulate the actual stock decrement issuance would cause in a real backend; see `docs/DATA_MODELS.md`.
- **No audit-log entity** — unlike Purchase Requisition's `RequisitionAuditEntry`, no equivalent was added here; the review/decision trail is limited to `storeRemarks` and `updatedAt`. A frontend scoping decision, not a gap — see `docs/OPEN_QUESTIONS.md`.

---

## Store Material Requisition — issuance is not yet a real stock-truth transaction (BrickBasket final hardening pass)

`issue` above is documented as it behaves in this frontend's mock adapter today: a status flip from `approved` to `issued`, nothing more. **This is not the real workflow a backend must implement.** A real `POST /api/store-requisitions/:id/issue` must be an atomic backend transaction that (1) re-verifies the requisition is still `approved`, (2) verifies `approvedIssuedQuantity`, (3) verifies real-time stock availability, (4) writes the actual stock-consumption/movement record, (5) marks the requisition `issued`, (6) sets `issueDate` server-side, (7) records the authenticated actor, and (8) commits all of that together or none of it — see `docs/API_CONTRACTS.md`'s `/issue` section for the full 8-step contract. **The frontend must never become the authority for stock truth**: it does not, and must not, predict client-side whether an issuance would succeed against current stock — that determination belongs entirely to the backend, at the moment of the real transaction.

---

Every module's workflow through Part 19, plus the post-Part-20 stabilization pass's Store Material Requisition module (§6B), is documented above. There is no remaining module whose workflow is undocumented as of this pass — the one deliberate exception is Cost Management (Part 18's `/admin/cost-management` placeholder), whose workflow cannot be documented until its business-rule specification arrives from Pushkar Tiwari (see `docs/OPEN_QUESTIONS.md` #4).
