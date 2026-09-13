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
import { getTaxRecordStatus } from "@/components/finance/tax-record-math";
import { getExecutedQuantity, getPercentComplete, getProgressState, getDelayDays } from "@/components/schedule/schedule-progress-math";
import { LEAD_SOURCE_CONFIG } from "@/components/leads/lead-source-config";
import { ADMIN_ROUTES, PORTAL_ROUTES } from "@/lib/constants/routes";

/**
 * Adapter boundary for cross-module Notifications (Part 19). There is
 * **no mock data file of its own** — same "pure, render-time aggregate"
 * pattern `CostToCompleteAdapter` established in Part 18: this adapter
 * owns no records and composes eight other adapters' own public methods
 * only (never their mock arrays directly), the same cross-adapter
 * composition discipline `RFQAdapter.create`/`PurchaseOrdersAdapter.create`/
 * `CostToCompleteAdapter.getSummary` already established.
 *
 * **Permission → condition → message rule table** — every rule is gated
 * on a `PermissionKey` the viewing user must hold, so a notification
 * never suggests an action the user's role can't take (mirrors every
 * other module's `PermissionGuard` discipline):
 *
 *   customer   (`contracts:accept`) — own Contract `status === "sent_for_acceptance"`
 *   customer   (`mrc:accept`)       — own MRC `status === "issued"`
 *   staff      (`leads:read`)       — Lead `status === "new"`
 *   staff      (`requisitions:approve`) — Requisition `status === "submitted"`
 *   staff      (`po:approve:level1`)    — PO `status === "pending_approval_l1"`
 *   staff      (`po:approve:level2`)    — PO `status === "pending_approval_l2"`
 *   staff      (`po:issue`)             — PO `status === "approved"` (ready to release) or `"released"` (ready to issue)
 *   staff      (`grn:create`)           — PO `status === "issued"` with no GRN yet recorded against it (bulk-fetch-and-diff against `grnAdapter`, not a per-PO `purchaseOrderId` filter call — one list call each, cheaper for a mock dataset and for a real backend join alike)
 *   staff      (`finance:read`)         — TaxRecord `getTaxRecordStatus() === "overdue"`
 *   staff      (`schedule:read`)        — ScheduleActivity `getProgressState() === "overdue"`
 *
 * This rule table was sized specifically so every one of the 8 demo
 * personas (`src/lib/auth/mock-users.ts`) sees at least one real, live
 * notification from their own permission set — see
 * `docs/OPEN_QUESTIONS.md` #40 for the persona-by-persona trace.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 19) for full detail:
 *   GET /api/notifications — the full computed list for the signed-in user
 */
export interface NotificationsAdapter {
  getForUser(user: CurrentUser): Promise<AppNotification[]>;
}

const LARGE_PAGE = 500;

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
