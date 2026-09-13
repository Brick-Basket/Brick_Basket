# OpenAPI Specification — Companion Guide

Populated Part 20; re-audited and extended in the post-Part-20 stabilization pass (Phase 20). `docs/openapi.yaml` is a machine-readable OpenAPI 3.1 rendering of every endpoint already documented in prose across `docs/API_CONTRACTS.md`. This file is the human-readable index to it — read it first if you're about to open the YAML for the first time.

## What's in it

- **89 paths** (139 operations across GET/POST/PATCH/PUT/DELETE), one per endpoint documented in `docs/API_CONTRACTS.md`, covering every module from Lead Management (Part 2/4) through the post-Part-20 stabilization pass's own new Store Material Requisition module (Phase 2) and Schedule bulk-progress endpoint (Phase 3). (Part 20 shipped with 83 paths/131 operations; the Phase 20 re-audit added the 6 paths/8 operations those two Phase 2/3 additions needed — see `docs/CHANGELOG.md`.)
- **101 component schemas** — every domain entity (`Lead`, `Contract`, `Vendor`, `PurchaseOrder`, `StoreRequisition`, …) plus its `Create*Input`/`Update*Input` request-body shape, built directly from the TypeScript interfaces in `src/types/domain/*.ts` (the actual ground truth — not re-derived from the prose docs, which summarize the same types). A shared `ErrorResponse` schema backs every documented `4xx`/`5xx` response.
- **A `sessionAuth` security scheme**, deliberately left as a placeholder — see "What's intentionally TBD" below.
- **A `servers` entry with `url: TBD`** — no backend has been provisioned, so there is nothing real to point at yet.

Every operation carries an `x-required-permission` extension naming the `PermissionKey` (`docs/ROLES_AND_PERMISSIONS.md`) it requires, mirroring the "— `module:action`" suffix on that endpoint's heading in `docs/API_CONTRACTS.md`. A value of `"none (Public)"` matches an endpoint explicitly marked **Public** there (only `POST /api/leads`); `"none (see operation description)"` marks the handful of endpoints gated only by *individual field-level* checks rather than one blanket permission (`GET /api/notifications`, `GET /api/ops-metrics` — see their descriptions).

## How to read it alongside the other docs

This file and `docs/API_CONTRACTS.md` describe the same 89 endpoints from two angles — prose narrative (workflow context, "backend responsibility" call-outs, cross-references to `docs/OPEN_QUESTIONS.md`) versus a strict machine-checkable shape (parameter types, exact required fields, response schemas). **Where the two ever disagree, `docs/API_CONTRACTS.md` is the source of truth** — it's the document every part actually reconciled with the shipped adapter code, while this YAML is a Part 20 rendering of it. If you find a mismatch, it's a bug in this file, not a sanctioned alternate contract; fix `docs/openapi.yaml` to match the prose, never the reverse.

For field-level validation rules beyond "which fields are required at the schema level" (conditional requirements, cross-field checks, the one hand-validated form) — see `docs/VALIDATION_RULES.md`, which this spec does not attempt to encode (OpenAPI/JSON Schema can express some of this with `oneOf`/conditional schemas, but doing so for every conditionally-required field across 25 modules would make the spec far harder to read for a marginal gain — a deliberate simplification, not an oversight).

## What's intentionally TBD, and why

Three things in this file are placeholders on purpose, matching `docs/OPEN_QUESTIONS.md`'s existing "don't invent a confirmed answer" discipline:

1. **`servers[0].url: "TBD"`** — no backend environment exists yet (see `docs/ENVIRONMENT_VARIABLES.md`'s own `NEXT_PUBLIC_API_BASE_URL` placeholder note).
2. **The `sessionAuth` security scheme** — modeled provisionally as an `apiKey`-in-cookie scheme with `name: "TBD"`, because `docs/OPEN_QUESTIONS.md` #7 has never resolved JWT-vs-server-session, and Part 3's mock auth is entirely client-side (`localStorage`) with no server verification to mirror. An httpOnly session cookie was picked as the placeholder shape (over a bearer JWT) only because #7's own text names it as the more likely real-backend answer — **this is a guess about which placeholder to draw, not a confirmed decision**; replace the whole scheme, not just its `name`, once #7 is actually answered.
3. **Every field/endpoint already marked as a frontend invention in `docs/OPEN_QUESTIONS.md`** carries the same status here implicitly — this spec documents what the mock adapters currently do, which is exactly what `docs/API_CONTRACTS.md` already flags as confirmed-vs-invented per module. This file doesn't re-flag each one; read the relevant `docs/API_CONTRACTS.md` section and `docs/OPEN_QUESTIONS.md` entry for that context.

## Validating changes to this file

There is no OpenAPI linter available in this environment (no network access to install one — `openapi-spec-validator` failed to install when attempted for this same part). Whoever edits `docs/openapi.yaml` next should:

1. Load it with `yaml.safe_load` (Python) to catch syntax errors — this is the check Part 20 actually ran.
2. Manually verify every `$ref` string resolves to a real `components.schemas` entry (a quick regex + set-difference check, same as this part did) — a broken ref is invisible to `safe_load` alone since YAML doesn't know about JSON Schema `$ref` semantics.
3. If real network access to a package registry becomes available later, run `openapi-spec-validator` or the `swagger-cli validate` npm package for full spec compliance — neither was reachable when this file was built.

## Endpoints intentionally absent from this file

Matching `docs/API_CONTRACTS.md`'s own two documented exceptions:

- **`GET .../line-items`/`GET .../lines` variants that only ever fetch, never mutate** are still included as their own path (they're real endpoints), but nothing here adds a corresponding write endpoint the frontend doesn't call.
- **Cost Management (`/admin/cost-management`)** has no path at all in this file, matching `docs/API_CONTRACTS.md`'s explicit "No endpoints" note — the owner's §8H instruction ("DO NOT invent this module's detailed business rules") means there is nothing to spec.
- **Global Search and Audit Timeline (Part 19)** introduced no new endpoints (both reuse existing `list({ search })` calls and existing audit-entry endpoints respectively), so neither adds a path beyond what its underlying module already contributes.
