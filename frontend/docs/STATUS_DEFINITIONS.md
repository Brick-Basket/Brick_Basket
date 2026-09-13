# STATUS DEFINITIONS

Every status/state field's allowed values and meaning, one section per entity, populated module-by-module as each part ships (see `docs/PART_PROMPTS.md`).

## Lead.status (Part 4)

**CONFIGURABLE — pending confirmation, see `docs/OPEN_QUESTIONS.md` #3.** Demo pipeline only; source of truth is `src/types/domain/lead.ts`'s `LeadStatus` union and `src/components/leads/lead-status-config.ts`'s label/tone/order map (keep both in sync if this table changes).

| Value | Label (UI) | Meaning | Kanban column order |
|---|---|---|---|
| `new` | New | Just captured, not yet contacted | 1 |
| `contacted` | Contacted | Staff has reached out at least once | 2 |
| `qualified` | Qualified | Genuine, budget/timeline-fit prospect — ready to move toward a contract | 3 |
| `converted` | Converted | Became a customer (Contract Management, Part 5, owns the actual Lead→Customer/Project creation) | 4 |
| `lost` | Lost | Will not proceed — no reason-code field today; capture the "why" as a follow-up note instead | 5 |

## LeadActivity.type (Part 4)

Not user-configurable — a fixed two-value discriminator, not a business status.

| Value | Meaning |
|---|---|
| `note` | Free-text follow-up entry, staff-authored |
| `status_change` | Auto-generated entry appended whenever `Lead.status` changes, never authored directly by a user |

## Contract.status (Part 5)

**Partially CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #3 and #21.** `draft`/`sent_for_acceptance`/`accepted` map directly to owner-confirmed requirements ("send for acceptance," "review/accept," "read-only after final acceptance"). `declined` is a frontend implementation decision — see `docs/WORKFLOWS.md`'s contract acceptance state machine for the full transition rules.

| Value | Label (UI) | Meaning | Owner-confirmed? |
|---|---|---|---|
| `draft` | Draft | Being prepared by admin, never seen by the customer | Yes (implied — a contract must exist before being sent) |
| `sent_for_acceptance` | Sent for Acceptance | Out for the customer's review | Yes |
| `accepted` | Accepted | Final — read-only for both sides | Yes |
| `declined` | Declined | Customer declined; admin can revise (resets to `draft`) or leave as-is | **No — frontend decision** |

## ContractLineItem.category / ContractCategory (Part 5)

**CONFIGURABLE — pending confirmation, see `docs/OPEN_QUESTIONS.md` #3.** The owner requirements confirm a line item needs "a predefined category dropdown" but never name the categories. Reused ahead of schedule from the Part 15 Finance/Cost Accounting category set (`civil`, `mechanical`, `electrical`, `plumbing & sanitary`, `finishing`, `labour`, `other`) plus `design_consultancy`, purely for internal consistency. Source of truth: `src/types/domain/contract.ts`'s `ContractCategory` union and `src/components/contracts/contract-category-config.ts`.

| Value | Label (UI) |
|---|---|
| `civil` | Civil |
| `electrical` | Electrical |
| `plumbing_sanitary` | Plumbing & Sanitary |
| `mechanical` | Mechanical |
| `finishing` | Finishing |
| `labour` | Labour |
| `design_consultancy` | Design & Consultancy |
| `other` | Other |

## ContractAuditEntry.action (Part 5)

Not user-configurable — a fixed discriminator matching `ContractsAdapter`'s mutating methods 1:1, never authored directly by a user (unlike `LeadActivity.type: "note"`).

| Value | Meaning |
|---|---|
| `created` | Contract created (always `draft`) |
| `updated` | Details/line items edited while `draft` or `declined` |
| `sent_for_acceptance` | Admin sent the contract to the customer |
| `withdrawn` | Admin recalled it back to `draft` before the customer responded |
| `accepted` | Customer accepted |
| `declined` | Customer declined, optionally with a reason |

## DocumentCategory (Part 6)

**Owner-confirmed, NOT configurable** — unlike `Lead.status` or `Contract`'s category list above, these six values are named verbatim in the owner requirements, so this table is the authoritative vocabulary, not a demo placeholder pending confirmation. Source of truth: `src/types/domain/document.ts`'s `DocumentCategory` union and `src/components/documents/document-category-config.ts`.

