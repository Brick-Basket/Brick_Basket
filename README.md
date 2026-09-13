# BrickBasket Frontend

Enterprise construction-operations platform frontend, and the backend-handoff contract package, for **BrickBasket**. This is the root README — a self-contained orientation for anyone (human or another Claude session) opening this repository for the first time. Deeper detail on any topic below lives in `docs/`; this file tells you which doc to open and what to expect from it, rather than repeating it.

## 1. Project purpose

BrickBasket is a construction and real-estate company. This repository is the frontend for its internal operations platform — the full lifecycle from a public-website lead, through contract, vendor management, procurement (requisition → RFQ → purchase order → goods receipt), site execution (daily progress reports, schedule tracking, store material requisitions), through to finance (project cost accounting, payments, taxes, cost-to-complete) — plus the public marketing site and a customer-facing portal.

**There is no production backend, database, or auth server in this repository.** Every data-access call goes through a typed adapter (`src/lib/api/adapters/*`), each currently backed by an in-memory mock-data implementation (`src/data/mock/*`). The `docs/` folder is simultaneously the working design record for this build and the contract a separate backend implementation must satisfy — see §12 below.

## 2. Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript (strict mode).
- **Styling**: Tailwind CSS, with brand tokens as CSS variables (`src/app/globals.css`) — never a hardcoded hex value in a component.
- **Forms/validation**: `react-hook-form` + `zod`.
- **Testing**: Vitest (unit tests for pure logic modules — see `docs/TESTING.md`).
- **Icons**: `lucide-react`. **No state-management library, no data-fetching library, no UI component library** beyond this app's own `src/components/ui/*` primitives (a deliberate scope decision — see `docs/ARCHITECTURE.md`).

## 3. Prerequisites

- Node.js 20 or later (Node 22 is what this environment's own tooling reports; anything on the Next.js 15 supported range is fine).
- npm (this repo has no `pnpm-lock.yaml`/`yarn.lock` — use npm to keep a single lockfile).
- **No environment variables are required to run this app** — see §9. No database, no external service, no API key.

## 4. Install

```bash
npm install
```

This generates `package-lock.json` on first run. **A note on this specific repository's history**: the environment this repository was most recently hardened in has no outbound access to the npm registry at all (an organization-level egress policy denies `registry.npmjs.org` outright), so `npm install` — and therefore a real `package-lock.json` — could not be produced or verified there. If you are reading this from a clone that still has no `package-lock.json` committed, that is why; run `npm install` in an environment with real registry access and commit the resulting lockfile. Every dependency version in `package.json` has still been chosen deliberately (see `docs/CHANGELOG.md`'s hardening-pass entry for the security reasoning behind the exact `next`/`react`/`react-dom` versions pinned there) — this note is about the lockfile's provenance, not the version choices.

## 5. Dev command

```bash
npm run dev
```

Runs at `http://localhost:3000`. Sign in at `/login` — see §10 for demo accounts (no real credential verification exists; any non-empty password is accepted for a recognized demo email).

## 6. Production build

```bash
npm run build
npm run start   # serves the production build
```

## 7. Test command

```bash
npm test
```

Runs Vitest once (`vitest run`, not watch mode). See `docs/TESTING.md` for exactly what is and isn't covered — today this is unit tests for pure calculation/validation modules (`*-math.ts` files) and a set of focused adapter-workflow tests (see that doc for the full list), not component or end-to-end tests.

## 8. Lint / typecheck

```bash
npm run lint        # eslint .
npm run typecheck   # tsc --noEmit
```

## 9. Environment variables

