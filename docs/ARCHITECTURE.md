# BrickBasket Frontend — Architecture Assessment (Phase 0)

Status: **Approved baseline** — supersedes any earlier informal scope. Reconciled from `BrickBasket_Master_Frontend_Prompt_v6.1`, the `Requirements_Reconciliation_Report`, the owner requirements, and the six approved UI references.

## A. What this project actually is

BrickBasket is **not** a marketing website with a customer login bolted on. It is an enterprise **construction operations platform** with a premium public-facing website in front of it. Two audiences, two different UI systems, one design language:

1. **Public marketing site** — lead generation, brand trust, company information. Red/charcoal/white premium construction identity (confirmed by the six approved reference images).
2. **Operational application** (customer portal + internal admin/ops app) — role-based, dense, table- and workflow-heavy, covering the full chain: Lead → Contract → Drawings → Vendors → ACE → Requisition → RFQ → PO (2-level approval) → GRN → Stock/Wastage → MRC → Schedule/DPR → Project Cost → Payments/Bank/Tax/Assets/GSTR → Cost-to-Complete.

The frontend is built as **Track A** of a two-track delivery: this repository + its `/docs` become the implementation contract that a separate **Track B backend Claude session** implements against. Nothing here fakes a production backend — every screen that needs persistence sits behind a typed adapter boundary currently backed by mock data.

## B. Route / module map

Three route groups inside one Next.js 15 App Router project, sharing the design system but each with its own layout shell:

| Group | Base path | Audience | Layout shell |
|---|---|---|---|
| `(public)` | `/` | Anonymous visitors, leads | Marketing header/footer |
| `(portal)` | `/dashboard/*` | Authenticated customers | Portal shell (lighter nav, project-scoped) |
| `(internal)` | `/admin/*` | Staff: PM, engineer, purchaser, store, finance, approver, admin | Full operational AppShell (sidebar, topbar, project selector) |

Full route inventory is maintained in `docs/ROUTES.md` — it is the same tree specified in the master prompt, with every leaf route scaffolded (even as a placeholder) so the module map is real and not aspirational.

## C. Role / access model

The owner requirements imply role-differentiated behavior but do not supply a finished permission matrix (flagged in `docs/OPEN_QUESTIONS.md`). The frontend therefore does **not** hardcode "admin sees everything." It implements a **capability-string permission model**:

- `currentUser: { id, name, email, roles: Role[], permissions: PermissionKey[] }`
- `Role` is one of: `admin`, `customer`, `project_manager`, `site_engineer`, `purchaser`, `store_personnel`, `finance`, `approver` (extensible — "other future operational roles" per the prompt).
- `PermissionKey` follows `<module>:<action>` (e.g. `leads:read`, `vendors:write`, `po:approve:level1`, `po:approve:level2`, `finance:read`, `cost_management:view`).
- A default **role → permission-set** mapping ships as mock/config data (`src/lib/permissions/role-permission-map.ts`), clearly labeled as a frontend default the backend will own once real RBAC exists.
- UI enforcement via two composables: `<RoleGuard roles={[...]}>` and `<PermissionGuard permission="...">`, plus a `usePermission()` hook for conditional rendering (hide/disable nav items and actions).
- **This is UX-layer defense only.** `docs/ROLES_AND_PERMISSIONS.md` states explicitly that the backend is the authoritative enforcement boundary — repeated from the master prompt's own instruction so it can't be missed during backend implementation.

## D. Cross-module data flow

The frontend models relationships with IDs/references, never denormalized duplication. Two chains matter most and drive the component design (timelines, linked badges, "traced from" panels):

**Procurement → cost chain**
`ACE → Purchase/Material Requisition → RFQ → Vendor Quotes → Comparison/L1 → Purchase Order → 2-level Approval → Issue → GRN → Stock/Wastage → MRC → Project Cost Accounting → Payments → Cost-to-Complete`

**Sales/legal chain**
`Lead → Contract (dual acceptance) → Customer → stored in both Admin + Customer modules`

**Supporting chains**
`Drawings/Documents → Project/Customer/Admin visibility` · `Schedule ↔ DPR → Progress/Delay` · `PO/GRN/Vendor Invoice → Project Cost` · `Vendor/PO/Invoice/Tax → Finance/GSTR/Cost-to-Complete`

Full entity relationship inventory: `docs/DATA_MODELS.md`. Workflow/state-machine detail per chain: `docs/WORKFLOWS.md`.

### D2. Finance data authority (added post-Part-20 stabilization pass, Phase 15–17)

The chain above lists `Project Cost Accounting → Payments → Cost-to-Complete` as if figures flow between them in that order. **They don't, in this build, and this section exists specifically to stop a future session from assuming they do and silently wiring them together without owner confirmation.** Parts 15, 16, and 17 were each built independently, in part-number order, against the owner's own independent §8 bullets — none of the three financial modules built after Part 15 (Payments/Bank & Cash, Taxes/Fixed Assets/GSTR) was ever asked to feed back into `CostEntry`, and none does. Below is the authoritative source for every financial figure this app shows, and — just as important — what does *not* feed it:

| Figure | Authoritative source | Does **not** come from |
|---|---|---|
| `CostEntry.actualAmount` (Project Cost Accounting, Part 15) | **Manually typed** on `CostForm`, one row per project × category | `Payment`/`Invoice` (Part 16) — Payments & Receipts didn't exist yet when Part 15 was built, and no later part retrofitted the link. This is `docs/OPEN_QUESTIONS.md` #36b. |
| `Invoice.paymentStatus`, `Payment`/`BankTransaction` totals (Part 16) | Their own adapters (`invoices-adapter.ts`/`payments-adapter.ts`/`bank-adapter.ts`), a self-contained ledger | `CostEntry` — a `Payment` is never summed into any `CostEntry.actualAmount`, even for the same project/category. |
| `TaxRecord`/`FixedAsset`/`GSTRRecord` (Part 17) | Their own adapters, each fully independent | `CostEntry`, `Payment`, and each other — the three don't reference one another either, beyond `GSTRRecord`'s own optional `Contract`/`GRN` link (`docs/DATA_MODELS.md`). |
| `CostToComplete` (Part 18) | **The one module that actually cross-composes others** — `costAdapter` (Part 15, for Original Estimate A and Completed-till-date B) + `aceAdapter`/`purchaseOrdersAdapter`/`rfqAdapter` (Parts 8–10, for ordered-not-completed tracing) | `Payment`/`Invoice`/`TaxRecord`/`FixedAsset`/`GSTRRecord` (Parts 16–17) — none of those three modules' figures enter the Cost-to-Complete computation at all, per `docs/OPEN_QUESTIONS.md` #39. A backend implementation is free to add that linkage once the owner confirms it should exist; this frontend doesn't guess at the formula that would require. |
| `/admin/cost-management` (Part 18) | **Nothing** — no type, no adapter, no mock data, no business logic, per the owner's explicit §8H "DO NOT invent this module's detailed business rules" instruction | Everything — this is the one deliberate, permanent gap in the chain, not an oversight. **Guardrail for future work on this app**: do not infer Cost Management's rules from `CostToComplete`'s formulas, from any other finance module's shape, or from this app's own conventions elsewhere — build it only from Pushkar Tiwari's Excel spec once delivered, per this pass's own explicit standing instruction not to invent it. |

None of this is a defect to fix — every module above does exactly what its own Part's owner text asked for, independently. It's flagged here because the diagram at the top of this section, read on its own, invites the wrong mental model.



Three layers, so business screens never duplicate presentation logic:

1. **Primitives** (`src/components/ui/`) — shadcn/ui-pattern building blocks: Button, Input, Select, Dialog, Sheet, Tabs, Table, Badge, Card, Tooltip, DropdownMenu, Form/FormField wrappers. Unopinionated, no business meaning.
2. **Shell components** (`src/components/shell/`) — AppShell, Sidebar, Topbar, Breadcrumbs, PageHeader, ProjectSelector, RoleGuard/PermissionGuard, mobile nav.
3. **Domain components** (`src/components/domain/`) — the operational vocabulary specified in the master prompt: MetricCard, StatusBadge, DataTable, FilterBar, SearchInput, EmptyState, ErrorState, LoadingSkeleton, ConfirmationDialog, FormSection, FileUpload, DocumentViewer (boundary only), ApprovalTimeline, AuditTimeline, StatCard, ProgressBar, ProgressRing, ChartCard, CostVarianceIndicator, QuantityInput, LineItemEditor, QuoteComparisonTable, ResponsiveTable, MobileCardList, Toast pattern.

