# Frontend/Backend Handoff

Populated Part 20 — the final part of the original 20-part roadmap (`docs/PART_PROMPTS.md`). This is the practical, mechanical runbook for connecting a real backend to this frontend, plus the completed Integration Checklist that the master prompt names as this handoff's sign-off artifact. Read `docs/BACKEND_CLAUDE_HANDOFF.md` for the 22-point specification aimed at whoever *builds* the backend; read this file for what changes on the *frontend* side once that backend exists.

## Runbook: connecting a real backend

### 1. Provision the backend and get its base URL

Nothing here — pick a host, stand up the API described in `docs/openapi.yaml`/`docs/API_CONTRACTS.md`, and get a reachable base URL (`https://api.example.com`, or a local `http://localhost:PORT` for development).

### 2. Add the API base URL as an environment variable

`docs/ENVIRONMENT_VARIABLES.md` already flags this as the one variable this repo is missing: add `NEXT_PUBLIC_API_BASE_URL` (or a server-only equivalent, if the REST adapters end up calling the backend from server components/route handlers rather than the browser — a decision `docs/ARCHITECTURE.md` section G leaves open) to `.env.local` and to that file's table. **Never add a real credential or secret as a `NEXT_PUBLIC_*` variable** — anything with that prefix ships to the browser bundle in plain text; a backend API key, if one is ever needed client-side, needs a server-side proxy route instead.

### 3. Decide the auth wiring

This is the one piece with no confirmed shape yet — `docs/OPEN_QUESTIONS.md` #7 has been open since Part 3 and stays open through this handoff. Two concrete shapes are on the table, matching `docs/openapi.yaml`'s placeholder `sessionAuth` scheme (`docs/OPENAPI.md` explains why an httpOnly cookie was picked as *that file's* placeholder, not a decision made here):

- **httpOnly session cookie** — the backend sets it on login; the browser sends it automatically on every `fetch()` to the same site (or a CORS-configured cross-origin one, with `credentials: "include"`); no token ever touches JS. This is the shape that needs the least frontend rework, since `AuthProvider`'s existing `login()`/`logout()`/`useSession()` surface can stay the same shape — only what happens *inside* them changes (a real `fetch` to a `/api/auth/login` endpoint instead of a `localStorage` write).
- **Bearer JWT** — the backend returns a token on login; the frontend stores it (memory, not `localStorage`, if XSS exposure is a concern) and attaches `Authorization: Bearer <token>` to every REST adapter call. This needs an interceptor/wrapper at the REST-adapter layer (see step 4) to attach the header uniformly, and a refresh strategy for `docs/OPEN_QUESTIONS.md` #18's "no session-expiring-soon warning" gap.

Either way, **`AuthProvider`'s public interface (`session`, `login`, `logout`, `status`) doesn't need to change** — every component and hook already depends on that interface, never on `localStorage` directly (the same adapter-boundary discipline `docs/API_INTEGRATION_GUIDE.md` describes for data adapters). Swap `src/lib/auth/auth-adapter.ts`'s mock implementation for a real one, matching whichever shape is chosen above.

### 4. Follow `docs/API_INTEGRATION_GUIDE.md`'s per-module cutover

That file has the full checklist (25 adapters) and suggested dependency order. The short version: write a `*.rest-adapter.ts` per module implementing the same TypeScript interface the mock already does, swap one import line, repeat.

### 5. CORS (only relevant if the backend is a separate origin from the frontend)

If the backend is served from a different domain/port than the Next.js app, it needs to allow the frontend's origin with credentials (`Access-Control-Allow-Origin: <frontend origin>`, `Access-Control-Allow-Credentials: true` if using the cookie approach above). If the Next.js app instead proxies backend calls through its own route handlers (keeping everything same-origin from the browser's perspective), CORS is a non-issue and this step can be skipped entirely — an architecture decision for whoever owns the backend cutover, not one this frontend has made for them.

### 6. Re-run the verification this app already has

