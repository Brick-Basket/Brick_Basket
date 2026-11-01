import type { AppNotification } from "@/types/domain/notification";
import type { CurrentUser } from "@/lib/auth/types";
import type { PermissionKey } from "@/lib/permissions/permissions";
import { leadsAdapter } from "@/lib/api/adapters/leads-adapter";
import { requisitionsAdapter } from "@/lib/api/adapters/requisitions-adapter";
import { purchaseOrdersAdapter } from "@/lib/api/adapters/purchase-orders-adapter";
import { grnAdapter } from "@/lib/api/adapters/grn-adapter";
import { taxRecordsAdapter } from "@/lib/api/adapters/tax-records-adapter";
import { scheduleAdapter } from "@/lib/api/adapters/schedule-adapter";
import { contractsAdapter } from "@/lib/api/adapters/contracts-adapter";
import { mrcAdapter } from "@/lib/api/adapters/mrc-adapter";
import { projectsAdapter } from "@/lib/api/adapters/projects-adapter";
import { siteUpdatesAdapter } from "@/lib/api/adapters/site-updates-adapter";
import { paymentAdapter } from "@/lib/api/adapters/payments-adapter";
import { getTaxRecordStatus } from "@/components/finance/tax-record-math";
import { getExecutedQuantity, getPercentComplete, getProgressState, getDelayDays } from "@/components/schedule/schedule-progress-math";
import { LEAD_SOURCE_CONFIG } from "@/components/leads/lead-source-config";
import { ADMIN_ROUTES, PORTAL_ROUTES } from "@/lib/constants/routes";
import { formatINR, formatDate } from "@/lib/utils/format";

/**
 * Adapter boundary for cross-module Notifications (Part 19). There is
 * **no mock data file of its own** — same "pure, render-time aggregate"
 * pattern `CostToCompleteAdapter` established in Part 18: this adapter
 * owns no records and composes other adapters' own public methods
 * only (never their mock arrays directly), the same cross-adapter
 * composition discipline `RFQAdapter.create`/`PurchaseOrdersAdapter.create`/
 * `CostToCompleteAdapter.getSummary` already established.
 *
 * **Permission → condition → message rule table** — every rule is gated
 * on a `PermissionKey` the viewing user must hold, so a notification
 * never suggests an action the user's role can't take (mirrors every
 * other module's `PermissionGuard` discipline), with one deliberate
 * exception noted below:
 *
 *   customer   (`contracts:accept`)    — own Contract `status === "sent_for_acceptance"`
 *   customer   (`mrc:accept`)          — own MRC `status === "issued"`
 *   customer   (`site_updates:read`)   — latest visible `SiteUpdate` per own project (event, not a status — see below)
 *   customer   (`finance:read`)        — latest own `Payment` (`direction: "receipt"`) (event — see below)
 *   customer   (no permission gate — see below) — latest `ProjectProgressLogEntry` per own project (event — see below)
 *   staff      (`leads:read`)       — Lead `status === "new"`
 *   staff      (`requisitions:approve`) — Requisition `status === "submitted"`
 *   staff      (`po:approve:level1`)    — PO `status === "pending_approval_l1"`
 *   staff      (`po:approve:level2`)    — PO `status === "pending_approval_l2"`
 *   staff      (`po:issue`)             — PO `status === "approved"` (ready to release) or `"released"` (ready to issue)
 *   staff      (`grn:create`)           — PO `status === "issued"` with no GRN yet recorded against it (bulk-fetch-and-diff against `grnAdapter`, not a per-PO `purchaseOrderId` filter call — one list call each, cheaper for a mock dataset and for a real backend join alike)
 *   staff      (`finance:read`)         — TaxRecord `getTaxRecordStatus() === "overdue"`
 *   staff      (`schedule:read`)        — ScheduleActivity `getProgressState() === "overdue"`
 *
 * **The three customer rules added in the "Customer Module notifications"
 * follow-up pass (docs/OPEN_QUESTIONS.md #81) are events, not states.**
 * Unlike Contract/MRC acceptance, a new Site Update, Payment, or Progress
 * change has no "pending" status that later clears, so there's nothing to
 * test with `=== "some_status"`. A wall-clock "posted in the last N days"
 * window was considered and rejected — this mock dataset's seeded dates
 * are fixed historical values, not relative to whenever the app happens to
 * be opened, so a fixed window would silently show nothing once enough
 * real time passes. Instead, each rule surfaces only the single
 * **most-recent qualifying record** per project (Payments: overall, since
 * `/dashboard/payments` isn't per-project) — replaced the moment a newer
 * one exists, the same "shown while current, superseded by the next one"
 * shape the `po:issue` rule above already uses for "ready to release"/
 * "ready to issue". This is still frontend-only and in-app — nothing here
 * is persisted or marked "seen" (see this module's own caveat below and
 * `types/domain/notification.ts`'s header comment) — a real backend should
 * replace this with genuine per-user read-tracking against a persisted
 * notification record, not a "latest one" heuristic.
 *
 * The Progress rule also has **no permission gate**, deliberately: there
 * is no dedicated permission key for viewing a project's own progress
 * today — `/dashboard/projects` itself renders for any signed-in customer
 * with no `PermissionGuard` on the page — so this rule follows that
 * already-shipped decision rather than inventing a key nothing else
 * checks.
 *
 * This rule table was sized specifically so every one of the 8 demo
 * personas (`src/lib/auth/mock-users.ts`) sees at least one real, live
 * notification from their own permission set — see
 * `docs/OPEN_QUESTIONS.md` #40 for the persona-by-persona trace, and #81
 * for the three customer rules added after.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 19) for full detail:
 *   GET /api/notifications — the full computed list for the signed-in user
 */
