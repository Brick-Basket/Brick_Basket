# Validation Rules

Populated Part 20. Every create/edit form in this app enforces its rules client-side today — there is no backend yet to duplicate them server-side. **A real backend must re-implement every rule below itself** (client-side validation is a UX convenience, never a security boundary — see `docs/ARCHITECTURE.md` section C on the permission system's own client-side-only caveat, which applies here too).

Unless a row says **"Owner-confirmed,"** read every rule below as a **frontend invention** — a reasonable default this build picked so the form has *some* enforcement, not something the owner requirements specified. Confirm, loosen, or tighten freely; nothing here is load-bearing business logic.

## How rules are enforced

Two mechanisms exist side by side:

1. **Zod schema + `zodResolver`** (`react-hook-form`) — 22 of the app's 23 create/edit forms. Most inline the schema directly in the `*-form.tsx` file; three modules (Contract, Requisition, MRC, DPR) keep the schema in a sibling `*-form-schema.ts` file instead, specifically so the form and its dynamic line-item editor (`ContractLineItemsEditor`, `MaterialRequirementEditor`, `MRCLineItemsEditor`, DPR's manpower/work-item editors) agree on field paths without importing each other.
2. **Manual state + hand-written checks** — `GRNCreateForm` alone. It has no `react-hook-form`/zod at all: line items live in a plain `useState<LineDraft[]>`, and `handleSubmit` runs a short sequence of `if` checks before calling the adapter, surfacing the first failure in a single `formError` string. This is the one form in the app that doesn't follow the zod convention — flagged here rather than silently treated as equivalent.

Every form also sets `noValidate` on its `<form>` (or, for `GRNCreateForm`, uses `type="button"` on its own submit action) so the browser's native HTML5 validation UI never fights with the zod/React error messages — a validation failure always renders through `FormField`'s `error` prop, never a native browser tooltip.

