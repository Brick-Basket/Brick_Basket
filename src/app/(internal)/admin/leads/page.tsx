"use client";

import { useState } from "react";
import { LayoutGrid, Plus, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useLeads, useTransitionLead } from "@/hooks/use-leads";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadKanban } from "@/components/leads/lead-kanban";
import { LeadForm } from "@/components/leads/lead-form";
import { LeadDetailDrawer } from "@/components/leads/lead-detail-drawer";
import type { Lead, LeadStatus } from "@/types/domain/lead";
import type { LeadListParams } from "@/lib/api/adapters/leads-adapter";

type ViewMode = "table" | "kanban";

const PAGE_SIZE = 10;
const KANBAN_PAGE_SIZE = 200; // large enough to show every lead across every column at once (demo dataset only)

export default function LeadsPage() {
  return (
    <PermissionGuard
      permission="leads:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState
            variant="forbidden"
            title="You don't have access to Lead Management"
            description="Ask an administrator for the leads:read permission."
          />
        </div>
      }
    >
      <LeadsPageContent />
    </PermissionGuard>
  );
}

function LeadsPageContent() {
  const [view, setView] = useState<ViewMode>("table");
  const [filters, setFilters] = useState<LeadListParams>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [formState, setFormState] = useState<{ mode: "create" | "edit"; lead?: Lead } | null>(null);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);

  const listParams: LeadListParams =
    view === "table" ? filters : { ...filters, page: 1, pageSize: KANBAN_PAGE_SIZE };
  const { status, error, result, refetch } = useLeads(listParams);
  const { submit: transition } = useTransitionLead();

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as LeadListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const handleKanbanStatusChange = async (lead: Lead, next: LeadStatus) => {
    if (next === lead.status) return;
    setBusyLeadId(lead.id);
    await transition(lead.id, next);
    setBusyLeadId(null);
    refetch();
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-ink">Lead Management</h1>
            <p className="text-sm text-ink-muted">
              Enquiries from the website, social media, calls/WhatsApp, and personal referrals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border p-0.5">
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("table")}
                aria-pressed={view === "table"}
              >
                <TableIcon className="h-4 w-4" aria-hidden />
                Table
              </Button>
              <Button
                variant={view === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("kanban")}
                aria-pressed={view === "kanban"}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden />
                Pipeline
              </Button>
            </div>
            <PermissionGuard permission="leads:write">
              <Button onClick={() => setFormState({ mode: "create" })}>
                <Plus className="h-4 w-4" aria-hidden />
                New Lead
              </Button>
            </PermissionGuard>
          </div>
        </div>

        <LeadFilters value={filters} onChange={setFilters} />

        {status === "loading" && (
          <div className="flex flex-col gap-3">
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-64 w-full" />
          </div>
        )}

        {status === "error" && (
          <ErrorState title="Could not load leads" description={error ?? undefined} onRetry={refetch} />
        )}

        {status === "success" && result && result.items.length === 0 && (
          <EmptyState
            title="No leads match these filters"
            description="Try clearing a filter, or check back once new enquiries come in."
          />
        )}

        {status === "success" && result && result.items.length > 0 && view === "table" && (
          <>
            <LeadTable
              leads={result.items}
              sortBy={filters.sortBy}
              sortDir={filters.sortDir}
              onSortChange={handleSortChange}
              onView={(lead) => setDetailLeadId(lead.id)}
              onEdit={(lead) => setFormState({ mode: "edit", lead })}
            />
            <Pagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          </>
        )}

        {status === "success" && result && result.items.length > 0 && view === "kanban" && (
          <LeadKanban
            leads={result.items}
            onStatusChange={handleKanbanStatusChange}
            onView={(lead) => setDetailLeadId(lead.id)}
            busyLeadId={busyLeadId}
          />
        )}
      </div>

      <LeadDetailDrawer
        leadId={detailLeadId}
        onClose={() => setDetailLeadId(null)}
        onEdit={(leadId) => {
          const lead = result?.items.find((l) => l.id === leadId);
          setDetailLeadId(null);
          if (lead) setFormState({ mode: "edit", lead });
        }}
      />

      <Dialog
        open={!!formState}
        onClose={() => setFormState(null)}
        title={formState?.mode === "edit" ? "Edit Lead" : "New Lead"}
        description={
          formState?.mode === "edit"
            ? "Update contact details, notes, or assignment."
            : "Log a lead captured manually — e.g. a phone call or walk-in."
        }
      >
        {formState && (
          <LeadForm
            mode={formState.mode}
            lead={formState.lead}
            onCancel={() => setFormState(null)}
            onSuccess={() => {
              setFormState(null);
              refetch();
            }}
          />
        )}
      </Dialog>
    </>
  );
}
