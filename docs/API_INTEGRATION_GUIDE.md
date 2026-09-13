# API Integration Guide

Populated Part 20; extended post-Part-20 stabilization pass (Phases 2, 3, 21). This is the concrete, step-by-step version of `docs/ARCHITECTURE.md` section G's boundary strategy — read that section first for *why* the app is shaped this way; this file is *how* to actually do the cutover, module by module.

## REST client foundation (added Phase 21)

`src/lib/api/http-client.ts` is a shared `fetch()` wrapper — `httpClient.get/post/patch/put/delete` plus the lower-level `apiRequest` they're built on — for a future `*.rest-adapter.ts` to use instead of hand-rolling request/response/error handling in each of the 26+ files below. **Nothing imports it yet**: there is still no backend to point at (`NEXT_PUBLIC_API_BASE_URL` remains an unset placeholder), so this is infrastructure staged ahead of the first real cutover, not a change to any existing adapter. It exists specifically so step 2 below ("translating each method into a `fetch()`/`axios` call") has a consistent starting point across every adapter, rather than 26 independently-invented conventions.

What it gives a `*.rest-adapter.ts` method for free: automatic JSON-body serialization and query-string building (`buildQueryString` — the same "an omitted/undefined/empty-string param means no filter" convention every mock adapter's own list params already follow, never serialized as the literal string `"undefined"`), and a thrown `ApiError` (a real `Error` — `.message` continues to work in every existing catch block unchanged, per `docs/ERROR_HANDLING.md`'s "no component branches on a status code today" note) that additionally carries `.status`/`.body` for a method that *does* want to branch (a `401` forced logout, say — see that same doc's "what a real backend must do" table). See the file's own header comment for the full reasoning and the specific decisions flagged as unconfirmed (error-body shape, cookie- vs. bearer-token auth by default). Unit-tested (`http-client.test.ts`) for its one piece of pure logic (`buildQueryString`) and `ApiError`'s shape — the `fetch()`-calling half needs a real endpoint or a mocked `fetch` to exercise, which is exactly why it isn't tested here; that coverage belongs with the first real `*.rest-adapter.ts`, per `docs/TESTING.md` item 2.

## The boundary, in one sentence

Every component calls a hook in `src/hooks/`; every hook calls an adapter's own public async method in `src/lib/api/adapters/`; **no component or hook ever calls `fetch()` directly.** `src/lib/api/adapters/README.md` (the adapters folder's own note, written back in Part 4 and still accurate) states the intended swap mechanism verbatim: *"Swapping to a live backend later means adding a `*.rest-adapter.ts` next to the mock one and changing a single import."* Everything below expands that one sentence into an actual procedure.

## The swap procedure, per module

Each adapter file (e.g. `src/lib/api/adapters/leads-adapter.ts`) has exactly three parts today: an exported `interface` (e.g. `LeadsAdapter`) plus its param/result types, a `MockXAdapter` class implementing that interface against an in-memory mock-data array, and one final line instantiating and exporting the singleton every hook imports: `export const leadsAdapter: LeadsAdapter = new MockLeadsAdapter();`.

To connect a real backend for that module:

1. **Leave the `interface` and its types exactly where they are.** They're already the frontend/backend contract — every field name, every param name, every response shape in `docs/API_CONTRACTS.md`'s corresponding section was written to match this interface, not the other way around.
2. **Write a new file, `<module>.rest-adapter.ts`, next to the mock one**, with a class (e.g. `RestLeadsAdapter`) implementing the same interface, translating each method into a `fetch()`/`axios` call against the real endpoint documented for it in `docs/API_CONTRACTS.md`. This is the only new code the cutover requires — no hook, no component, no type changes.
3. **Change the adapter file's final line** from `new MockLeadsAdapter()` to `new RestLeadsAdapter()` (importing the new class instead of, or alongside, the mock one). This is the "single import" the README promises — every hook that already imports `{ leadsAdapter }` from this same file path picks up the new implementation with zero changes on its side, because it only ever depended on the interface, never the class.
4. **Delete or keep the mock class and its mock-data file** at your discretion — nothing else in the app references `MockLeadsAdapter` by name (only by the exported `leadsAdapter` singleton and the `LeadsAdapter` interface type), so keeping it around as a `?mock=1`-style fallback, a Storybook fixture, or a `TESTING.md`-style test double (see `docs/TESTING.md` item 2) costs nothing and loses nothing by staying.

Repeat once per module. There are **26 adapter files** to work through (excluding `README.md`) — 25 as of Part 20, plus `store-requisitions-adapter.ts` added in the post-Part-20 stabilization pass (Phase 2); the table below is the checklist, in the same order `docs/API_CONTRACTS.md`'s sections run, each row naming the interface a `*.rest-adapter.ts` must implement and the doc section with its endpoint list. `schedule-adapter.ts`'s row covers `listProgressForActivities` too (the Phase 3 bulk-progress method) — no separate row, since it's one more method on the same interface, not a new module.

