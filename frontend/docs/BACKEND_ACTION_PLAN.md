# Backend Implementation Action Plan — Start to Finish

**Purpose of this document**: `docs/BACKEND_CLAUDE_HANDOFF.md` is the *specification* — it tells a backend team everything that's confirmed, everything that's a frontend guess, and exactly which doc has the detail on each point. This document is the *sequence* — what to actually do, in what order, so the backend team isn't left to figure out sequencing themselves from a 22-section reference doc. Read the handoff doc for **what** to build; read this one for **in what order and how to know each step is done**.

Every phase below names its exit criteria and the doc(s) to consult for detail. Nothing here invents a business rule or a technical decision that isn't already made elsewhere — where a real decision is still needed (framework, hosting, auth token shape, etc.), that's called out as a decision point, not silently assumed.

---

## Phase 0 — Orientation (before writing any code)

**Goal**: everyone on the backend side has the same complete picture before a single line of backend code is written.

1. Read `docs/BACKEND_CLAUDE_HANDOFF.md` in full, start to finish — it's written specifically so this is the only doc you need before opening anything else.
2. Read the owner's own original requirement documents (named in that doc's §3 — the Master Frontend Prompt, the Requirements Reconciliation Report, the Owner Requirements Screenshots) directly. The handoff doc summarizes them; it never replaces them as the source of truth.
3. Read `docs/OPEN_QUESTIONS.md` in full (65 entries as of this plan). Sort them into three buckets before writing any code:
   - **Blocking** — a real decision is needed before the relevant module can be built at all (the standout example: §6 Authentication is "entirely unconfirmed," `docs/OPEN_QUESTIONS.md` #7 — no password strategy, no session shape, nothing to build against yet).
   - **Safe-to-proceed-provisionally** — the frontend already made a reasonable interim call (e.g. most `docs/VALIDATION_RULES.md` rules) and building against it now, flagged the same way, is lower-risk than blocking on it.
   - **Deferred** — genuinely fine to leave open past initial launch (e.g. #17's placeholder production domain).
4. **Schedule time with the owner specifically for the Blocking bucket** before Phase 1 starts. Authentication (§6) should be first on that call — every other module's authorization depends on it existing.
5. Pick and record the actual technology decisions this doc deliberately doesn't make: language/framework, database engine, hosting/infra, file storage provider (§15 — S3-compatible or equivalent, `docs/OPEN_QUESTIONS.md` #8), and the auth token shape (httpOnly cookie vs. bearer JWT — `docs/OPENAPI.md` explains why a cookie was used as `docs/openapi.yaml`'s placeholder, without that being a confirmed decision). Write these decisions down somewhere durable (a new `docs/BACKEND_TECH_DECISIONS.md` is a reasonable place) so they don't have to be re-litigated mid-build.

**Exit criteria**: the Blocking bucket from step 3 has answers, the tech-stack decisions from step 5 are recorded, and everyone building has read §§1–5 of the handoff doc at minimum.

---

## Phase 1 — Foundations

**Goal**: the two things every other module depends on — the database and real authentication/authorization — exist and are independently testable, before any business-module endpoint is built.

1. **Database schema.** Build every table in `docs/DATA_MODELS.md`, using `src/types/domain/*.ts` (34 files) as the authoritative field-level shape — that's the same ground truth `docs/openapi.yaml`'s 96 component schemas were generated from, so schema, types, and OpenAPI spec should never disagree. Pay particular attention to:
   - The two deepest relationship chains named in handoff §9 (Requisition→RFQ→PO→GRN→MRC/GSTR, and the Cost-to-Complete 4-adapter join) — get the foreign keys and indexes right here, before any endpoint calls them.
   - The three pure-aggregate entities that get **no table at all** (`CostToCompleteSummary`, `AppNotification`, `OpsMetric` — handoff §17) — don't build tables for these; they're computed from other tables' data at read time (or via a cached/materialized view later, per that section's own recommendation).
   - The new, deliberately-unbuilt `ConstructionPackage`/`PackageComparisonRow`/`EstimatorConfig` shape in `docs/DATA_MODELS.md` — **skip this in Phase 1**; see Phase 6 below for why it's handled separately.
