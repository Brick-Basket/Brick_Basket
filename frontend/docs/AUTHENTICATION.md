# Authentication

**Status: mock/demo implementation (Part 3).** This document is the contract the backend's real auth must satisfy — not a description of production security, which does not exist yet in this repository.

## Abstract session shape the frontend is built against

```ts
interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];             // src/lib/permissions/permissions.ts
  permissions: PermissionKey[];
}

interface Session {
  user: CurrentUser;
  expiresAt: string;         // ISO timestamp
}
```

Defined in `src/lib/auth/types.ts`. Any real backend auth response must be adaptable to this shape (or this shape changes in this one file, and every consumer — AuthProvider, AuthGuard, guards, UserMenu — updates from a single source).

## Current (mock) implementation

- `src/lib/auth/auth-adapter.ts` — `MockAuthAdapter`, storing the session as JSON in `localStorage` under `brickbasket.session`. **This is not a security boundary.** There is no server verifying anything; any browser can fabricate a session object. It exists purely so the UI's permission-aware behavior (nav filtering, RoleGuard/PermissionGuard, protected routes) can be built and demonstrated ahead of a real backend.
- `src/lib/auth/mock-users.ts` — a fixed directory of one demo account per role (see table below). Any non-empty password is accepted for a recognized email; passwords are never actually checked.
- Session TTL is a **frontend demo value**: 2 hours (`SESSION_TTL_MS` in `auth-adapter.ts`), deliberately short enough that expiry behavior (see below) is observable, not a business rule.
- `src/components/providers/auth-provider.tsx` — `AuthProvider` (mounted once, at the root layout) exposes `{ status: "loading" | "authenticated" | "unauthenticated", session, login, logout }` via context (`useSession()`). It reads the stored session on mount (hence the initial `"loading"` status — a real localStorage read can't happen during SSR) and polls every 60s to catch a session that expires while the tab stays open.

## Login flow

`/login` (`src/app/(public)/login/page.tsx` + `src/components/auth/login-form.tsx`) offers two entry points, both clearly labeled as demo mode:

1. An email/password form styled like a real login, checked only against the mock user directory.
2. A "Continue as" quick-picker — one button per demo persona — so every role's permission-gated UI can be exercised without memorizing an email.

On success, the user is redirected to `?next=` (set by AuthGuard when it bounced them to `/login`) or their role's shell home (`customer` → `/dashboard`, every staff role → `/admin`).

| Demo account | Role |
|---|---|
| admin@brickbasket.co.in | admin |
| customer@brickbasket.co.in | customer |
| pm@brickbasket.co.in | project_manager |
| engineer@brickbasket.co.in | site_engineer |
| purchaser@brickbasket.co.in | purchaser |
| store@brickbasket.co.in | store_personnel |
| finance@brickbasket.co.in | finance |
| approver@brickbasket.co.in | approver |

## Protected routes

`src/components/shell/auth-guard.tsx` wraps the `(portal)/dashboard` and `(internal)/admin` layouts:

- `status === "loading"` → full-page skeleton (`PageLoadingSkeleton`), never a premature redirect.
- `status === "unauthenticated"` → client-side redirect to `/login?next=<attempted path>`.
- Authenticated but role not permitted in this shell → a 403 `ErrorState` (not a redirect loop — the user IS signed in, they simply can't be here). Portal is `customer`-only; Admin is every staff role (`STAFF_ROLES` in `permissions.ts`).
- Otherwise → render the shell/children.

This is **UX convenience, not the security boundary** — a determined client can bypass all of it. The backend must independently reject every unauthorized request regardless of what this component hides or redirects.

## Session-expiry behavior

The `AuthProvider` polling interval detects an expired session (checked against `expiresAt`) and flips `status` to `"unauthenticated"`, which `AuthGuard` then redirects on exactly like a fresh sign-out. There is currently no "your session is about to expire" warning or silent refresh — TBD, see Open Questions.

## Logout behavior

`UserMenu` → Sign out calls `logout()` (clears the stored session) and redirects to the public home page (`/`).

## Explicitly out of scope here (backend-owned)

- Real credential verification, password hashing, MFA.
- Token issuance/refresh (JWT vs. server session — **Open Question #7**).
- Password reset / account recovery flow (no UI exists yet for this).
- Server-side session verification / middleware-level route protection (the current guard is entirely client-side, by design, since there is no backend to verify against yet — a production implementation should move enforcement server-side, e.g. Next.js middleware + httpOnly cookies, in addition to keeping this client-side guard for UX).

## The mock "actor" argument — do not treat as a security boundary (Phase 11, post-Part-20 stabilization pass)

Every mutation hook/adapter method that records "who did this" (`createEntry(payload, actor)`, `{ id: session.user.id, name: session.user.name }`, etc.) takes an explicit `actor: { id: string; name: string }` argument supplied by the *calling component*, read straight out of `useSession()`. This exists only because the mock adapters have no server session to read from — it is a stand-in for "the backend already knows who's calling," not a design the REST adapters should copy.

**When a real backend adapter replaces a mock one, `actor` must NOT become a client-supplied request field.** A REST adapter must:

- Derive `currentUser`/`currentRole`/`permissions` for every request from the authenticated session/token the backend itself validates (cookie, bearer JWT — see Open Question #7), never from a value the frontend sends.
- Stamp any "created by"/"updated by"/audit-trail actor server-side, from that same authenticated identity — never trust a `userId`/`actorId` field submitted in the request body or query string.
- Independently re-check every permission the frontend's `RoleGuard`/`PermissionGuard`/`usePermission()` already gated in the UI. Frontend permission checks are UX only (hide/disable, better error messaging); the backend is the sole authorization boundary, exactly as `docs/ARCHITECTURE.md` section C already states for roles — this extends the same rule to the "who performed this action" identity, not just "is this action allowed."

Concretely: it is fine for a REST adapter's function signature to keep accepting `actor` during the transition (so call sites don't all need to change at once), as long as the actual HTTP request never puts it on the wire as trusted data — either drop the parameter from the request payload entirely (the backend already knows who's calling from the session) or, if a display name is genuinely needed client-side before the response comes back, send only the session token and let the backend return the authoritative actor identity in its response.

## Open items

See `docs/OPEN_QUESTIONS.md` #7 (session/token model) — new items from this part:

- No "session expiring soon" warning or silent refresh is implemented (frontend decision to keep Part 3 scoped — revisit if the real backend session model needs it).
- Demo session TTL (2h) is a frontend value, not a confirmed business rule for real session length.