Cross-field rules that a plain per-field zod schema can't express use `.refine()` (single derived check) or `.superRefine()` (multiple conditional issues, each attached to a specific field path) — both listed per-module below. Two rules are enforced **inside the adapter's `create` method** instead of the form schema, because they depend on data the form's own fields don't carry (a linked record's own status) — also called out below.

## Rule reference by module

### Lead Management (`lead-form.tsx`, Part 2/4) — also `marketing/contact-form.tsx` (public site)

| Field | Rule |
|---|---|
| `name` | required, min 2 chars |
| `email` | required, valid email format |
| `phone` | required, min 8 chars |
| `source` | required, one of `website` / `social_media` / `call_whatsapp` / `personal_reference` |
| `subject` | required, min 3 chars |
| `message` | required, min 5 chars |
| `assignedTo` | required (a `Role`, defaulted by the caller) |

The public `/contact` form (`contactSchema`) is the same shape minus `source`/`assignedTo`, with a stricter `message` minimum (10 chars, "add a few more details").

### Contract Management (`contract-form.tsx` + `contract-form-schema.ts`, Part 5)

| Field | Rule |
|---|---|
| `title` | required, min 3 chars |
| `customerId` | required (locked after creation — `disabled` in edit mode) |
| `projectId` | optional |
| `notes` | optional |
| `lineItems` | array, min 1 row |
| `lineItems[].category` | required, one of the shared 8-value `ContractCategory` union (see `docs/OPEN_QUESTIONS.md` #23) |
| `lineItems[].description` | required, min 2 chars |
| `lineItems[].uom` | required, min 1 char |
| `lineItems[].quantity` | required, > 0 |
| `lineItems[].rate` | required, ≥ 0 |

### Vendor Management (`vendor-form.tsx`, Part 7)

| Field | Rule |
|---|---|
| `tradeName` | required |
| `gstCategory` | required, `registered` / `non_registered` |
| `gstin` | **required only when `gstCategory === "registered"`** — cross-field `.refine()`, attached to `gstin` |
| `address` | required |
| `msmeUdyamNumber` | optional |
| `contactPerson` | required |
| `contactPersonDesignation` | required |
| `email` | required, valid email format |
| `contactNumber` | required |
| `nature` | required, `supply` / `service` / `service_and_supply` |
| `codeSeriesCategory` | required, one of the 6-value code series list (see `docs/OPEN_QUESTIONS.md` #27 on this not mapping 1:1 to `nature`) |
| `turnover` | required, ≥ 0 |

`vendor-assessment-form.tsx`: `quality` / `timelineAdherence` / `futureBusinessProbability` / `presentCapacity` each required, 0–10; `notes` optional.

`vendor-past-work.tsx`: `projectId` optional (a past project may not be one of this app's own mock projects), `description` required min 1 char, `value` required ≥ 0, `completedAt` required.

### Accepted Cost Estimate — ACE (`ace-form.tsx`, Part 8)

| Field | Rule |
|---|---|
| `projectId` | required (locked after creation) |
| `category` | required, shared `ContractCategory` union |
| `itemDescription` | required, min 2 chars |
| `uom` | required, min 1 char |
| `rate` | required, ≥ 0 |
| `notes` | optional |

### Purchase / Material Requisition (`requisition-form.tsx` + `requisition-form-schema.ts`, Part 8)

| Field | Rule |
|---|---|
| `projectId` | required (locked after creation) |
| `notes` | optional |
| `lines` | array, min 1 row |
| `lines[].source` | required, `predefined` (references an ACE item) or `additional` (free entry) |
| `lines[].aceItemId` | optional at the schema level — the form only sends it through when `source === "predefined"` (see `RequisitionForm.onSubmit`); a `predefined` row with no `aceItemId` selected is a known gap, not schema-enforced (there is no cross-field `.superRefine()` here unlike MRC's equivalent branch) |
| `lines[].description` | required, min 2 chars |
| `lines[].uom` | required, min 1 char |
| `lines[].quantity` | required, > 0 |
| `lines[].brand` | optional |

### RFQ Management (`rfq-create-form.tsx`, `rfq-vendor-quote-form.tsx`, Part 9)

Creating an RFQ (`createFormSchema`): `requisitionId` required; `taxPercent` required, 0–100.

Recording a vendor's quote for a line (`quoteFormSchema`): `vendorId` required; `rate` required, > 0.

### Purchase Orders (`po-create-form.tsx`, Part 10)

`createFormSchema`: `termsAndConditions` optional, max 2000 chars. (PO line items, vendor, and tax are all carried over from the finalized RFQ — this form has nothing else to validate.)

### Store Management — GRN (`grn-create-form.tsx`, Part 11) — **the one non-zod form**

Enforced by hand in `handleSubmit`, in this order, each returning early with a single `formError` string on failure:

1. A Purchase Order must be selected (`selectedPoId`).
2. A "Date Received" must be selected (`receivedAt`).
3. Every line's `receivedQuantity` must parse to a number and be ≥ 0 (`Number.isNaN` check + non-negative check, across every line in one pass — the first invalid line fails the whole submission, not reported per-row).

There is **no upper bound** tying a line's `receivedQuantity` to what the PO actually ordered (`orderedQuantity` is shown for reference only) — see `docs/OPEN_QUESTIONS.md` #32(b), the same non-enforcement already logged there. `brand` and `warrantyCertificateNumber` are optional on every line. The Submit button is additionally `disabled` whenever no PO is selected, as a first line of defense before `handleSubmit` even runs.

### Store Management — Stock Statement (`stock-form.tsx`, Part 11)

| Field | Rule |
|---|---|
| `projectId` | required |
| `material` | required, one of the 11-value `StockMaterial` list |
| `otherMaterialName` | optional at the schema level — **not enforced as required when `material === "other"`**, a real gap (contrast with GSTR/Payment/Vendor below, which do enforce their conditional-required fields via `.superRefine()`/`.refine()`); the value is only actually sent to the adapter when `material === "other"` (see `onSubmit`), so a blank name can currently reach the record |
| `uom` | required, min 1 char |
| `date` | required |
| `openingStock` / `receivedToday` / `consumedToday` | each required, ≥ 0 |
| `supplierName` | optional, free text (see `docs/OPEN_QUESTIONS.md` #32(e)) |
| `remarks` | optional |

### Store Management — Wastage (`wastage-form.tsx`, Part 11)

Same `material`/`otherMaterialName` shape and the same unenforced "other" gap as Stock above. Additionally: `quantity` required, > 0; `value` required, ≥ 0; `recordedAt` required; `reason` optional.

### MRC — Material Receipt Certificate (`mrc-form.tsx` + `mrc-form-schema.ts`, Part 12)

| Field | Rule |
|---|---|
| `customerId` | required |
| `projectId` | optional |
| `notes` | optional |
| `lines` | array, min 1 row |
| `lines[].source` | required, `grn` (certifies a received GRN line) or `manual` (typed straight onto the certificate) |
| `lines[].quantity` | required, > 0 (only field required unconditionally on every row) |

The remaining line fields are conditionally required via `.superRefine()`, branching on `source`:
- `source === "grn"` → `grnLineItemId` required ("Select a received line to certify").
- `source === "manual"` → `description` required (min 2 chars), `uom` required, `make` required.

### Project Schedule (`schedule-activity-form.tsx`, Part 13)

| Field | Rule |
|---|---|
| `projectId` | required |
| `activity` | required, min 2 chars |
| `uom` | required, min 1 char |
| `quantity` | required, > 0 |
| `plannedStart` | required |
| `plannedEnd` | required, and **must be on or after `plannedStart`** — `.refine()`, attached to `plannedEnd` |
| `notes` | optional |

Progress readings themselves (`ScheduleProgressEntry.executedQuantity`) have no dedicated form/schema — logged inline wherever they're recorded, with no upper-bound check against the activity's own `quantity` (see `docs/OPEN_QUESTIONS.md` #34(d)).

### Daily Progress Report — DPR (`dpr-form.tsx` + `dpr-form-schema.ts`, Part 14)

| Field | Rule |
|---|---|
| `projectId` | required (locked after creation) |
| `reportDate` | required |
| `notes` | optional |
| `manpower` | array, **exactly 8 rows** — one per `DPRManpowerCategory`, enforced with `.length(8, …)` rather than `.min()`, since every category must always be present even at zero |
| `manpower[].skilled` / `manpower[].unskilled` | each required, ≥ 0 |
| `manpower[].agency` | optional |
| `workItems[].workItemMasterId` | required |
| `workItems[].plannedQty` / `workItems[].todayQty` | each required, ≥ 0 |
| `workItems[].location` / `remarks` / `scheduleActivityId` | optional |

`workItems[]` rows are conditionally validated via `.superRefine()`: when the selected work item is the catch-all "Other" entry (`getDPRWorkItem(id)?.isOtherCatchAll`), `otherDescription` becomes required (min 2 chars) and `otherUom` becomes required — otherwise both stay optional.

### Project Cost Accounting (`cost-form.tsx`, Part 15)

`projectId` required (locked after creation); `category` required, shared `ContractCategory` union (locked after creation, together with `projectId` — see `docs/OPEN_QUESTIONS.md` #36(c)); `budgetAmount` / `actualAmount` each required, ≥ 0; `notes` optional.

### Payments & Receipts (`invoice-form.tsx`, `payment-form.tsx`, Part 16)

**Invoice** (`invoiceFormSchema`): `purchaseOrderId` required; `invoiceNumber` required; `invoiceDate` required; `invoiceAmount` required, > 0; `notes` optional. (`invoiceCopyFileName`/`invoiceCopyFileSizeBytes` are metadata captured by the upload control, not schema-validated text fields — see `docs/FILE_UPLOADS.md`.)

**Payment / Receipt** (`paymentFormSchema`): `direction` required, `payment` or `receipt`; `projectId` required; `amount` required, > 0; `paymentDate` required; `mode` required, one of the 5-value `PaymentMode` list; `referenceNumber` / `notes` optional. Conditionally required via `.superRefine()`:
- `direction === "payment"` → `invoiceId` required ("Select an invoice").
- `direction === "receipt"` → `contractId` required ("Select a contract").

### Bank & Cash (`bank-transaction-form.tsx`, Part 16)

`partyOrVendorCode` required; `paymentAmount` required, ≥ 0; `invoiceNumber` required; `projectId` required; `yearOfExecution` required, integer ≥ 2000; `state` required; `city` required; `taxAmount` required, ≥ 0; `itcApplicable` required boolean; `paymentId` / `accountNumber` / `utrNumber` / `tdsDetails` / `gstin` / `taxComponent` / `notes` all optional. Every field stays editable after creation — `BankTransaction` has no locked identity field (see `docs/OPEN_QUESTIONS.md` #37(e)).

### Taxes (`tax-record-form.tsx`, Part 17)

`type` required, `tax` or `statutory_license_fee`; `name` required; `authority` required; `amount` required, > 0; `dueDate` required; `projectId` / `paidDate` / `referenceNumber` / `notes` all optional.

### Fixed Assets (`fixed-asset-form.tsx`, Part 17)

| Field | Rule |
|---|---|
| `assetName` | required |
| `category` | required, one of the 6-value `FixedAssetCategory` list |
| `value` | required, **strictly greater than ₹5,000** (`FIXED_ASSET_MIN_VALUE`, `src/components/finance/fixed-asset-config.ts`) — **Owner-confirmed**, the one genuinely owner-named rule across all of Parts 16–18 (see `docs/OPEN_QUESTIONS.md` #38(a)) |
| `purchaseDate` | required |
| `status` | required, `active` or `disposed` |
| `vendorId` / `projectId` / `serialNumber` / `disposedAt` / `notes` | optional |

### GSTR (`gstr-form.tsx`, Part 17)

`period` required (min 1 char, e.g. `"2026-09"`); `taxableValue` / `taxAmount` each required, ≥ 0; `gstin` / `invoiceReference` / `notes` optional. The schema is built per-`type` (`buildSchema(type)`, called with a locked `type` prop set by which tab's "Add" button opened the form) and conditionally requires, via `.superRefine()`:
- `type === "purchase"` → `grnId` required ("Select the GRN this purchase was received against").
- `type === "sales"` → `contractLink` required ("Link an accepted contract, or describe the sale manually"); if `contractLink` is the manual-entry sentinel, `saleDescription` also becomes required.

Two related rules are **not** in this schema at all — they're enforced inside `GSTRAdapter.create` instead, because they depend on the linked record's own state, not just which field was filled in: a `"purchase"` record's `grnId` must reference a GRN that actually exists; a `"sales"` record's linked contract must have `status === "accepted"` (see `docs/OPEN_QUESTIONS.md` #38(e)/(f)). A backend must re-implement both as server-side checks, not just the client-visible field-presence rule above.

### Cost-to-Complete / Cost Management (Part 18)

No form — `CostToComplete` is a pure, render-time computed report with no create/update path (see `docs/OPEN_QUESTIONS.md` #39(f)). Nothing to validate.

### Cross-Module Polish — Notifications / Ops Metrics / Global Search (Part 19)

No forms — all three are read-only computed views. Nothing to validate.

### Documents (`document-upload-form.tsx`, Part 6)

`title` required, min 3 chars; `category` required, one of the 6-value `DocumentCategory` list; `projectId` required; `visibleToCustomer` required boolean; `warrantyItem` / `warrantyExpiresAt` optional (see `docs/FILE_UPLOADS.md` for the file-selection side of this form, which isn't zod-validated at all — file presence/size/type checks live in the upload control itself, not this schema).

## Patterns worth naming once

- **`.superRefine()` for a discriminator-driven required field** (MRC lines, DPR work-item rows, Payment, GSTR): every one of these picks a `source`/`direction`/`type` value that changes which *other* fields on the same row become required. All four follow the identical shape — plain-optional at the object level, enforced conditionally in `.superRefine()`, each `ctx.addIssue()` pinned to the specific field path so `FormField`'s error message lands on the right input.
- **`.refine()` for a two-field ordering/presence check** (Vendor's GSTIN-when-registered, Schedule's end-after-start): a single derived boolean, one message, one path — used instead of `.superRefine()` when there's only one condition to express.
- **Two known-inconsistent gaps**, both logged in `docs/OPEN_QUESTIONS.md` #41 rather than fixed here, since fixing either means guessing at unconfirmed backend behavior: Stock/Wastage's `otherMaterialName` isn't actually required when `material === "other"` (unlike every other conditional-field pattern in this table, which *does* enforce it); Requisition's `predefined`-source line doesn't require `aceItemId` the way MRC's `grn`-source line requires `grnLineItemId`, even though both describe the same "picked from a list vs. typed by hand" shape.
- **Adapter-level (not form-level) validation** exists in exactly one module (GSTR) — everywhere else, "does this reference a real, appropriately-statused record" is left unchecked client-side. A backend re-implementing these rules should decide, module by module, whether that adapter-level check is the right precedent to extend (e.g. should creating an Invoice validate its `purchaseOrderId` is actually `issued`?) rather than assuming GSTR's stricter behavior is the intended norm everywhere.
