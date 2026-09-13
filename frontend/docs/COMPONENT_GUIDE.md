# Component Guide

Populated incrementally as each part ships. This is not an exhaustive API reference — it says what exists, where, and why, so a screen builder in a later part knows what to reuse instead of duplicating. Brought current in Part 19 after this file was found stale since Part 3 (still listing `DataTable`/`StatusBadge`/etc. as "Not yet built" long after they'd shipped) — kept up to date going forward whenever a part adds a genuinely reusable component.

## Primitives — `src/components/ui/` (Part 1–4)

`Button` (+ exported `buttonVariants` for styling a non-`<button>` element like `<Link>` identically), `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`, `Badge`, `Input`, `Textarea`, `Label`, `Checkbox`, `Select`, `FormField` (label + control + error/hint composition — every form field in the app should use this), `SearchInput`, `Dialog` (fixed `max-w-md`, Escape/overlay-click/close-button close, body-scroll-lock), `Sheet` (same close pattern, right-edge drawer).

## Domain components — `src/components/domain/` (Part 2–19)

`EmptyState`, `ErrorState` (`variant="error"` with optional retry, or `variant="forbidden"` for 403s — used by `AuthGuard`), `LoadingSkeleton` / `PageLoadingSkeleton`, `ModulePlaceholder` (temporary — one per unbuilt route, removed as each owning part ships), `DataTable` (Part 4 — sortable columns, `rowActions`, and a **built-in desktop-table/mobile-card responsive fallback** used by every list screen from Part 4 onward — never hand-roll a bare `<table>`), `FilterBar` (Part 4 — layout wrapper for a list page's filter controls), `Pagination` (Part 4), `StatusBadge<Status>` (Part 4 — generic status→label/tone pill; callers pass their own `Record<Status, {label, tone}>` config, carries no business vocabulary itself), `ConfirmationDialog` (Part 4 — confirm a destructive/irreversible action), `AuditTimeline<Entry>` (Part 19 — generic icon-circle + message + actorName·date read-only log renderer; `ContractAuditHistory`/`POAuditHistory`/`RequisitionAuditHistory`/`LeadActivityLog`'s read-only half are thin wrappers over this one component after being found byte-for-byte-identical markup — see `docs/OPEN_QUESTIONS.md` #40), `MetricCard` (Part 19 — generic dashboard metric tile; consolidates the master prompt's separately-named `StatCard`/`MetricCard` into one primitive, used by `/admin`'s metric grid).

## Shell components — `src/components/shell/` (Part 3, extended Part 19)

The application chrome for the two authenticated shells:

- `AppShell` — composes everything below around a protected route's content: a skip-to-content link (Part 19, targets `#main-content`), fixed desktop `Sidebar`, a mobile drawer (same nav data via `NavList`, no duplication), `Topbar`, `Breadcrumbs`. Takes a `variant` ("portal" | "admin") and shell-specific options (`showProjectSelector`, `profileHref`) — it no longer takes a `navGroups` prop (see below).
  - **FRONTEND IMPLEMENTATION DECISION (post-Part-20 fix):** `navGroups` used to be supplied by each layout (`admin/layout.tsx`, `dashboard/layout.tsx` — both Server Components) and passed down into `AppShell` (a Client Component). `NavItem.icon` holds a raw lucide-react component reference, and React refuses to serialize a function reference — or any object holding one — across the Server→Client prop boundary; this surfaced only at real runtime (`npm run dev`), never in this project's static verification, since none of it runs `tsc`/`next dev`. Fix: `AppShell` now imports `PORTAL_NAV`/`ADMIN_NAV` itself and picks the right one from its own `variant` prop, so the icon-bearing config is never passed as a prop across that boundary. Logged in `docs/OPEN_QUESTIONS.md` and `docs/CHANGELOG.md`.
- `Sidebar` / `NavList` — `nav-config.ts` defines `PORTAL_NAV` (flat) and `ADMIN_NAV` (grouped: Sales & Contracts, Vendors & Supply Chain, Stores, Project Management, Finance, Other) — each item optionally carries a `PermissionKey`; items without one are visible to any signed-in shell user. `NavList` is the shared markup rendered by both the desktop `Sidebar` and `AppShell`'s mobile drawer.
- `Topbar` — mobile menu toggle, `ProjectSelector`, `GlobalSearch` (Part 19), `NotificationsMenu`, `UserMenu`.
- `GlobalSearch` (Part 19) — `Cmd/Ctrl+K` command palette, hand-rolled rather than built on `Dialog`/`Sheet` (neither fits the wider-panel/arrow-key-navigation interaction this needs). Debounced 300ms; searches the entity list in `global-search-config.ts` (`runGlobalSearch`) — 7 entities for staff, 2 for the customer persona, each reusing its own adapter's existing `search` param.
- `Breadcrumbs` — derives crumbs from the pathname, using `ADMIN_NAV`/`PORTAL_NAV` labels where the segment matches a known route, humanizing unknown segments as a fallback.
- `ProjectSelector` — reads/writes `ProjectContext` (`src/components/providers/project-provider.tsx`), mock-backed today.
- `NotificationsMenu` — bell + dropdown, now backed by real cross-module data (`useNotifications()`, Part 19) instead of Part 3's demo `items` prop — see `docs/NOTIFICATIONS.md`.
- `UserMenu` — avatar/name/role, Profile link (portal only, via `profileHref`), Sign out.
- `AuthGuard` — route-level auth boundary, see `docs/AUTHENTICATION.md`.
- `RoleGuard` / `PermissionGuard` — inline conditional rendering for role- or permission-gated content within a page (as opposed to `AuthGuard`'s whole-route gating).

## Notifications components — `src/components/notifications/` (Part 19)

`notification-category-config.ts` (icon/label per `NotificationCategory`, severity→tone map — business-vocabulary container, same spirit as `LEAD_SOURCE_CONFIG`), `NotificationList` (full-width list, shared by `/dashboard`, `/dashboard/notifications`, `/admin` — `NotificationsMenu` renders its own compact dropdown variant instead, both reading the same `useNotifications()` hook).

## Marketing components — `src/components/marketing/` (Part 2)

`SiteHeader`, `SiteFooter`, `PageBanner` (red interior-page banner + breadcrumb, used by every public page except Home), `SectionHeading`, `FaqAccordion`, `PortfolioGrid`, `ContactForm`, `PublicPagePlaceholder` (temporary).

## Brand components — `src/components/brand/` (brand update)

`Logo` — icon image + live CSS text wordmark, `variant="light"|"dark"`, see `docs/BRAND_GUIDELINES.md`.

## Auth components — `src/components/auth/` (Part 3)

`LoginForm` — demo email/password + "continue as" persona picker, see `docs/AUTHENTICATION.md`.

## Providers — `src/components/providers/` (Part 3)

`AuthProvider` (mounted once at the root layout — see `docs/AUTHENTICATION.md`), `ProjectProvider` (mounted per protected shell layout, scopes the mock project list to the signed-in user).

## Feature-module components

Each domain module (`src/components/leads/`, `contracts/`, `documents/`, `vendors/`, `ace/`, `requisitions/`, `rfq/`, `po/`, `grn/`, `stock/`, `wastage/`, `mrc/`, `schedule/`, `dpr/`, `cost/`, `payments/`, `bank/`, `finance/`) has its own `*-form`/`*-table`/`*-filters`/`*-config`/`*-math` files, built as each part shipped — not enumerated here individually since they're not intended for reuse outside their own module. See each part's `docs/CHANGELOG.md` entry for what shipped when.

## Known intentional non-consolidations

Not every visually-similar pair of components is a duplication worth merging — flagged here so a later part doesn't "fix" something that was already deliberately kept separate:

- `VendorAssessmentHistory` (ratings-grid cards) and `DocumentVersionHistory` (file-metadata version cards) look like they could join `AuditTimeline`'s consolidation (Part 19) but were checked and are genuinely different data shapes — left alone.
- `Dialog`/`Sheet` vs. `GlobalSearch`'s own overlay (Part 19) — `GlobalSearch` needed a wider centered panel and real keyboard-list navigation neither existing primitive supports, so it hand-rolls its own close/body-scroll-lock logic rather than force-fitting one of them.