See `.env.example` at the repo root and `docs/ENVIRONMENT_VARIABLES.md` for the authoritative, always-current list. As of this README, there is exactly one:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | No — falls back to a placeholder | Used for `metadataBase`/Open Graph tags. Set to the real production domain before launch (see `docs/OPEN_QUESTIONS.md` #17). |

**No secrets are used or required by this frontend.** Nothing with real credentials should ever be added to a `NEXT_PUBLIC_*` variable (everything prefixed `NEXT_PUBLIC_` is shipped to the browser, by Next.js's own convention) or committed to this repo. When a real backend exists, expect a `NEXT_PUBLIC_API_BASE_URL` to be added here (`src/lib/api/http-client.ts` already reads that variable name, staged ahead of any real backend to point at).

## 10. Demo accounts

No real authentication exists (see §11). `/login` offers both a styled email/password form and a one-click "Continue as" picker. Any non-empty password works for a recognized email below.

| Email | Role |
|---|---|
| admin@brickbasket.co.in | admin |
| customer@brickbasket.co.in | customer |
| pm@brickbasket.co.in | project_manager |
| engineer@brickbasket.co.in | site_engineer |
| purchaser@brickbasket.co.in | purchaser |
| store@brickbasket.co.in | store_personnel |
| finance@brickbasket.co.in | finance |
| approver@brickbasket.co.in | approver |

Full detail (session model, TTL, logout, what's explicitly out of scope): `docs/AUTHENTICATION.md`.

## 11. Authentication limitation — read this before assuming anything about security

**The current login/session system is a frontend demo only, and is not a security boundary.** The session is a JSON object held in `localStorage`; any browser can fabricate one. No server verifies anything today because no server exists. This is documented in detail, with the exact backend responsibilities a real implementation must take on, in `docs/AUTHENTICATION.md` — read it in full before connecting a real backend. The short version: a real backend must independently re-verify every permission this frontend's route guards and `PermissionGuard`/`RoleGuard` components already check in the UI (those exist for UX — hiding/disabling controls, better error messages — never as the actual authorization boundary), must never trust an `actor`/`userId` field the frontend sends on a mutation (stamp "who did this" from the backend's own authenticated session, always), and must move real enforcement server-side (Next.js middleware + httpOnly cookies, or an equivalent) rather than relying on this app's client-side `AuthGuard`.

## 12. Backend handoff

This repo's `docs/` folder is the frontend/backend contract package. Read them in this order:

1. `docs/ARCHITECTURE.md` — the overall shape and the Component → Hook → Adapter boundary every module follows.
2. `docs/API_CONTRACTS.md` — the endpoint-by-endpoint contract, one section per module, each naming the exact request/response shape and backend responsibilities (id assignment, timestamps, computed fields, side effects, and — where one exists — the multi-step transaction an endpoint must perform atomically, e.g. Store Material Requisition's `/issue` and DPR's `PATCH /:id` reconciliation).
3. `docs/openapi.yaml` / `docs/OPENAPI.md` — the same contract as a machine-readable OpenAPI spec.
4. `docs/API_INTEGRATION_GUIDE.md` — the actual swap procedure: each of the 26 adapters in `src/lib/api/adapters/` has a `Mock*Adapter` implementing a plain TypeScript interface; connecting a real backend means writing a `*.rest-adapter.ts` implementing that same interface and flipping one export line — no component or hook needs to change.
5. `docs/DATA_MODELS.md` — every entity's fields, types, and relationships.
6. `docs/BACKEND_CLAUDE_HANDOFF.md` / `BACKEND_CLAUDE_HANDOFF_TEMPLATE.md` — written specifically for a separate backend developer/Claude session picking this up cold.
7. `docs/OPEN_QUESTIONS.md` — every frontend-invented decision that is not owner- or backend-confirmed, and every explicit backend requirement not yet built anywhere (this is the single most important file to read before assuming any workflow, status vocabulary, or permission model here is authoritative rather than a working default).

**A guardrail worth restating here**: the frontend must never become the authority for truth a real backend owns — stock availability, financial totals, permission enforcement. Everywhere this frontend computes or predicts such a thing client-side, it is explicitly labeled as a demo/UX convenience, not a real check, and the doc above it names what the backend must actually verify.

## 13. Public / portal / admin routes

Full inventory with the part/phase each route was built in: `docs/ROUTES.md`. Summary:

- **Public site** (`(public)` route group, no auth): `/`, `/about`, `/services`, `/plans`, `/portfolio`, `/how-it-works`, `/why-us`, `/faq`, `/contact`, `/login`.
- **Customer portal** (`(portal)/dashboard`, auth required, role `customer`): `/dashboard`, `/dashboard/projects`, `/dashboard/contracts[/:id]`, `/dashboard/documents`, `/dashboard/mrc[/:id]`, `/dashboard/payments`, `/dashboard/notifications`, `/dashboard/profile`.
- **Internal operations app** (`(internal)/admin`, auth required, every staff role): `/admin` (ops dashboard), then one section per module — Leads, Contracts, Documents, Vendors, Supply Chain (ACE/Requisitions/RFQs), Purchase Orders, Stores (GRN/Stock/Wastage/MRC/Material Requisitions), Project Management (Schedule/DPR), Finance (Project Cost/Payments/Bank & Cash/Taxes/Fixed Assets/GSTR/Cost-to-Complete), and the `/admin/cost-management` placeholder (see §14).

Route constants are centralized in `src/lib/constants/routes.ts` — no component hardcodes a path string.

## 14. Mock-data architecture

Every entity's data lives in `src/data/mock/*.ts` as a plain in-memory array, imported only by that entity's own adapter in `src/lib/api/adapters/*.ts` (never directly by a component or hook — see `docs/ARCHITECTURE.md` section G for the Component → Hook → Adapter boundary, and `docs/API_INTEGRATION_GUIDE.md` for the small number of remaining direct-import call sites still being migrated onto that boundary, tracked in `docs/OPEN_QUESTIONS.md` #44). Each `Mock*Adapter` simulates network latency (`await delay(ms)`) so loading states are exercised the same way they would be against a real backend, and mutates its own in-memory array — **nothing here persists across a full page reload; this is demo behavior, not storage.** A handful of adapters (`CostToCompleteAdapter`, `NotificationsAdapter`, `OpsMetricsAdapter`) have no mock-data file of their own at all — they compute a pure aggregate on every call by composing other adapters' own public methods, never touching a mock array directly.

## 15. API architecture

`src/lib/api/adapters/<module>-adapter.ts` — one file per module, each exporting: a plain TypeScript `interface` (the frontend/backend contract, matching `docs/API_CONTRACTS.md`'s corresponding section field-for-field), a `Mock*Adapter` class implementing it against mock data, and a singleton instance every hook imports. `src/lib/api/http-client.ts` is a shared `fetch()` wrapper staged ahead of any real backend — nothing imports it yet, since `NEXT_PUBLIC_API_BASE_URL` is unset — for the first real `*.rest-adapter.ts` to build on instead of hand-rolling request/response/error handling from scratch. See §12 for the actual cutover procedure.

## 16. Known limitations

- **No real authentication or authorization enforcement** — see §11. UX-only today.
- **No backend, database, or persistence** — every mutation lives only in the current browser tab's memory.
- **`npm install`/`build`/`typecheck`/`lint`/`test` were not verifiable from the environment this repository was most recently hardened in** — no npm registry access existed there (see §4). Every change made in that pass was checked by careful manual reading and static analysis scripts (brace/import-resolution checks, mock-data referential-integrity checks), never by an actual compile or test run. Treat any red flag from a real `npm install && npm run typecheck && npm run lint && npm test && npm run build` as a genuine bug report, not a surprise — this class of issue was explicitly out of that pass's ability to catch.
- **Several workflows encode frontend-invented business rules** (status vocabularies, approval models, permission-role assignments) that are not owner- or backend-confirmed — every one of them is named specifically in `docs/OPEN_QUESTIONS.md`, which is the single source of truth for "is this a real requirement or a frontend placeholder."
- **Store Material Requisition's `issue` action and DPR's Schedule-progress reconciliation** are both mock-only approximations of a real multi-step backend transaction — `docs/API_CONTRACTS.md` documents the exact atomic transaction a real backend must perform for each; the frontend does not, and must not, simulate real stock or progress truth client-side.
- **~26 adapters, 0 of them connected to anything real** — see §12 for the swap procedure once a backend exists.

## 17. Cost Management — pending specification

`/admin/cost-management` is a deliberate placeholder (`ModulePlaceholder`, no business logic) and **must remain one** until a detailed Excel specification is delivered by the client's own domain expert, Pushkar Tiwari (`docs/OPEN_QUESTIONS.md` #4). This is the one intentional placeholder route in the entire application — every other route either has real (if mock-backed) functionality or is explicitly documented as a narrower, named scope decision in `docs/OPEN_QUESTIONS.md`, never a silent stub. Do not infer Cost Management's business rules from adjacent finance modules (Project Cost Accounting, Payments, Taxes, Cost-to-Complete) — `docs/ARCHITECTURE.md` section D2 documents explicitly that those modules do not feed Cost Management and should not be treated as if they do.

## Where to look next

| Topic | Doc |
|---|---|
| Overall architecture & the adapter boundary | `docs/ARCHITECTURE.md` |
| Every module's business workflow/state machine | `docs/WORKFLOWS.md` |
| Data models, field-by-field | `docs/DATA_MODELS.md` |
| Backend API contract | `docs/API_CONTRACTS.md`, `docs/openapi.yaml` |
| Roles & permissions | `docs/ROLES_AND_PERMISSIONS.md` |
| Status vocabularies | `docs/STATUS_DEFINITIONS.md` |
| Error handling conventions | `docs/ERROR_HANDLING.md` |
| Validation rules | `docs/VALIDATION_RULES.md` |
| Testing | `docs/TESTING.md` |
| Everything not yet confirmed by the owner or backend | `docs/OPEN_QUESTIONS.md` |
| What changed, and when | `docs/CHANGELOG.md` |
| The most recent full stabilization pass | `docs/STABILIZATION_PASS_REPORT.md` |
