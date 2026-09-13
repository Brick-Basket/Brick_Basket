"use client";

import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { findDemoUserById } from "@/lib/auth/mock-users";
import { LEAD_SOURCE_CONFIG } from "@/components/leads/lead-source-config";
import { LEAD_STATUS_CONFIG, LEAD_STATUS_ORDER } from "@/components/leads/lead-status-config";
import type { Lead, LeadStatus } from "@/types/domain/lead";

/**
 * Pipeline board grouped by `LeadStatus`. Deliberately no drag-and-drop —
 * that would add an unverified new dependency (e.g. dnd-kit) for a demo
 * interaction; each card has a status `Select` instead, which is fully
 * keyboard/screen-reader accessible for free. Revisit if the client
 * confirms drag-and-drop is required (see docs/CHANGELOG.md).
 */
export function LeadKanban({
  leads,
  onStatusChange,
  onView,
  busyLeadId,
}: {
  leads: Lead[];
  onStatusChange: (lead: Lead, next: LeadStatus) => void;
  onView: (lead: Lead) => void;
  busyLeadId?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {LEAD_STATUS_ORDER.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-heading text-sm font-semibold text-ink">{LEAD_STATUS_CONFIG[status].label}</h3>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-muted">
                {columnLeads.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {columnLeads.length === 0 && (
                <p className="rounded-card border border-dashed border-border p-4 text-center text-xs text-ink-muted">
                  No leads
                </p>
              )}
              {columnLeads.map((lead) => {
                const staff = lead.assignedTo ? findDemoUserById(lead.assignedTo) : null;
                const SourceIcon = LEAD_SOURCE_CONFIG[lead.source].icon;
                return (
                  <Card key={lead.id} className="p-3">
                    <button
                      type="button"
                      onClick={() => onView(lead)}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-medium text-ink">{lead.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{lead.subject}</p>
                    </button>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                      <SourceIcon className="h-3.5 w-3.5" aria-hidden />
                      {LEAD_SOURCE_CONFIG[lead.source].label}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{staff ? staff.name : "Unassigned"}</p>
                    <PermissionGuard permission="leads:write">
                      <Select
                        className="mt-2 h-8 text-xs"
                        value={lead.status}
                        disabled={busyLeadId === lead.id}
                        onChange={(e) => onStatusChange(lead, e.target.value as LeadStatus)}
                        aria-label={`Change status for ${lead.name}`}
                      >
                        {LEAD_STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {LEAD_STATUS_CONFIG[s].label}
                          </option>
                        ))}
                      </Select>
                    </PermissionGuard>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
