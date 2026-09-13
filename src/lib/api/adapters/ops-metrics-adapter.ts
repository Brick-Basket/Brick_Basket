import type { OpsMetric } from "@/types/domain/ops-metric";
import type { CurrentUser } from "@/lib/auth/types";
import type { PermissionKey } from "@/lib/permissions/permissions";
import { leadsAdapter } from "@/lib/api/adapters/leads-adapter";
import { contractsAdapter } from "@/lib/api/adapters/contracts-adapter";
import { requisitionsAdapter } from "@/lib/api/adapters/requisitions-adapter";
import { purchaseOrdersAdapter } from "@/lib/api/adapters/purchase-orders-adapter";
import { grnAdapter } from "@/lib/api/adapters/grn-adapter";
import { taxRecordsAdapter } from "@/lib/api/adapters/tax-records-adapter";
import { scheduleAdapter } from "@/lib/api/adapters/schedule-adapter";
import { costToCompleteAdapter } from "@/lib/api/adapters/cost-to-complete-adapter";
import { getTaxRecordStatus, getTotalOverdue } from "@/components/finance/tax-record-math";
import { getExecutedQuantity, getPercentComplete, getProgressState } from "@/components/schedule/schedule-progress-math";
import { formatINR } from "@/lib/utils/format";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import { mockProjects } from "@/data/mock/projects";

/**
 * Adapter boundary for the Ops Dashboard's (`/admin`) cross-module metric
 * cards, Part 19. Same "pure, render-time aggregate, no mock data file of
 * its own" pattern `CostToCompleteAdapter` (Part 18) and
 * `NotificationsAdapter` (Part 19) already established — this adapter
 * composes seven other adapters' own public methods only, plus
 * `mockProjects` directly for the one metric that needs the full project
 * list to loop over (**FRONTEND IMPLEMENTATION DECISION** — Projects have
 * no adapter of their own anywhere in this app; every component that
 * needs the project list, including `AdminCostToCompletePage` in Part 18,
 * already imports `mockProjects` directly, so this adapter follows that
 * same existing precedent rather than inventing a `projectsAdapter` just
 * for this one metric — see `docs/OPEN_QUESTIONS.md` #40).
 *
 * Every metric is gated on the `PermissionKey` its underlying list view
 * requires — the dashboard never surfaces a count for a report the
 * viewing user can't open. Metrics currently defined:
 *
 *   `leads:read`          — New Leads (status "new")
 *   `contracts:read`      — Contracts Pending Acceptance (status "sent_for_acceptance")
 *   `requisitions:approve`— Requisitions Awaiting Approval (status "submitted")
 *   `po:approve:level1`   — POs Awaiting Level 1 Approval
 *   `po:approve:level2`   — POs Awaiting Level 2 Approval
 *   `po:issue`            — POs Ready to Release/Issue (status "approved" or "released")
 *   `grn:create`          — Issued POs Without a Goods Receipt
 *   `finance:read`        — Overdue Tax & Statutory (count + total amount, via `getTotalOverdue`)
 *   `finance:read`        — Projects Over Original Estimate (loops every project through `costToCompleteAdapter.getSummary`, the Part 18 callback named in this part's own build plan)
 *   `schedule:read`       — Schedule Activities Behind
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 19) for full detail:
 *   GET /api/ops-metrics — the full computed metric list for the signed-in user
 */
export interface OpsMetricsAdapter {
  getForUser(user: CurrentUser): Promise<OpsMetric[]>;
}

const LARGE_PAGE = 500;