| Adapter file | Interface | `docs/API_CONTRACTS.md` section |
|---|---|---|
| `leads-adapter.ts` | `LeadsAdapter` | Lead Management |
| `contracts-adapter.ts` | `ContractsAdapter` | Contract Management |
| `customers-adapter.ts` | `CustomersAdapter` | Contract Management → Customer |
| `documents-adapter.ts` | `DocumentsAdapter` | Drawing & Document Management |
| `vendors-adapter.ts` | `VendorsAdapter` | Vendor Management |
| `ace-adapter.ts` | `ACEAdapter` | Accepted Cost Estimate |
| `requisitions-adapter.ts` | `RequisitionsAdapter` | Purchase / Material Requisition |
| `rfq-adapter.ts` | `RFQAdapter` | RFQ Management |
| `purchase-orders-adapter.ts` | `PurchaseOrdersAdapter` | Purchase Orders |
| `grn-adapter.ts` | `GRNAdapter` | Store Management — GRN |
| `stock-adapter.ts` | `StockAdapter` | Store Management — Stock Statement |
| `wastage-adapter.ts` | `WastageAdapter` | Store Management — Wastage |
| `mrc-adapter.ts` | `MRCAdapter` | MRC — Material Receipt Certificate |
| `store-requisitions-adapter.ts` | `StoreRequisitionsAdapter` | Store Material Requisition (MR, §6B — added Phase 2) |
| `schedule-adapter.ts` | `ScheduleAdapter` | Project Schedule + Tracking (incl. Phase 3's `listProgressForActivities`) |
| `dpr-adapter.ts` | `DPRAdapter` | Daily Progress Report |
| `cost-adapter.ts` | `CostAdapter` | Project Cost Accounting |
| `invoices-adapter.ts` | `InvoiceAdapter` | Payments & Receipts + Bank & Cash |
| `payments-adapter.ts` | `PaymentAdapter` | Payments & Receipts + Bank & Cash |
| `bank-adapter.ts` | `BankTransactionAdapter` | Payments & Receipts + Bank & Cash |
| `tax-records-adapter.ts` | `TaxRecordsAdapter` | Taxes, Fixed Assets & GSTR |
| `fixed-assets-adapter.ts` | `FixedAssetsAdapter` | Taxes, Fixed Assets & GSTR |
| `gstr-adapter.ts` | `GSTRAdapter` | Taxes, Fixed Assets & GSTR |
| `cost-to-complete-adapter.ts` | `CostToCompleteAdapter` | Cost-to-Complete + Cost Management placeholder |
| `notifications-adapter.ts` | `NotificationsAdapter` | Cross-Module Polish |
| `ops-metrics-adapter.ts` | `OpsMetricsAdapter` | Cross-Module Polish |

## The three pure-aggregate adapters need a decision, not just a swap

`cost-to-complete-adapter.ts`, `notifications-adapter.ts`, and `ops-metrics-adapter.ts` are different from the other 22: each has **no mock data file of its own** and computes its entire result on every call by composing *other* adapters' own public methods (`docs/DATA_MODELS.md` calls this the "pure, render-time computed aggregate" pattern; see `docs/OPEN_QUESTIONS.md` #39(f) and #40(a)). Once every adapter it depends on is swapped to a REST implementation, these three keep working completely unchanged — they never touched a mock array directly, only sibling adapters' public methods, so nothing about the cutover breaks them.

That said, a real backend gets a genuine choice here that this frontend never had to make: keep computing each of these three client-side by composing several REST calls (works today with zero further changes, but means a `Notifications` bell refresh is N sequential/parallel network calls, not one), or add a dedicated backend aggregate endpoint (`GET /api/notifications`, `GET /api/ops-metrics`, `GET /api/cost-to-complete/:projectId`) and swap just these three the same way as any other module. Either is a legitimate `*.rest-adapter.ts` implementation of the same interface — this is a performance/architecture decision for whoever owns the backend, not something the frontend's contract dictates either way.

## What doesn't change

- **Every component, every hook, every type in `src/types/domain/`.** The interface is the contract; nothing above the adapter boundary needs to know or care that the implementation swapped.
- **The permission/auth layer** (`docs/ROLES_AND_PERMISSIONS.md`, `docs/AUTHENTICATION.md`) is a separate cutover with its own doc — this guide's swap procedure covers data adapters only, not the mock `AuthProvider`/session model, which needs its own real backend integration (`docs/OPEN_QUESTIONS.md` #7) independent of any single module's adapter.
- **Loading/empty/error state components.** As `docs/ERROR_HANDLING.md` describes, every hook already exposes an `idle`/`loading`/`success`/`error` status regardless of what's behind the adapter — a `RestXAdapter` that takes longer to resolve, or rejects with a real HTTP error, is handled by the exact same `LoadingSkeleton`/`EmptyState`/`ErrorState` machinery already wired up. The one thing worth adding at this layer (not required, but recommended) is HTTP-status-code branching inside each `*.rest-adapter.ts` method — mapping a `401` to a forced logout, a `409` to the adapter's existing plain-`Error`-message convention, etc. — exactly where `docs/ERROR_HANDLING.md`'s "what this means for a real backend" table says that branching belongs.

## Suggested order

Follow dependency order, not `docs/API_CONTRACTS.md`'s reading order: swap `customers-adapter.ts` and `leads-adapter.ts` first (nothing else depends on them), then work down the chain each cross-adapter composition actually calls — `ace-adapter.ts` → `requisitions-adapter.ts` → `rfq-adapter.ts` → `purchase-orders-adapter.ts` → `grn-adapter.ts` → `mrc-adapter.ts`/`gstr-adapter.ts`, and separately `contracts-adapter.ts` → `mrc-adapter.ts` (customer-facing acceptance flows) and `schedule-adapter.ts` → `dpr-adapter.ts` (the Part 14 progress push documented in `docs/OPEN_QUESTIONS.md` #35d). Save `cost-to-complete-adapter.ts`, `notifications-adapter.ts`, and `ops-metrics-adapter.ts` for last — they depend on the others being real, working adapters to compose against, and there is no reason to touch them before then.