Full build order and per-component notes: `docs/COMPONENT_GUIDE.md` (filled in as each part ships — not written all at once, per the master prompt's incremental rule).

## F. Folder structure

```
brickbasket-frontend/
├── docs/                          # backend-handoff contract (see section H)
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/              # marketing site
│   │   ├── (portal)/dashboard/    # customer portal
│   │   ├── (internal)/admin/      # internal operations app
│   │   └── layout.tsx, globals.css
│   ├── components/
│   │   ├── ui/                    # primitives
│   │   ├── shell/                 # AppShell, nav, guards
│   │   ├── domain/                # DataTable, MetricCard, timelines...
│   │   └── marketing/             # public site sections
│   ├── data/mock/                 # isolated mock datasets, one file per entity
│   ├── lib/
│   │   ├── api/client/            # fetch wrapper, error normalization
│   │   ├── api/contracts/         # zod schemas mirroring OpenAPI
│   │   ├── api/adapters/          # one adapter per module; mock-backed today
│   │   ├── auth/                  # mock auth adapter, session shape
│   │   ├── permissions/           # role→permission map, guards
│   │   └── constants/             # route table, status enums, design tokens refs
│   ├── types/domain/              # one file per business entity
│   ├── hooks/                     # data hooks wrapping adapters (React Query-ready)
│   └── styles/
├── tailwind.config.ts, next.config.ts, tsconfig.json, package.json
```

This is the structure the master prompt asked for (`src/data/mock`, `src/lib/api/{client,contracts,adapters}`, `src/types/domain`), extended with `components/shell` and `components/domain` to keep the huge operational component set organized.

## G. API integration boundary strategy

Components **never** call `fetch` directly. The call path is always:

`Component → hook (src/hooks) → adapter (src/lib/api/adapters/<module>.ts) → { mock implementation today | real client (src/lib/api/client) tomorrow }`

Every adapter implements a typed interface (e.g. `LeadsAdapter`) with methods like `list()`, `get(id)`, `create()`, `update()`, `transition(status)`. Today every adapter's concrete implementation reads/writes `src/data/mock/*`. Swapping to a live backend means writing one new file (`*.rest-adapter.ts`) per module and changing one import — no component changes required. This boundary is what makes the mock-data rule ("never mix mock data with production API code") mechanically enforceable rather than a style guideline.

`docs/API_CONTRACTS.md` documents every API-dependent screen against the full checklist in the master prompt (method, endpoint, auth, roles, request/response schema, error states, etc.). `docs/openapi.yaml` is generated from the same contracts once they stabilize per module — never fabricated ahead of the UI.

## H. Documentation structure

The full `/docs` tree required by the master prompt was created up front as a skeleton (so nothing would be forgotten) and filled in **module by module** as each part shipped — writing all 23 files in full before any screen existed would itself have been inventing detail. As of Part 20 (the roadmap's final part), every one of the 23 required files plus `docs/openapi.yaml` carries real, non-invented content: `README.md`, `ARCHITECTURE.md` (this file), `ROUTES.md`, `MODULES.md`, `ROLES_AND_PERMISSIONS.md`, `DATA_MODELS.md`, `API_CONTRACTS.md`, `API_INTEGRATION_GUIDE.md`, `BACKEND_CLAUDE_HANDOFF.md`, `FRONTEND_BACKEND_HANDOFF.md`, `OPENAPI.md` + `openapi.yaml`, `WORKFLOWS.md`, `STATUS_DEFINITIONS.md`, `FILE_UPLOADS.md`, `AUTHENTICATION.md`, `NOTIFICATIONS.md`, `VALIDATION_RULES.md`, `ERROR_HANDLING.md`, `ENVIRONMENT_VARIABLES.md`, `COMPONENT_GUIDE.md`, `TESTING.md`, `CHANGELOG.md`, `OPEN_QUESTIONS.md`, `BRAND_GUIDELINES.md`. No file in this directory carries a "pending" stub any longer — the last 7 (`API_INTEGRATION_GUIDE.md`, `BACKEND_CLAUDE_HANDOFF.md`, `ERROR_HANDLING.md`, `FRONTEND_BACKEND_HANDOFF.md`, `OPENAPI.md`, `TESTING.md`, `VALIDATION_RULES.md`) plus `openapi.yaml` itself were populated in Part 20, closing out this section's earlier "the rest carry a stub" note.

## I. Open questions requiring client/backend confirmation

See `docs/OPEN_QUESTIONS.md` for the full, living list. Headline items carried over unchanged from the reconciliation report:

1. Vendor Series 6 (Design/Detailing/Consultancy) is written by the owner as "60001+" while every other series is six digits (100001+ … 500001+). Preserved verbatim; flagged, not silently corrected to 600001+.
2. Full role → permission matrix is not finalized.
3. Workflow/status vocabulary beyond "two-level PO approval" (e.g. lead pipeline stages, requisition states) is not finalized — frontend uses clearly-labeled configurable/demo values.
4. Cost Management module business rules are explicitly pending a separate Excel specification from Pushkar Tiwari — built as an integration-ready placeholder only.
5. All sample dates (Oct-26–Mar-27) and monetary figures (₹77L budget example, etc.) are illustrative, not production facts, and are rendered from clearly-labeled mock data.
6. MRC customer-acceptance step: owned by portal, admin, or both concurrently — TBD.
7. Auth/session model (JWT vs. server session, refresh strategy) — TBD, frontend built against an abstract session shape.
8. File storage provider and per-category size/type limits — TBD.

## J. Recommended implementation order

Work proceeds in the 20 controlled feature units defined in `docs/PART_PROMPTS.md`, in dependency order: foundation → public site → auth/app shell → leads → contracts → documents → vendors → ACE/requisition → RFQ → PO → store (GRN/stock/wastage) → MRC → schedule → DPR → project cost → payments/bank → tax/assets/GSTR → cost-to-complete → cross-module polish → final backend handoff package. Each part is independently shippable, documented, and stops for review before the next begins — this mirrors the master prompt's own "Phase 1+" working mode exactly.