class MockOpsMetricsAdapter implements OpsMetricsAdapter {
  async getForUser(user: CurrentUser): Promise<OpsMetric[]> {
    await delay(300);

    const has = (permission: PermissionKey) => user.permissions.includes(permission);
    const metrics: OpsMetric[] = [];

    if (has("leads:read")) {
      const { total } = await leadsAdapter.list({ status: "new", pageSize: 1 });
      metrics.push({ id: "new-leads", label: "New Leads", value: String(total), href: ADMIN_ROUTES.leads, tone: total > 0 ? "attention" : "neutral" });
    }

    if (has("contracts:read")) {
      const { total } = await contractsAdapter.list({ status: "sent_for_acceptance", pageSize: 1 });
      metrics.push({
        id: "contracts-pending-acceptance",
        label: "Contracts Pending Acceptance",
        value: String(total),
        href: ADMIN_ROUTES.contracts,
        tone: total > 0 ? "attention" : "neutral",
      });
    }

    if (has("requisitions:approve")) {
      const { total } = await requisitionsAdapter.list({ status: "submitted", pageSize: 1 });
      metrics.push({
        id: "requisitions-awaiting-approval",
        label: "Requisitions Awaiting Approval",
        value: String(total),
        href: ADMIN_ROUTES.requisitions,
        tone: total > 0 ? "attention" : "neutral",
      });
    }

    if (has("po:approve:level1")) {
      const { total } = await purchaseOrdersAdapter.list({ status: "pending_approval_l1", pageSize: 1 });
      metrics.push({
        id: "po-awaiting-l1",
        label: "POs Awaiting Level 1 Approval",
        value: String(total),
        href: ADMIN_ROUTES.purchaseOrders,
        tone: total > 0 ? "attention" : "neutral",
      });
    }

    if (has("po:approve:level2")) {
      const { total } = await purchaseOrdersAdapter.list({ status: "pending_approval_l2", pageSize: 1 });
      metrics.push({
        id: "po-awaiting-l2",
        label: "POs Awaiting Level 2 Approval",
        value: String(total),
        href: ADMIN_ROUTES.purchaseOrders,
        tone: total > 0 ? "attention" : "neutral",
      });
    }

    if (has("po:issue")) {
      const [approved, released] = await Promise.all([
        purchaseOrdersAdapter.list({ status: "approved", pageSize: 1 }),
        purchaseOrdersAdapter.list({ status: "released", pageSize: 1 }),
      ]);
      const total = approved.total + released.total;
      metrics.push({
        id: "po-ready-to-release-or-issue",
        label: "POs Ready to Release/Issue",
        value: String(total),
        href: ADMIN_ROUTES.purchaseOrders,
        tone: total > 0 ? "attention" : "neutral",
      });
    }

    if (has("grn:create")) {
      const [issuedResult, grnResult] = await Promise.all([
        purchaseOrdersAdapter.list({ status: "issued", pageSize: LARGE_PAGE }),
        grnAdapter.list({ pageSize: LARGE_PAGE }),
      ]);
      const posWithGRN = new Set(grnResult.items.map((g) => g.purchaseOrderId));
      const missing = issuedResult.items.filter((po) => !posWithGRN.has(po.id)).length;
      metrics.push({
        id: "issued-pos-without-grn",
        label: "Issued POs Without a Goods Receipt",
        value: String(missing),
        href: ADMIN_ROUTES.grn,
        tone: missing > 0 ? "attention" : "neutral",
      });
    }

    if (has("finance:read")) {
      const { items } = await taxRecordsAdapter.list({ pageSize: LARGE_PAGE });
      const overdueCount = items.filter((r) => getTaxRecordStatus(r) === "overdue").length;
      metrics.push({
        id: "overdue-tax-count",
        label: "Overdue Tax & Statutory",
        value: `${overdueCount} (${formatINR(getTotalOverdue(items))})`,
        href: ADMIN_ROUTES.taxes,
        tone: overdueCount > 0 ? "attention" : "neutral",
      });

      // Part 18 callback — same per-project CostToCompleteAdapter.getSummary
      // loop this part's build plan named explicitly.
      let overBudgetProjects = 0;
      for (const project of mockProjects) {
        const summary = await costToCompleteAdapter.getSummary(project.id);
        if (summary.totalVariance < 0) overBudgetProjects += 1;
      }
      metrics.push({
        id: "projects-over-original-estimate",
        label: "Projects Over Original Estimate",
        value: String(overBudgetProjects),
        href: ADMIN_ROUTES.costToComplete,
        tone: overBudgetProjects > 0 ? "attention" : "neutral",
      });
    }

    if (has("schedule:read")) {
      const { items } = await scheduleAdapter.list({ pageSize: LARGE_PAGE });
      let behindCount = 0;
      for (const activity of items) {
        const progress = await scheduleAdapter.listProgress(activity.id);
        const executed = getExecutedQuantity(progress);
        const percentComplete = getPercentComplete(activity, executed);
        if (getProgressState(activity, percentComplete) === "overdue") behindCount += 1;
      }
      metrics.push({
        id: "schedule-activities-behind",
        label: "Schedule Activities Behind",
        value: String(behindCount),
        href: ADMIN_ROUTES.schedule,
        tone: behindCount > 0 ? "attention" : "neutral",
      });
    }

    return metrics;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const opsMetricsAdapter: OpsMetricsAdapter = new MockOpsMetricsAdapter();
