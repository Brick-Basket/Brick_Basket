"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useCostToComplete } from "@/hooks/use-cost-to-complete";
import { CostToCompleteSummary } from "@/components/cost/cost-to-complete-summary";
import { CostToCompleteTable } from "@/components/cost/cost-to-complete-table";
import { CostToCompleteBreakdownSheet } from "@/components/cost/cost-to-complete-breakdown-sheet";
import { useProjects } from "@/hooks/use-projects";
import type { CostToCompleteRow } from "@/types/domain/cost-to-complete";

export default function AdminCostToCompletePage() {
  return (
    <PermissionGuard
      permission="finance:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Cost-to-Complete" description="Ask an administrator for the finance:read permission." />
        </div>
      }
    >
      <AdminCostToCompleteContent />
    </PermissionGuard>
  );
}

function AdminCostToCompleteContent() {
  // Defaults to Modern Residence, the same "fullest seeded demo project"
  // convention Schedule (Part 13) and Project Cost Accounting (Part 15)
  // use — its 8 CostEntry categories and one issued Purchase Order
  // exercise every branch of the calculation below. No "All projects"
  // option, same reasoning as Schedule's project filter: a report mixing
  // several projects' unrelated category budgets into one table wouldn't
  // read as anyone's Cost-to-Complete.
  // Plain default id, not a live lookup — see the project-cost/schedule
  // pages' identical convention (BrickBasket final hardening pass, P2
  // mock import cleanup). The dropdown's actual option list below is
  // loaded through `useProjects`, not read directly from mock data.
  const [projectId, setProjectId] = useState<string | undefined>("proj_modern_residence");
  const [breakdownRow, setBreakdownRow] = useState<CostToCompleteRow | null>(null);

  const { projects } = useProjects();
  const { status, error, result, refetch } = useCostToComplete(projectId);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Cost-to-Complete</h1>
        <p className="text-sm text-ink-muted">
          Original Estimate, Completed-to-date, Balance-to-complete, Total Estimated Value and Variance by cost category —
          computed from Project Cost Accounting, Accepted Cost Estimate and Purchase Order history. Figures shown are
          illustrative demo data, not the owner&apos;s real numbers.
        </p>
      </div>

      <FilterBar>
        <Select
          value={projectId ?? ""}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full sm:w-56"
          aria-label="Select project"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </FilterBar>

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-28 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load the Cost-to-Complete report" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.rows.length === 0 && (
        <EmptyState
          title="No cost category has budget, estimate or order data yet"
          description="Add Accepted Cost Estimate items or a Project Cost Accounting budget for this project to see a Cost-to-Complete report."
        />
      )}

      {status === "success" && result && result.rows.length > 0 && (
        <>
          <CostToCompleteSummary summary={result} />
          <CostToCompleteTable rows={result.rows} onRowClick={setBreakdownRow} />
        </>
      )}

      <CostToCompleteBreakdownSheet row={breakdownRow} onClose={() => setBreakdownRow(null)} />
    </div>
  );
}