2. **Authentication.** Implement real session/token issuance and verification, password storage (proper hashing — the mock has zero password verification today, per handoff §6), a password-reset flow, and session-expiry/refresh behavior. This resolves `docs/OPEN_QUESTIONS.md` #7 and #18 — both should already have owner answers from Phase 0, step 4.
3. **Authorization middleware.** Implement server-side enforcement of every `PermissionKey` in `docs/ROLES_AND_PERMISSIONS.md` — the frontend's permission system is UX-layer only and must be independently re-checked here, per handoff §5's "every permission gate must be independently re-checked server-side." Treat the shipped `ROLE_PERMISSIONS` map as a working default to re-verify against the owner (`docs/OPEN_QUESTIONS.md` #2 — the full role→permission matrix, including who holds PO Approval Level 1 vs. Level 2, is not itself owner-confirmed), not a confirmed final answer to encode blindly.
4. **Customer-scoping enforcement.** Build this as a first-class, reusable piece of middleware now, not per-endpoint later — several list endpoints (Contracts, Documents, MRC, Payments) must independently scope any customer-role request to that customer's own records, never trusting a client-supplied `customerId` filter (handoff §5). Getting this wrong is a data-leak bug, not a cosmetic one — worth a dedicated test suite before any customer-facing endpoint ships.
5. **The shared error contract.** Implement the single `{ error: { code, message } }` shape and the standard status codes from `docs/ERROR_HANDLING.md` globally (middleware/exception-handler level), before individual endpoints, so every module built afterward gets it for free instead of reimplementing it 25 times.

**Exit criteria**: you can register/log in as each of the 8 roles, a request without the right permission gets a real `403` (not just a hidden UI element), a customer role genuinely cannot see another customer's records by editing a query param, and every error response — even a deliberately-triggered one from an empty endpoint — matches the shared shape.

---

## Phase 2 — Core modules, in dependency order

**Goal**: build and expose the 83 documented endpoints (handoff §10, full detail in `docs/API_CONTRACTS.md` and `docs/openapi.yaml`), in an order where each module's dependencies already exist by the time you build it.

Build in this order — it follows the actual `references`/composition chain each adapter's own code calls, not `docs/API_CONTRACTS.md`'s reading order (that document's own `docs/API_INTEGRATION_GUIDE.md` companion makes the same distinction for the frontend-swap direction; this is the equivalent for building from zero):

1. **Leads + Customers** — nothing else depends on them, and Leads is the one public, unauthenticated endpoint (`POST /api/leads`) — get rate-limiting/CAPTCHA on it right early (handoff §5), since it's the one surface an anonymous visitor can hit.
2. **Contracts + Documents** — Contracts' state machine (`draft → sent_for_acceptance → accepted/declined`, handoff §14) is one of only five modules with a real status gate; get the gate logic right here since later modules copy the same pattern.
3. **Vendors** (+ assessment).
4. **ACE (Accepted Cost Estimate)** — a dependency of Requisitions below.
5. **Requisitions** (`draft → submitted → approved/rejected`) → **RFQ** (`draft → finalized`, one-way) → **Purchase Orders** (the five-state gate: `draft → pending_approval_l1 → pending_approval_l2 → approved → released → issued`, with a `rejected` branch off either level) → **GRN** + **Stock** + **Wastage** → **MRC** (`draft → issued → accepted/declined`) — this is the deepest chain in the app (handoff §9); each step's endpoint genuinely can't be tested end-to-end until the one before it exists, so build and integration-test them in this exact order rather than in parallel.
6. **Schedule** → **DPR** — implement the one real cross-module side effect here: a DPR work-item line carrying a `scheduleActivityId` must also append a new `ScheduleProgressEntry`, computed as that activity's own latest `executedQuantity` plus this line's `todayQty` (not the DPR line's own cumulative figure), skipping rather than failing the request on a stale/cross-project link (handoff §14, full reasoning in `docs/OPEN_QUESTIONS.md` #35d/e).
7. **Cost Accounting (Cost Entries)** → **Invoices/Payments/Bank Transactions** → **Tax Records/Fixed Assets/GSTR** — the one owner-confirmed validation rule in the entire app lives here (`FixedAsset.value > ₹5,000`, `docs/VALIDATION_RULES.md`) — everything else in this group is a frontend-invented default, safe to adjust once confirmed, but re-implement server-side regardless (client validation has zero enforcement power today).
8. **Store Material Requisitions (MR)** — the newest module (added in the post-Part-20 stabilization pass); note it deliberately has no audit-log entity of its own (handoff §18) and the mock adapter's `issue()` does not decrement stock — the real backend's issuance endpoint must do that decrement as part of a single transaction with the status flip, per the explicit 8-step transaction `docs/API_CONTRACTS.md` documents for this endpoint. Do not treat the mock's shortcut here as a spec to preserve.
9. **Cost-to-Complete, Notifications, Ops Metrics** — build these last, deliberately. All three are pure computed aggregates over the modules above (handoff §17), so there's no reason — and real risk of rework — in building them before their inputs are real, working endpoints. Cost-to-Complete in particular is the single most complex derived-financial-data path in the app; read `docs/OPEN_QUESTIONS.md` #39 in full (eight separate frontend decisions, none owner-confirmed) before implementing it, and strongly consider a materialized/cached aggregate rather than a live 4-table join per request (handoff §9's own recommendation).

**For every module above**, before marking it done: re-check its section of `docs/VALIDATION_RULES.md` (field-level rules to re-implement server-side), `docs/STATUS_DEFINITIONS.md` (if it has a status enum), `docs/WORKFLOWS.md` (if it participates in a cross-module chain), and whether it has a dedicated audit-log entity per handoff §18's module-by-module list (only Contract, Requisition, Purchase Order, and Lead do — don't add one elsewhere by default).

**Exit criteria**: all 83 documented endpoints respond correctly against the request/response schemas in `docs/openapi.yaml`, every status-machine module rejects an invalid transition with `409`, and the three aggregate endpoints in step 9 return correct numbers when queried against real data produced by steps 1–8.

---

## Phase 3 — Cross-cutting systems

These don't belong to any one module, so they're easy to under-build if left implicit. Handle them as their own explicit workstream, ideally in parallel with Phase 2 rather than after it:

- **File storage** (handoff §15) — no real file bytes exist anywhere in the current build; Documents and Invoice attachments are metadata-only today. Stand up the real storage provider decided in Phase 0, and implement either an embedded URL on the response or a dedicated `/api/documents/:id/file` redirect (`docs/API_CONTRACTS.md`'s own suggested options — pick one, it's an implementation choice, not a confirmed contract). Document versioning is append-only — never build a delete/archive endpoint for it (`docs/OPEN_QUESTIONS.md` #26).
- **Audit logging** — implement it exactly where handoff §18 says it exists (Contract, Requisition, Purchase Order, Lead) and nowhere else by default; this is a deliberate scope reduction the owner's own text supports, not an oversight to "complete."
- **Notifications** (handoff §16) — the frontend's model is fully computed-on-read with nothing persisted or pushed. A real backend can keep that shape or move to an event/webhook model; either is a legitimate implementation of the same `GET /api/notifications` contract — this is a genuine either/or, not a gap.
- **ID/reference-number generation and actor attribution** — audit every mutating endpoint for handoff §5's two universal rules: the backend, never the client, assigns every `id`/`contractNumber`/`poNumber`/`grnNumber`/timestamp, and every `actorId`/`actorName`/`assessedBy`/`preparedBy`-type field comes from the authenticated session, never the request body — even though the mock adapters currently accept these as plain parameters. This is a mock-only shortcut, not a contract to preserve, and it's the single easiest thing to accidentally copy from the mock's convenience into the real API.

---

## Phase 4 — Frontend integration

**Goal**: point the existing, already-built frontend at the new real backend with zero changes above the adapter boundary.

1. Confirm the boundary still holds: every component calls a hook, every hook calls exactly one method on an adapter interface (`src/lib/api/adapters/`), and no component or hook calls `fetch()` directly (handoff §4). If that's still true — and it should be, since no frontend work in this handoff touched that boundary — integration is mechanical.
2. Follow `docs/API_INTEGRATION_GUIDE.md`'s per-adapter swap procedure and its **Suggested order** section exactly: `customers-adapter.ts`/`leads-adapter.ts` first, then down the same dependency chain as Phase 2 above (`ace` → `requisitions` → `rfq` → `purchase-orders` → `grn` → `mrc`/`gstr`, separately `contracts` → `mrc` and `schedule` → `dpr`), saving `cost-to-complete-adapter.ts`/`notifications-adapter.ts`/`ops-metrics-adapter.ts` for last. This order isn't arbitrary — it's the actual call graph, so swapping out of order means testing against adapters that still call into mocks.
3. Add the one new environment variable this integration needs (`NEXT_PUBLIC_API_BASE_URL` or a server-only equivalent — `docs/ENVIRONMENT_VARIABLES.md` already flags this as the expected addition) and confirm no secret ever lands in a `NEXT_PUBLIC_*` variable.
4. Re-run `docs/FRONTEND_BACKEND_HANDOFF.md`'s 16-item Integration Checklist against the real backend, not just the mock — it was signed off against the mock at the end of Part 20; re-verifying rows 1–3, 8, 9, and 16 in particular (contract accuracy, backend-responsibility completeness, open-questions currency) against the real implementation is the actual point of having a checklist, not a one-time formality.

**Exit criteria**: the frontend runs end-to-end against the real backend with every adapter swapped, the Integration Checklist is re-signed, and no `Mock*Adapter` import remains in a production build.

---

## Phase 5 — Testing

`docs/TESTING.md` is honest that **no component or end-to-end test infrastructure exists in this repository at all** — 17 existing test files cover pure math, the REST-client foundation, and 11 named adapter workflows against the mock, and that's the actual ceiling of pre-built test coverage. This is genuinely new ground for whoever builds the backend, not a gap to blame on the frontend build:

1. Stand up a real integration-test suite against the actual backend (not the mock) for at least the same 11 workflows `docs/TESTING.md` already names for the mock (Contract accept/decline, Requisition approve/reject, RFQ→comparison→finalize, PO's two-level approval, Store MR's full lifecycle, the three DPR/Schedule interactions, GRN's receipt constraints, MRC issue/response, Cost-to-Complete's core derivation) — these are the workflows most likely to have a real bug the mock's simplicity hid.
2. Add authorization tests specifically: for each `PermissionKey`, confirm a request without it gets `403`, and for customer-scoping, confirm cross-customer access genuinely fails (Phase 1, step 4) — these are exactly the two things a mock adapter architecturally cannot test, since it never enforced them.
3. Add contract tests against `docs/openapi.yaml` if your stack supports it, so the OpenAPI spec and the real implementation can't silently drift apart the way `docs/API_CONTRACTS.md` warns against.

**Exit criteria**: the 11 named workflows and the authorization/customer-scoping cases above all have a real, running test — a component/e2e suite is a reasonable next step but not a hard blocker for launch the way these are.

---

## Phase 6 — Decision point: Pricing & Packages Content

This is intentionally its own phase, separate from Phase 2, because — unlike every module in that phase — it is not yet decided that it should be built at all.

- `docs/OPEN_QUESTIONS.md` #65 audited the public Cost Estimator/`/plans` package pricing and found it has none of the entity/adapter/admin-screen/API-contract stack every other module gets, and nothing in the original 20-part build or this handoff ever planned to give it one — this content was always treated as static marketing copy, not a data-driven module.
- A placeholder route (`/admin/pricing-content`, permission `pricing_content:view`, admin-only) and a fully-specified-but-unconfirmed proposed shape (`docs/DATA_MODELS.md`'s `ConstructionPackage`/`PackageComparisonRow`/`EstimatorConfig` section, `docs/API_CONTRACTS.md`'s matching 7-endpoint sketch) already exist, so if the answer is "build it," nothing needs re-deriving from the estimator's UI.
- **Before touching this in Phase 2's schema step**, get an explicit owner answer: should package pricing/estimator config become a real, database-backed, admin-editable module — or deliberately stay a rate card the dev team maintains directly in code, the same way `FixedAsset.value`'s `FIXED_ASSET_MIN_VALUE` does today? If "no," this phase is simply skipped and the placeholder route can stay as-is or be removed — either is fine, and no backend work is owed here. If "yes," it slots into Phase 2 as its own module, built the same way every other module was.

---

## Phase 7 — Go-live

1. Re-run the full Phase 0 open-questions triage — confirm every item that was Blocking has an actual answer on record, not just a plan to get one.
2. Confirm `docs/ENVIRONMENT_VARIABLES.md` is current for the real deployment (production API base URL, the real domain replacing the current placeholder per `docs/OPEN_QUESTIONS.md` #17, any secrets — none exist in the frontend today and none should be added as `NEXT_PUBLIC_*`).
3. Run the Phase 5 test suite against a production-like environment, not just locally.
4. Sign off the Phase 4 Integration Checklist one final time in the actual production configuration.
5. Update `docs/CHANGELOG.md` and `docs/OPEN_QUESTIONS.md` with the outcome of every question this build resolved — close them out explicitly rather than leaving them stale once the real answer exists. This is the same discipline the frontend build held itself to throughout (every one of its 65 open questions is logged rather than silently assumed); the backend build inherits that discipline, it doesn't get a pass on it.

---

## Ongoing discipline, after go-live

`docs/OPEN_QUESTIONS.md` is a living document, not a one-time checklist. The single rule that produced a frontend build the backend team could hand off to at all was: **never silently resolve an open question elsewhere in code without a corresponding row update in that file.** Keep that rule alive on the backend side of this project too — an assumption made once during a rushed sprint and never written down is exactly how a project like this one accumulates undocumented debt the next team has to rediscover the hard way.
