"use client";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { StatusBadge } from "@/components/domain/status-badge";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { findDemoUserById } from "@/lib/auth/mock-users";
import { LEAD_SOURCE_CONFIG } from "@/components/leads/lead-source-config";
import { LEAD_STATUS_CONFIG } from "@/components/leads/lead-status-config";
import type { Lead } from "@/types/domain/lead";

export function LeadTable({
  leads,
  sortBy,
  sortDir,
  onSortChange,
  onView,
  onEdit,
}: {
  leads: Lead[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
}) {
  const columns: DataTableColumn<Lead>[] = [
    {
      key: "name",
      header: "Lead",
      sortKey: "name",
      render: (lead) => (
        <div>
          <p className="font-medium text-ink">{lead.name}</p>
          <p className="text-xs text-ink-muted">{lead.email}</p>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (lead) => <span className="line-clamp-1">{lead.subject}</span>,
    },
    {
      key: "source",
      header: "Source",
      render: (lead) => LEAD_SOURCE_CONFIG[lead.source].label,
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (lead) => <StatusBadge status={lead.status} config={LEAD_STATUS_CONFIG} />,
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (lead) => {
        const staff = lead.assignedTo ? findDemoUserById(lead.assignedTo) : null;
        return staff ? staff.name : <span className="text-ink-muted">Unassigned</span>;
      },
    },
    {
      key: "createdAt",
      header: "Received",
      sortKey: "createdAt",
      render: (lead) => new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={leads}
      keyFor={(lead) => lead.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      onRowClick={onView}
      rowActions={(lead) => (
        <PermissionGuard permission="leads:write">
          <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
            Edit
          </Button>
        </PermissionGuard>
      )}
    />
  );
}