export interface NotificationsAdapter {
  getForUser(user: CurrentUser): Promise<AppNotification[]>;
}

const LARGE_PAGE = 500;

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

class MockNotificationsAdapter implements NotificationsAdapter {
  async getForUser(user: CurrentUser): Promise<AppNotification[]> {
    await delay(300);

    const isCustomer = user.roles.includes("customer");
    const has = (permission: PermissionKey) => user.permissions.includes(permission);

    const notifications: AppNotification[] = [];

    if (isCustomer) {
      if (has("contracts:accept")) {
        const { items } = await contractsAdapter.list({ customerId: user.id, status: "sent_for_acceptance", pageSize: LARGE_PAGE });
        for (const c of items) {
          notifications.push({
            id: `contract:${c.id}`,
            category: "contract",
            severity: "warning",
            message: `Contract ${c.contractNumber} — "${c.title}" is awaiting your review`,
            createdAt: c.sentAt ?? c.updatedAt,
            href: `${PORTAL_ROUTES.contracts}/${c.id}`,
          });
        }
      }
      if (has("mrc:accept")) {
        const { items } = await mrcAdapter.list({ customerId: user.id, status: "issued", pageSize: LARGE_PAGE });
        for (const m of items) {
          notifications.push({
            id: `mrc:${m.id}`,
            category: "mrc",
            severity: "warning",
            message: `Material Receipt Certificate ${m.mrcNumber} is awaiting your review`,
            createdAt: m.issuedAt ?? m.updatedAt,
            href: `${PORTAL_ROUTES.mrc}/${m.id}`,
          });
        }
      }

      // Customer Module notifications follow-up (docs/OPEN_QUESTIONS.md
      // #81) — see this file's header comment for why these three rules
      // are shaped as "latest per project" rather than a status test.
      // `myProjects` is shared by the Site Update and Progress rules below,
      // so it's fetched once regardless of which permissions this user holds.
      const myProjects = await projectsAdapter.list({ customerId: user.id });

      if (has("site_updates:read") && myProjects.length > 0) {
        const { items } = await siteUpdatesAdapter.list({ visibleToCustomer: true, pageSize: LARGE_PAGE });
        for (const project of myProjects) {
          const latest = items
            .filter((u) => u.projectId === project.id)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
          if (!latest) continue;
          notifications.push({
            id: `site_update:${latest.id}`,
            category: "site_update",
            severity: "info",
            message: `New site update for "${project.name}" — ${truncate(latest.remarks, 80)}`,
            createdAt: latest.createdAt,
            href: PORTAL_ROUTES.siteUpdates,
          });
        }
      }

      if (has("finance:read")) {
        const { items } = await paymentAdapter.list({
          direction: "receipt",
          customerId: user.id,
          sortBy: "paymentDate",
          sortDir: "desc",
          pageSize: 1,
        });
        const latest = items[0];
        if (latest) {
          notifications.push({
            id: `payment:${latest.id}`,
            category: "payment",
            severity: "info",
            message: `A payment of ${formatINR(latest.amount)} was recorded against your account on ${formatDate(latest.paymentDate)}`,
            createdAt: latest.createdAt,
            href: PORTAL_ROUTES.payments,
          });
        }
      }

      if (myProjects.length > 0) {
        const logsByProject = await Promise.all(myProjects.map((p) => projectsAdapter.listProgressLog(p.id)));
        myProjects.forEach((project, index) => {
          const latest = logsByProject[index]?.[0];
          if (!latest) return;
          notifications.push({
            id: `project_progress:${latest.id}`,
            category: "project_progress",
            severity: "info",
            message: `"${project.name}" progress updated to ${latest.newPercentage}% on ${formatDate(latest.changedAt)}`,
            createdAt: latest.changedAt,
            href: PORTAL_ROUTES.projects,
          });
        });
      }

      // Sorted newest first — same convention every list below finishes with.
      notifications.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return notifications;
    }

    // Staff rules. Each block is independent — a user missing the
    // permission simply contributes nothing, never a partial/short-circuited result.
    if (has("leads:read")) {
      const { items } = await leadsAdapter.list({ status: "new", pageSize: LARGE_PAGE });
      for (const lead of items) {
        const sourceLabel = LEAD_SOURCE_CONFIG[lead.source]?.label ?? lead.source;
        notifications.push({
          id: `lead:${lead.id}`,
          category: "lead",
          severity: "info",
          message: `New lead: ${lead.name} (${sourceLabel})`,
          createdAt: lead.createdAt,
          href: ADMIN_ROUTES.leads,
        });
      }
    }

    if (has("requisitions:approve")) {
      const { items } = await requisitionsAdapter.list({ status: "submitted", pageSize: LARGE_PAGE });
      for (const r of items) {
        notifications.push({
          id: `requisition:${r.id}`,
          category: "requisition",
          severity: "warning",
          message: `Requisition ${r.requisitionNumber} is awaiting your approval`,
          createdAt: r.submittedAt ?? r.createdAt,
          href: `${ADMIN_ROUTES.requisitions}/${r.id}`,
        });
      }
    }

    if (has("po:approve:level1")) {
      const { items } = await purchaseOrdersAdapter.list({ status: "pending_approval_l1", pageSize: LARGE_PAGE });
      for (const po of items) {
        notifications.push({
          id: `po:${po.id}:l1`,
          category: "purchase_order",
          severity: "warning",
          message: `PO ${po.poNumber} is awaiting Level 1 approval`,
          createdAt: po.updatedAt,
          href: `${ADMIN_ROUTES.purchaseOrders}/${po.id}`,
        });
      }
    }

    if (has("po:approve:level2")) {
      const { items } = await purchaseOrdersAdapter.list({ status: "pending_approval_l2", pageSize: LARGE_PAGE });
      for (const po of items) {
        notifications.push({
          id: `po:${po.id}:l2`,
          category: "purchase_order",
          severity: "warning",
          message: `PO ${po.poNumber} is awaiting Level 2 approval`,
          createdAt: po.updatedAt,
          href: `${ADMIN_ROUTES.purchaseOrders}/${po.id}`,
        });
      }
    }

    if (has("po:issue")) {
      const [approvedResult, releasedResult] = await Promise.all([
        purchaseOrdersAdapter.list({ status: "approved", pageSize: LARGE_PAGE }),
        purchaseOrdersAdapter.list({ status: "released", pageSize: LARGE_PAGE }),
      ]);
      for (const po of approvedResult.items) {
        notifications.push({
          id: `po:${po.id}:release`,
          category: "purchase_order",
          severity: "info",
          message: `PO ${po.poNumber} is approved — ready to release`,
          createdAt: po.updatedAt,
          href: `${ADMIN_ROUTES.purchaseOrders}/${po.id}`,
        });
      }
      for (const po of releasedResult.items) {
        notifications.push({
          id: `po:${po.id}:issue`,
          category: "purchase_order",
          severity: "info",
          message: `PO ${po.poNumber} is released — ready to issue`,
          createdAt: po.updatedAt,
          href: `${ADMIN_ROUTES.purchaseOrders}/${po.id}`,
        });
      }
    }

    if (has("grn:create")) {
      const [issuedResult, grnResult] = await Promise.all([
        purchaseOrdersAdapter.list({ status: "issued", pageSize: LARGE_PAGE }),
        grnAdapter.list({ pageSize: LARGE_PAGE }),
      ]);
      const posWithGRN = new Set(grnResult.items.map((g) => g.purchaseOrderId));
      for (const po of issuedResult.items) {
        if (posWithGRN.has(po.id)) continue;
        notifications.push({
          id: `grn-missing:${po.id}`,
          category: "grn",
          severity: "urgent",
          message: `PO ${po.poNumber} was issued with no goods receipt recorded yet`,
          createdAt: po.updatedAt,
          href: `${ADMIN_ROUTES.purchaseOrders}/${po.id}`,
        });
      }
    }

    if (has("finance:read")) {
      const { items } = await taxRecordsAdapter.list({ pageSize: LARGE_PAGE });
      for (const record of items) {
        if (getTaxRecordStatus(record) !== "overdue") continue;
        notifications.push({
          id: `tax:${record.id}`,
          category: "tax",
          severity: "urgent",
          message: `${record.name} (${record.authority}) is overdue`,
          createdAt: record.dueDate,
          href: ADMIN_ROUTES.taxes,
        });
      }
    }

    if (has("schedule:read")) {
      const { items } = await scheduleAdapter.list({ pageSize: LARGE_PAGE });
      for (const activity of items) {
        const progress = await scheduleAdapter.listProgress(activity.id);
        const executed = getExecutedQuantity(progress);
        const percentComplete = getPercentComplete(activity, executed);
        if (getProgressState(activity, percentComplete) !== "overdue") continue;
        const delayDays = getDelayDays(activity, percentComplete);
        notifications.push({
          id: `schedule:${activity.id}`,
          category: "schedule",
          severity: "warning",
          message: `"${activity.activity}" is behind schedule by ${delayDays} day${delayDays === 1 ? "" : "s"}`,
          createdAt: activity.plannedEnd,
          href: ADMIN_ROUTES.schedule,
        });
      }
    }

    notifications.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return notifications;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const notificationsAdapter: NotificationsAdapter = new MockNotificationsAdapter();
