# Notifications

Implemented Part 19. See `docs/OPEN_QUESTIONS.md` #10 for the still-open backend/channel question this build answers for the frontend only, and #40 for every other decision below.

## Model

`AppNotification` (`src/types/domain/notification.ts`) has **no persisted record and no mock data file of its own** — the same "pure, render-time computed aggregate" pattern `CostToComplete` established in Part 18. `NotificationsAdapter.getForUser(user)` (`src/lib/api/adapters/notifications-adapter.ts`) recomputes the full list on every call by composing eight other adapters' own public methods (never their mock arrays directly): `leadsAdapter`, `requisitionsAdapter`, `purchaseOrdersAdapter`, `grnAdapter`, `taxRecordsAdapter`, `scheduleAdapter`, `contractsAdapter`, `mrcAdapter`.

There is no "mark as read," no dismiss action, and nothing is ever deleted — a notification simply stops appearing in the next call once its underlying record no longer qualifies (a Requisition is no longer `"submitted"` once someone decides it; an overdue tax record disappears once it's paid).

## Channel

**In-app only.** No email, SMS, or WhatsApp delivery exists or is modeled — there is no backend event bus to build against yet, so this is the frontend's answer to `docs/OPEN_QUESTIONS.md` #10 for now, not a claim that the real product should stay in-app-only forever.

## Rule table

Every rule is gated on the exact `PermissionKey` its underlying report requires — a notification never suggests an action the viewing user's role can't take.

**Staff** (any non-`customer` role):

| Category | Permission | Condition | Message |
|---|---|---|---|
| `lead` | `leads:read` | `Lead.status === "new"` | "New lead: {name} ({source})" |
| `requisition` | `requisitions:approve` | `PurchaseRequisition.status === "submitted"` | "Requisition {number} is awaiting your approval" |
| `purchase_order` | `po:approve:level1` | `PurchaseOrder.status === "pending_approval_l1"` | "PO {number} is awaiting Level 1 approval" |
| `purchase_order` | `po:approve:level2` | `PurchaseOrder.status === "pending_approval_l2"` | "PO {number} is awaiting Level 2 approval" |
| `purchase_order` | `po:issue` | `status === "approved"` or `"released"` | "PO {number} is approved — ready to release" / "…released — ready to issue" |
| `grn` | `grn:create` | PO `status === "issued"` with no `GRN.purchaseOrderId` referencing it | "PO {number} was issued with no goods receipt recorded yet" |
| `tax` | `finance:read` | `getTaxRecordStatus(record) === "overdue"` | "{name} ({authority}) is overdue" |
| `schedule` | `schedule:read` | `getProgressState(activity, …) === "overdue"` | '"{activity}" is behind schedule by {n} day(s)' |

**Customer persona** (`role === "customer"`, scoped by `customerId === session.user.id`, the same no-separate-mapping-table convention every customer-scoped list already uses):

| Category | Permission | Condition | Message |
|---|---|---|---|
| `contract` | `contracts:accept` | own `Contract.status === "sent_for_acceptance"` | 'Contract {number} — "{title}" is awaiting your review' |
| `mrc` | `mrc:accept` | own `MRC.status === "issued"` | "Material Receipt Certificate {number} is awaiting your review" |

This table was sized specifically so every one of the 8 demo personas (`src/lib/auth/mock-users.ts`) sees at least one real, live notification from their own permission set.

## Consumers

`useNotifications()` (`src/hooks/use-notifications.ts`, 60s polling while mounted) is the single source every surface reads from, so none of them can disagree:

- `NotificationsMenu` — the Topbar bell, both shells, a compact dropdown.
- `/dashboard/notifications` — the customer portal's full list.
- `/dashboard` — Portal Home, top 5 + a "See all" link.
- `/admin` — Ops Dashboard's "Needs your attention" section, top 8.

`NotificationList` (`src/components/notifications/notification-list.tsx`) renders the full-width version shared by the last three; `NotificationsMenu` renders its own compact dropdown variant.
