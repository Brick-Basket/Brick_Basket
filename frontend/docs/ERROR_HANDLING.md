# Error Handling

Populated Part 20. This is the frontend's error-state vocabulary and its expectations of the backend's error responses — read alongside each module's own "Errors" line in `docs/API_CONTRACTS.md`, which this file generalizes rather than repeats.

## The two error surfaces

Every screen in this app hits one of exactly two error UI patterns, and nothing else:

1. **Whole-view failure** — a list, detail, or dashboard that couldn't load its data at all renders `<ErrorState variant="error" title="…" description={error} onRetry={refetch} />` (`src/components/domain/error-state.tsx`) in place of its normal content. `onRetry` calls the owning hook's `refetch()`, which bumps an internal `reloadToken` to re-run the same fetch — there is no exponential backoff or automatic retry anywhere; every retry is a deliberate user click.
2. **Inline form failure** — a create/edit form's submit failure renders a small inline banner just above its action buttons (`<AlertTriangle /> {submitError}`, a `border-error/30 bg-error/5 text-error` block — every `*-form.tsx` in the app uses this exact markup), instead of replacing the form. The form stays filled in exactly as the user left it; nothing is cleared on failure.

`ErrorState` also has a `variant="forbidden"` (a `ShieldAlert` icon instead of `AlertTriangle`, otherwise identical layout) reserved for exactly one caller: `AuthGuard` (`src/components/shell/auth-guard.tsx`), when a signed-in user's role isn't in a route's `allowedRoles`. No other component sets this variant — a permission failure inside an already-rendered page (as opposed to a whole blocked route) is handled by `PermissionGuard` simply not rendering the gated element at all, never by showing an error.

There is no toast/snackbar system anywhere in this app. Every error, success or otherwise, renders in place — a frontend scoping decision, not an owner requirement either way (not previously logged as an open question; added below as #41).

## Where errors originate: the adapter boundary

Every mock adapter method that can fail does so with a plain `throw new Error("human-readable message")` — 21 call sites across 16 adapter files as of Part 19, e.g. `"Purchase Order not found."`, `"Only a draft requisition can be submitted."`, `"Can't certify more than what was received (12 m³) for \"RMC M25\"."`. Two categories of failure exist today, both thrown as the same plain `Error`, with no error-code/type distinction between them:

- **Not-found** — the referenced id doesn't resolve to a record (`"Requisition not found."`, `"Purchase Order not found."`).
- **Invalid transition / business rule** — the record exists but the requested action doesn't apply to its current state (`"Only a draft MRC can be issued for customer acceptance."`, `"A GRN can only be recorded against an issued Purchase Order."`) or a cross-referenced value doesn't check out (`"One of the selected lines no longer belongs to this Purchase Order."`).

Every hook that calls a mutating adapter method (the `useCreate*`/`useUpdate*` family, e.g. `useCreateContract`) wraps the call in a `try`/`catch`, sets `status: "error"`, and stores `e instanceof Error ? e.message : "Could not <verb> <noun>. Please try again."` as the human-facing string — the adapter's own thrown message is used verbatim when it's a real `Error`, with a generic fallback only for the theoretical non-`Error` throw. **This is why every adapter's thrown message is written as end-user-facing prose, not an internal debug string** — it is never translated, wrapped, or looked up against a code before display.

## What this means for a real backend

A real backend must communicate the same two failure categories above, but as proper HTTP status codes and a structured body — a thrown JS string is a mock-only shortcut, not a contract to preserve. The convention already used consistently across every module's `docs/API_CONTRACTS.md` entry:

| Status | Meaning | Frontend expectation |
|---|---|---|
| `400` / `422` | Validation failure (a `docs/VALIDATION_RULES.md` rule violated server-side, or a malformed request) | Body should carry enough structure to attribute the error to a specific field where possible — the frontend today has no client for a structured `422` yet (mock adapters never return one distinct from `500`), so this is an open item, not an implemented mapping. See `docs/OPEN_QUESTIONS.md` #41. |
| `401` | Not authenticated / session expired | Should trigger the same "session expired" handling `docs/AUTHENTICATION.md` describes — today this is entirely client-side (a `localStorage` check), so there is no real `401` handling path yet either. |
| `403` | Authenticated but lacks the required permission | Route-level: render `<ErrorState variant="forbidden">`. Inline: should surface through the same inline-form-failure banner described above. |
| `404` | Record not found, or (for a customer-scoped resource) exists but isn't the caller's — **the two must be indistinguishable**, per the note already in every customer-facing contract (e.g. Contract Management's `GET /api/contracts/:id`): never return `403` for "that record exists but isn't yours," since that confirms the record's existence to someone who shouldn't be able to tell. | `<ErrorState title="… not found" />`, no retry action (retrying won't change the outcome). |
| `409` | Valid request, wrong state (the adapter's "invalid transition" category above — e.g. approving an already-approved requisition) | Inline banner, since this is always a mutation. The message should be specific enough to show directly (mirroring the mock adapters' own human-readable throw strings), not a generic "conflict." |
| `500` | Unexpected server failure | `<ErrorState variant="error" onRetry={refetch} />` for a load; inline banner with a generic message for a mutation. |

**No component in this app currently branches on a numeric status code at all** — every catch block treats every failure identically (extract `.message`, display it). A real REST adapter layer (see `docs/API_INTEGRATION_GUIDE.md`) is the right place to add that branching — for example, mapping a `401` response to a forced logout, rather than displaying it as if it were any other error string — without changing a single presentation component, since `ErrorState` and the inline-banner pattern only ever see a final message string today.

## Loading and empty states are not error states

Worth naming since the three are easy to conflate: `LoadingSkeleton`/`PageLoadingSkeleton` covers `status === "loading"`; `EmptyState` (a distinct component, not `ErrorState`) covers `status === "success"` with a zero-length result and always explains *why* it's empty and what to do about it (e.g. `GRNCreateForm`'s "No issued Purchase Orders yet" with a link to go create one) rather than a bare "no data"; `ErrorState` is reserved for `status === "error"` only. Every list/detail hook in the app exposes exactly these four states (`idle`/`loading`/`success`/`error`) and every consuming component switches on all of them — there is no module where a loading or empty state is silently skipped.

## Retry behavior

Summarized once here since it's identical everywhere: a failed **load** (`ErrorState`'s `onRetry`) always just re-runs the exact same fetch with the exact same params — there is no backoff, no retry limit, no distinction between a transient failure and a permanent one. A failed **mutation** has no retry button at all — the user re-submits the form themselves (nothing is cleared), which is indistinguishable from a fresh attempt. Neither pattern will survive contact with a real backend's rate limits or transient network errors unchanged; both are flagged as the minimum a REST adapter layer should improve on, not a confirmed final behavior — see `docs/OPEN_QUESTIONS.md` #41.