| Value | Label (UI) | Is a warranty category? |
|---|---|---|
| `finalized_drawing` | Finalized Drawing | No |
| `layout_2d` | 2D Layout | No |
| `layout_3d` | 3D Layout | No |
| `material_test_certificate` | Material Test Certificate | No |
| `warranty_tax_invoice` | Warranty Tax Invoice | Yes |
| `warranted_goods_certificate` | Warranted Goods Certificate | Yes |

The two warranty categories are the only ones that populate `Document.warrantyItem`/`warrantyExpiresAt` and appear in the Warranty Mapping view — see `docs/FILE_UPLOADS.md`.

## Vendor.nature (Part 7)

**Owner-confirmed verbatim** ("Nature: Supply / Service / Service & Supply"). Source of truth: `src/types/domain/vendor.ts`'s `VendorNature` union and `src/components/vendors/vendor-config.ts`.

| Value | Label (UI) |
|---|---|
| `supply` | Supply |
| `service` | Service |
| `service_and_supply` | Service & Supply |

## Vendor.codeSeriesCategory (Part 7)

**FRONTEND IMPLEMENTATION DECISION — see `docs/OPEN_QUESTIONS.md` #27.** The owner's vendor-code-series table names 6 categories, which don't map 1:1 onto the 3 `nature` values above (Specialised Work and Machinery Hiring have no `nature` equivalent) — so this is modeled as its own field, set once at creation and never edited. Source of truth: `src/types/domain/vendor.ts`'s `VendorCodeSeriesCategory` union and `src/components/vendors/vendor-config.ts`'s `VENDOR_CODE_SERIES_CONFIG`.