`npm run typecheck` and `npm run lint` (see `docs/TESTING.md` for why that's the *entire* current verification surface, and what a real backend cutover is a good moment to finally add).

## Suggested integration order

Matches `docs/API_INTEGRATION_GUIDE.md`'s own recommended order, restated at the handoff level: get auth wired first (nothing else is reachable without it in a real deployment, even though the mock frontend today runs every module with no server-side auth at all), then `Customers`/`Leads`, then work down the Requisition → RFQ → PO → GRN → MRC/GSTR chain, then Schedule → DPR, then the Finance modules, and leave the three pure-aggregate adapters (`CostToComplete`, `Notifications`, `OpsMetrics`) for last.

## Frontend/Backend Integration Checklist — sign-off

Every item below is the master prompt's own checklist, run against this repository as it stands at the end of Part 20. Each is marked with the evidence that supports it — this is a sign-off, not a promise; a future part or a real backend integration should re-verify anything it changes.

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Every API-dependent screen has a documented API dependency | ✅ | Every module's `docs/API_CONTRACTS.md` section names the exact endpoint(s) each frontend file/hook calls; `docs/openapi.yaml` mirrors the same 83 endpoints machine-readably. |
| 2 | Every API-shaped payload has a TypeScript type | ✅ | Every request/response body documented in `docs/API_CONTRACTS.md` names its frontend type (`CreateXInput`, `UpdateXInput`, the entity itself) from `src/types/domain/*.ts` — confirmed by direct inspection when building `docs/openapi.yaml`'s schemas this same part. |
| 3 | Mock data matches documented contracts | ✅ | Every adapter's interface *is* the contract (`docs/API_CONTRACTS.md`'s own framing: "the mock is the executable spec") — there is no separate mock data shape to drift from the docs, since the docs were written by reading the adapters, not the reverse. |
| 4 | Loading/empty/error states exist | ✅ | Every list/detail hook exposes `idle`/`loading`/`success`/`error`; every consumer renders `LoadingSkeleton`, `EmptyState`, or `ErrorState` accordingly — see `docs/ERROR_HANDLING.md`'s "loading and empty states are not error states" section, written this part after directly re-confirming the pattern holds everywhere. |
| 5 | Permission states exist where relevant | ✅ | `AuthGuard` (route-level), `PermissionGuard`/`RoleGuard` (inline) — see `docs/ROLES_AND_PERMISSIONS.md`'s "enforcement pattern" section and `docs/COMPONENT_GUIDE.md`'s Shell components list. |
| 6 | API calls isolated from presentation components | ✅ | The Component → Hook → Adapter boundary, enforced since Part 4 and re-confirmed by this part's `docs/API_INTEGRATION_GUIDE.md`: no component or hook calls `fetch()` directly, ever. |
| 7 | No secret/credential exposed | ✅ | `docs/ENVIRONMENT_VARIABLES.md` confirms zero secrets exist in this repo today, and states the `NEXT_PUBLIC_*` rule explicitly; re-stated in this file's step 2 above for the one new variable a real backend adds. |
| 8 | Backend responsibilities explicitly documented | ✅ | Nearly every mutating endpoint in `docs/API_CONTRACTS.md` has an explicit "Backend responsibility:" sentence (id/timestamp assignment, denormalization, never-trust-the-client actor fields, etc.). |
| 9 | Open questions recorded | ✅ | `docs/OPEN_QUESTIONS.md`, 41 numbered entries as of this part, covering every module — including this part's own findings (#41). |
| 10 | Cross-module relationships documented | ✅ | `docs/WORKFLOWS.md` (the Requisition→RFQ→PO→GRN chain, the DPR→Schedule push, the Contract/MRC accept-decline flows) and `docs/DATA_MODELS.md` (foreign-key relationships) both exist and are current. |
| 11 | Status transitions documented | ✅ | `docs/STATUS_DEFINITIONS.md` (every status enum's meaning) plus each module's `docs/API_CONTRACTS.md` section naming the exact status gate on every transition endpoint (e.g. "valid only from status: draft, 409 otherwise"). |
| 12 | File upload/document behavior documented | ✅ | `docs/FILE_UPLOADS.md` (upload flow, preview boundary, open items) plus `docs/API_CONTRACTS.md`'s Document Management section and this part's `docs/ERROR_HANDLING.md`/`docs/VALIDATION_RULES.md` cross-references. |
| 13 | Backend Claude can understand implementation without reading UI line-by-line | ✅ | `docs/BACKEND_CLAUDE_HANDOFF.md` (this part) synthesizes every other doc into one 22-point specification written specifically so a backend-focused session never needs to open a `.tsx` file. |
| 14 | README explains how to run the frontend | ✅ | `docs/README.md` — `npm install`/`dev`/`build`/`lint`/`typecheck`, confirmed complete and unchanged since it was written. |
| 15 | Handoff docs explain how to connect the backend | ✅ | This file's runbook (above) plus `docs/API_INTEGRATION_GUIDE.md`'s per-adapter procedure. |
| 16 | No undocumented business rule invented | ✅ | Every frontend-invented rule/decision across all 20 parts is named as such in `docs/OPEN_QUESTIONS.md` (41 entries) rather than presented as owner-confirmed — this is the single discipline this app's entire documentation set was built around, re-verified rather than re-established this part. |

Every row above is marked complete as of Part 20. A future change to any module should re-check the rows it touches, not assume this table stays accurate forever — it's a snapshot, not a standing guarantee.