| Value | Series | Label (UI) | Starting number (this build) | Owner's example text |
|---|---|---|---|---|
| `service_and_supply` | 1 | Service & Supply | 100001 | "100001+" |
| `service` | 2 | Service | 200001 | "200001+" |
| `supply` | 3 | Supply | 300001 | "300001+" |
| `specialised_work` | 4 | Specialised Work | 400001 | "400001+" |
| `machinery_hiring` | 5 | Machinery Hiring | 500001 | "500001+" |
| `design_detailing_consultancy` | 6 | Design / Detailing / Consultancy | 600001 | "60001+" (verbatim — see `docs/OPEN_QUESTIONS.md` #1) |

Series 6's owner text ("60001+") is five digits while every other series is six — this build uses 600001 as the starting number for a working, internally consistent demo, while preserving the owner's exact text in `VENDOR_CODE_SERIES_CONFIG[...].ownerExampleText`. Do not silently resolve this — confirm with the client per `docs/OPEN_QUESTIONS.md` #1.

## Vendor.gstCategory (Part 7)

**Owner-confirmed verbatim** ("GST category: Registered / Non-Registered").

| Value | Label (UI) |
|---|---|
| `registered` | Registered |
| `non_registered` | Non-Registered |

## PurchaseRequisition.status (Part 8)

**CONFIGURABLE — pending confirmation, see `docs/OPEN_QUESTIONS.md` #3 and #29.** The owner requirements only note "Draft/submitted/approved/rejected-style states only if configurable" for this module — neither the exact vocabulary nor a single- vs. two-level approval model is confirmed. Source of truth: `src/types/domain/requisition.ts`'s `PurchaseRequisitionStatus` union and `src/components/requisitions/requisition-status-config.ts`.

| Value | Label (UI) | Meaning |
|---|---|---|
| `draft` | Draft | Being prepared by the requester (`admin`/`project_manager`), not yet visible to a reviewer |
| `submitted` | Submitted | Sent for review — awaiting an `admin`/`purchaser` decision |
| `approved` | Approved | Final for this module — RFQ Management (Part 9) picks up from here |
| `rejected` | Rejected | Reviewer declined it, optionally with a reason; requester can revise (resets to `draft`) or leave as-is |

This mirrors `Contract.status`'s draft→sent→accepted/declined shape (Part 5) rather than inventing a new state machine — see `docs/WORKFLOWS.md`'s "Requisition review workflow."

## RequisitionAuditEntry.action (Part 8)

Not user-configurable — a fixed discriminator matching `RequisitionsAdapter`'s mutating methods 1:1, never authored directly by a user (same pattern as `ContractAuditEntry.action`).

| Value | Meaning |
|---|---|
| `created` | Requisition created (always `draft`) |
| `updated` | Notes/lines edited while `draft` or `rejected` — if it was `rejected`, this also resets status to `draft` |
| `submitted` | Requester submitted it for review |
| `approved` | Reviewer approved it |
| `rejected` | Reviewer rejected it, optionally with a reason |

## MaterialRequirement.source (Part 8)

Not user-configurable — a fixed two-value discriminator, not a business status. **FRONTEND IMPLEMENTATION DECISION** — see `docs/OPEN_QUESTIONS.md` #29.

| Value | Meaning |
|---|---|
| `predefined` | Line raised against an existing `ACEItem` for the requisition's project (`aceItemId` set; description/UOM copied from the ACE item and disabled in the form) |
| `additional` | Free-entry line with no ACE reference — description/UOM typed directly |

## RFQ.status (Part 9)

**CONFIGURABLE — pending confirmation, see `docs/OPEN_QUESTIONS.md` #3 and #30.** The owner requirements name an "Approval/readiness state" for this module without a vocabulary. Source of truth: `src/types/domain/rfq.ts`'s `RFQStatus` union and `src/components/rfq/rfq-status-config.ts`.

| Value | Label (UI) | Meaning |
|---|---|---|
| `draft` | In Comparison | Vendor quotes are still being collected/compared; quotes, vendor selections and the tax rate can all still change |
| `finalized` | Finalized | Every line has a selected vendor; the comparison is locked — Purchase Orders (Part 10) picks up from here |

Deliberately a **two-state** flag, not a multi-step approval like Purchase Orders' confirmed two-level approval (Part 10) — the comparison process itself isn't an approval workflow; only the final "lock it in" step is. See `docs/WORKFLOWS.md`'s "RFQ comparison & finalization" section.

## RFQLine.selectedVendorId / L1 (Part 9)

Not a stored status field, but the two computed states the required comparison table surfaces per line:

| State | Meaning |
|---|---|
| L1 (computed) | The lowest-rate quote among a line's vendor quotes — recomputed on every render (`computeL1Quote`), never stored. Highlighted with a badge; **not** enforced as the required selection. |
| Selected (stored, `selectedVendorId`) | The vendor the purchaser has chosen for this line — may or may not be the L1 vendor. Required on every line before the RFQ can be finalized. |

## PurchaseOrder.status (Part 10)

**CONFIGURABLE — pending confirmation, see `docs/OPEN_QUESTIONS.md` #3 and #31.** The owner requirements confirm three named milestones — "two-level approval," "Release state," "Issue state" — without confirming who decides each one or the exact status vocabulary between them. Source of truth: `src/types/domain/purchase-order.ts`'s `PurchaseOrderStatus` union and `src/components/po/po-status-config.ts`.

| Value | Label (UI) | Meaning |
|---|---|---|
| `draft` | Draft | Being prepared by the purchaser/admin (terms, tax) after creation from a finalized RFQ's vendor group; not yet submitted |
| `pending_approval_l1` | Pending L1 Approval | Submitted — awaiting a level 1 decision (`po:approve:level1`: `finance`, `approver`, `admin`) |
| `pending_approval_l2` | Pending L2 Approval | Level 1 approved — awaiting a level 2 decision (`po:approve:level2`: `approver`, `admin`) |
| `approved` | Approved | Both levels approved — ready to be released |
| `rejected` | Rejected | Either level rejected it (`rejectedAtLevel` records which); purchaser can revise (resets to `draft`) or leave as-is |
| `released` | Released | Approved and released — ready to be issued (`po:issue`: `purchaser`, `admin`) |
| `issued` | Issued | Dispatched to the vendor — `emailDispatchStatus`/`emailDispatchedAt` record the (mocked) email send. Terminal. |

This mirrors `PurchaseRequisition.status`/`Contract.status`'s draft→submit→decide→revise shape (Parts 5 and 8) for the approval portion, extended with the owner's confirmed Release and Issue milestones — see `docs/WORKFLOWS.md`'s "Purchase Order lifecycle."

## Approval.decision (Part 10)

Not user-configurable — a fixed two-value discriminator recorded once per approval-level decision.

| Value | Meaning |
|---|---|
| `approved` | The decider (level 1: `finance`/`approver`/`admin`; level 2: `approver`/`admin`) approved this PO at this level, moving it to the next stage |
| `rejected` | The decider rejected this PO at this level, optionally with a comment; `PurchaseOrder.rejectedAtLevel` records which level |

## PurchaseOrderAuditEntry.action (Part 10)

Not user-configurable — a fixed discriminator matching `PurchaseOrdersAdapter`'s mutating methods 1:1, never authored directly by a user (same pattern as `RequisitionAuditEntry.action`/`ContractAuditEntry.action`).

| Value | Meaning |
|---|---|
| `created` | PO created from a finalized RFQ's vendor group (always `draft`) |
| `updated` | Terms/tax edited while `draft` or `rejected` — if it was `rejected`, this also resets status to `draft` |
| `submitted` | Purchaser submitted it for level 1 approval |
| `approved_level1` | Level 1 decider approved it |
| `approved_level2` | Level 2 decider approved it |
| `rejected` | Either level's decider rejected it, optionally with a comment |
| `released` | Released after full approval |
| `issued` | Issued to the vendor — email dispatch recorded |

## GRN — no status field (Part 11)

`GRN` and `GRNLineItem` carry no status/lifecycle field — the owner requirements (§6A) ask only that a GRN "show" its fields (project scope, purchase request, ordered vs. received, brand, warranty certificate, rate, quantity), not that it go through any review/approval. A GRN can only be *created* against a `PurchaseOrder` whose `status === "issued"` (see `docs/WORKFLOWS.md`), but the GRN record itself has nothing to transition once created.

## StockMaterial (Part 11)

**Owner-confirmed, NOT configurable** — the reference material list is named verbatim in the owner requirements (§6C), shared by both `StockEntry` and `WastageEntry` rather than defining two near-identical unions. Source of truth: `src/types/domain/stock-entry.ts`'s `StockMaterial` union and `src/components/stock/stock-material-config.ts`.

| Value | Label (UI) |
|---|---|
| `cement` | Cement |
| `sand` | Sand |
| `aggregate` | Aggregate |
| `tmt_steel` | TMT Steel |
| `bricks` | Bricks |
| `tiles` | Tiles |
| `pipes` | Pipes |
| `electrical_cable` | Electrical Cable |
| `paint` | Paint |
| `sanitary_fixtures` | Sanitary Fixtures |
| `other` | Other — pairs with a free-text `otherMaterialName` on the record |

Neither `StockEntry` nor `WastageEntry` carries a status/lifecycle field — both are plain ledger/log records, matching `ACEItem`'s "flat record" treatment (Part 8) rather than a workflow entity's.

## MRC.status (Part 12)

**CONFIGURABLE — see `docs/OPEN_QUESTIONS.md` #33.** Mirrors `ContractStatus`'s 4-value shape exactly (Part 5); `"issued"` plays the role Contract calls `"sent_for_acceptance"`, renamed to match this module's `mrc:issue` permission key. `"declined"` and the admin "withdraw to draft" action are the same frontend implementation decision already made for Contract (`docs/OPEN_QUESTIONS.md` #22) — the owner text only names issuing the certificate and the customer's acceptance, not a decline/revision path.

| Value | Meaning |
|---|---|
| `draft` | Being assembled by admin/store personnel, not yet visible to the customer |
| `issued` | Sent to the customer for review — awaiting their response |
| `accepted` | Customer accepted — read-only from here |
| `declined` | Customer declined, with an optional free-text reason — editing resets it to `draft` |

## MRCLineItem.source (Part 12)

Reuses the same predefined-vs-freeform discriminator pattern `MaterialRequirement.source` established in Part 8 (there: `"predefined"`/`"additional"`), applied here to a different pairing.

| Value | Meaning |
|---|---|
| `grn` | Certifies a specific `GRNLineItem` (Part 11) — description/UOM/make snapshotted from it, quantity capped at what was actually received |
| `manual` | Typed directly onto the certificate, with no `GRN` behind it |

## ScheduleActivity / ScheduleProgressEntry — no stored status field (Part 13)

`ScheduleActivity` and `ScheduleProgressEntry` carry no stored status/lifecycle field, matching the `GRN`/`StockEntry`/`WastageEntry` precedent (Parts 11) — a flat record and an append-only log rather than a workflow entity. Instead, `src/components/schedule/schedule-progress-math.ts`'s `getProgressState` computes a `ScheduleProgressState` at render time from `plannedStart`/`plannedEnd`/`quantity` plus the activity's latest `ScheduleProgressEntry.executedQuantity`, and this computed value is never persisted. Both `expectedPercent` (straight-line pro-rata against elapsed time) and `delayDays` (`today − plannedEnd`, only while incomplete) are **FRONTEND IMPLEMENTATION DECISIONS** — the owner text names "pro-rata progress-to-green" and "delay in days" without defining either formula; see `docs/OPEN_QUESTIONS.md` #34.

| Value | Meaning |
|---|---|
| `not_started` | No `ScheduleProgressEntry` recorded yet |
| `behind` | `percentComplete < expectedPercent`, and not yet past `plannedEnd` |
| `on_track` | `percentComplete >= expectedPercent`, and not yet past `plannedEnd` |
| `overdue` | Past `plannedEnd` and `percentComplete < 100` |
| `completed` | `percentComplete >= 100` |

## DPR — no stored status field (Part 14)

`DPR`, `DPRManpowerEntry`, and `DPRWorkItemEntry` carry no stored status/lifecycle field, matching the `GRN`/`ScheduleActivity` precedent — a daily record, not a workflow entity. `previousQty`/`cumulativeQty`/`percentComplete` on each work-item line are computed at render time from the full project history (`src/components/dpr/dpr-work-item-math.ts`), never persisted. See `docs/OPEN_QUESTIONS.md` #35.

## DPRManpowerCategory (Part 14)

**Owner-confirmed, NOT configurable** — the 8-value manpower category list is named verbatim in the owner requirements (§7C). Every `DPR` carries exactly one `DPRManpowerEntry` per category (zero-filled when unused), never a dynamic add/remove list. Source of truth: `src/types/domain/dpr.ts`'s `DPRManpowerCategory` union and `src/components/dpr/dpr-manpower-config.ts`.

| Value | Label (UI) |
|---|---|
| `civil_mason` | Civil Mason |
| `carpenter` | Carpenter |
| `bar_bender` | Bar Bender |
| `plumber` | Plumber |
| `electrician` | Electrician |
| `painter` | Painter |
| `tile_masonry_finishing` | Tile/Masonry Finishing |
| `other` | Other |

## DPRWorkCategory / DPRWorkItemMaster (Part 14)

**Owner-confirmed, NOT configurable** — the four work categories and their 77 items (Civil 23, Electrical 15, Plumbing & Sanitary 18, Finishing 21) are transcribed verbatim from the owner requirements (§7C), item numbers included. Source of truth: `src/types/domain/dpr.ts`'s `DPRWorkCategory` union and `src/lib/constants/dpr-work-items.ts`'s `DPR_WORK_ITEMS`/`DPR_WORK_CATEGORY_CONFIG`.

| Value | Label (UI) | Item count | Catch-all row |
|---|---|---|---|
| `civil` | Civil Works | 23 | `civil_23` — "Other civil work" |
| `electrical` | Electrical Works | 15 | `electrical_15` — "Other electrical work" |
| `plumbing_sanitary` | Plumbing & Sanitary | 18 | `plumbing_18` — "Other plumbing/sanitary" |
| `finishing` | Finishing Works | 21 | `finishing_21` — "Other finishing" |

Each category's last item is its "Other ___ work" catch-all (`isOtherCatchAll: true`), with an empty master `uom` — the work-item form collects a free-text `otherDescription` + `otherUom` for these rows instead.

## CostEntry — no stored status field, category reused (Part 15)

`CostEntry` carries no stored status/lifecycle field, matching the `ACEItem`/`StockEntry`/`WastageEntry` precedent — a flat, per-project, per-category record, not a workflow entity. `budgetAmount`/`actualAmount`'s over/under/on-budget comparison (`getVarianceStatus` in `src/components/cost/cost-math.ts`) is computed at render time, never persisted.

`CostEntry.category` reuses `ContractCategory` (see this file's "ContractLineItem.category / ContractCategory" section above) rather than the narrower 7-value literal category list the owner's Finance/Cost Accounting text names (civil, mechanical, electrical, plumbing & sanitary, finishing, labour, other — omitting `design_consultancy`). Still CONFIGURABLE / not owner-confirmed — see `docs/OPEN_QUESTIONS.md` #23 and #36.

## Invoice.paymentStatus — no stored status field (Part 16)

`Invoice` carries no stored status/lifecycle field — `paymentStatus` is always computed at render time (`getInvoicePaymentStatus` in `src/components/payments/payment-math.ts`) from the sum of `Payment` rows referencing it. See `docs/OPEN_QUESTIONS.md` #37.

| Value | Meaning |
|---|---|
| `unpaid` | No `Payment` (`direction: "payment"`) references this invoice yet |
| `partially_paid` | Total paid is greater than 0 but less than `invoiceAmount` |
| `paid` | Total paid is at least `invoiceAmount` |

## Payment.direction (Part 16)

**FRONTEND IMPLEMENTATION DECISION** — the owner text (§8B) names only the vendor/PO side; the `"receipt"` half and this single discriminated entity are inventions, needed so `/dashboard/payments` has something to show customers. Source of truth: `src/types/domain/payment.ts`'s `PaymentDirection` union and `src/components/payments/payment-config.ts`.

| Value | Label (UI) | Meaning |
|---|---|---|
| `payment` | Payment (to Vendor) | Money out, against an `Invoice` |
| `receipt` | Receipt (from Customer) | Money in, against an accepted `Contract` |

## Payment.mode (Part 16)

**FRONTEND IMPLEMENTATION DECISION** — the owner text names "payment details" without a vocabulary; see `docs/OPEN_QUESTIONS.md` #37. Source of truth: `src/types/domain/payment.ts`'s `PaymentMode` union and `src/components/payments/payment-config.ts`.

| Value | Label (UI) |
|---|---|
| `bank_transfer` | Bank Transfer |
| `cheque` | Cheque |
| `upi` | UPI |
| `cash` | Cash |
| `other` | Other |

## BankTransaction — no stored status field (Part 16)

`BankTransaction` carries no stored status/lifecycle field — a flat ledger record, matching the `ACEItem`/`StockEntry`/`CostEntry` precedent. `itcApplicable` is modeled as a boolean rather than a named value set — the owner's "ITC applicability" field names the field, not its vocabulary. **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #37.

## TaxRecord.type / TaxRecordStatus (Part 17)

`TaxRecord.type` is **FRONTEND IMPLEMENTATION DECISION** — a fixed two-value discriminator, invented since the owner's §8D text ("Government taxes and statutory license fees") names two kinds of obligation without a field name for the distinction. Source of truth: `src/types/domain/tax-record.ts`'s `TaxRecordType` union and `src/components/finance/tax-record-config.ts`.

| Value | Label (UI) |
|---|---|
| `tax` | Government Tax |
| `statutory_license_fee` | Statutory License Fee |

`TaxRecordStatus` is **not stored** — computed at render time from `dueDate`/`paidDate` (`getTaxRecordStatus` in `src/components/finance/tax-record-math.ts`), the same "computed, not stored" convention `Invoice.paymentStatus` established (Part 16).

| Value | Meaning |
|---|---|
| `paid` | `paidDate` is set |
| `overdue` | No `paidDate`, and today is past `dueDate` |
| `pending` | No `paidDate`, and today is on or before `dueDate` |

## FixedAssetCategory / FixedAsset.status (Part 17)

**FRONTEND IMPLEMENTATION DECISION** — the owner's §8E text confirms only the ₹5,000 value threshold, not a category vocabulary or a disposed lifecycle. Source of truth: `src/types/domain/fixed-asset.ts`'s `FixedAssetCategory`/`FixedAssetStatus` unions and `src/components/finance/fixed-asset-config.ts`.

| Value | Label (UI) |
|---|---|
| `equipment` | Equipment |
| `vehicle` | Vehicle |
| `furniture` | Furniture |
| `it_computer` | IT / Computer |
| `tools_machinery` | Tools & Machinery |
| `other` | Other |

| Value | Meaning |
|---|---|
| `active` | In use / on the books |
| `disposed` | No longer held — `disposedAt` records when |

`FIXED_ASSET_MIN_VALUE = 5_000` — the one owner-confirmed rule this module has, enforced client-side in `FixedAssetForm` (`value` must be strictly greater than this).

## GSTRRecord.type (Part 17)

**FRONTEND IMPLEMENTATION DECISION** — mirrors `Payment.direction`'s discriminator shape (Part 16). The owner's §8F text names exactly these two categories and their linking rules. Source of truth: `src/types/domain/gstr-record.ts`'s `GSTRRecordType` union and `src/components/finance/gstr-config.ts`.

| Value | Label (UI) | Meaning |
|---|---|---|
| `purchase` | Purchase | "Purchases inclusive of taxes after stores GRN, including service & supply" — requires a linked `GRN` |
| `sales` | Sales | "All business sales including constructed house and materials, if any" — either a linked accepted `Contract` (constructed house) or a manual `saleDescription` (materials) |

No stored status field — `GSTRRecord` carries no lifecycle, matching the `ACEItem`/`BankTransaction` precedent. `getTotalValue`/`getTotalTaxableValue`/`getTotalTax` (`src/components/finance/gstr-math.ts`) are always computed at render time, never stored.

## CostToComplete — no stored record at all (Part 18)

`CostToComplete` has no status field for the same reason it has no `id`, `createdAt`, or any other persisted field: it is not a record, it is a report — every `CostToCompleteRow` is computed fresh on each `CostToCompleteAdapter.getSummary(projectId)` call from `CostEntry`/`ACEItem`/`PurchaseOrder`/`RFQLine` data that already exists elsewhere. Its one derived state is the same over/under/on-budget framing `CostEntry`'s variance uses, reusing `getVarianceStatus` (`src/components/cost/cost-math.ts`) unchanged against the (Original Estimate, Total Estimated Value) pair instead of (Budget, Actual):

| Value | Meaning |
|---|---|
| `under` | Total Estimated Value (D) is less than Original Estimate (A) — projected to finish under the original estimate |
| `over` | Total Estimated Value (D) is greater than Original Estimate (A) — a projected overrun |
| `on_budget` | D equals A |

See `docs/OPEN_QUESTIONS.md` #39 for the calculation this status is built on, and `docs/DATA_MODELS.md`'s CostToComplete section for why the underlying figures are frontend decisions, not owner-confirmed formulas.

## Cost Management — no model, placeholder shell only (Part 18)

No status, no lifecycle, no fields at all — per the owner's explicit §8H "DO NOT invent this module's detailed business rules" instruction. `/admin/cost-management` renders a placeholder behind the pre-existing `cost_management:view` permission. See `docs/OPEN_QUESTIONS.md` #4.

## AppNotification / OpsMetric — no stored status, computed live (Part 19)

Neither has a status field for the same reason `CostToComplete` doesn't: neither is a record, both are reports — a fresh call to `NotificationsAdapter.getForUser`/`OpsMetricsAdapter.getForUser` recomputes the full list from ten already-existing modules' own current status fields (`Lead.status`, `PurchaseRequisition.status`, `PurchaseOrder.status`, `TaxRecordStatus` via `getTaxRecordStatus`, `ScheduleProgressState` via `getProgressState`, `Contract.status`, `MRC.status`, plus a GRN-presence diff against issued POs). There is no "read/unread" state anywhere — a notification simply stops being returned once its underlying condition stops holding.

---

## StoreRequisitionStatus (§6B, added post-Part-20 stabilization pass — Phase 2)

| Value | Meaning |
|---|---|
| `draft` | Just created, or a revised `rejected` request — editable, not yet visible to Stores |
| `submitted` | Awaiting a Stores decision |
| `approved` | Stores approved issuance, with `approvedIssuedQuantity` set — awaiting actual issuance |
| `rejected` | Stores declined it, optionally with `storeRemarks` — editing it resets it to `draft` |
| `issued` | Terminal — Stores has recorded actually handing over the material, `issueDate` set |

Deliberately mirrors the draft→submitted→approved/rejected shape of `PurchaseRequisitionStatus` (Part 8) with one addition — a terminal `issued` step after `approved`, since this module's whole point is Stores handing over material it already holds, not queuing a purchase. See `docs/WORKFLOWS.md`'s Store Material Requisition section for the full transition rules.

---

Every module's status vocabulary that exists in this app is documented above (Parts 2 through 19, plus the post-Part-20 stabilization pass's Store Material Requisition addition). The only module with genuinely no status vocabulary to write down is Cost Management (Part 18, above) — a deliberate placeholder per the owner's own instruction, not a documentation gap. (BrickBasket final hardening pass — P2 documentation cleanup: this line previously read "not yet implemented," which had gone stale.)
